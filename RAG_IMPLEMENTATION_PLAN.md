# ScholarFlow — RAG Implementation Plan (Phase 6)

## What we're building

Replace the AI assistant's "context stuffing" approach (injecting all paper abstracts into every prompt) with true **Retrieval-Augmented Generation** using:

- **pgvector** — vector similarity search inside the existing Neon Postgres database (no new service)
- **HuggingFace Inference API** — free embeddings via `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
- **Recursive word-level chunking** — 384-word chunks with 38-word overlap (benchmark-optimal for academic papers)

When a PDF is uploaded via Full-Text Queue, the text is split into chunks and each chunk is embedded and stored. When the user asks the AI assistant a question, the query is embedded and the top-5 most relevant chunks across all papers in the project are retrieved and injected into the prompt — meaning the AI reads the actual paragraphs from the paper most relevant to the question, not just the abstract.

---

## Prerequisites

### 1. Get a HuggingFace API key (free)
1. Go to [huggingface.co](https://huggingface.co) and create a free account
2. Go to **Settings → Access Tokens → New token**
3. Name it `scholarflow`, role = **Read**, copy the token
4. Add to `server/.env`:
   ```
   HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 2. Enable pgvector on Neon
Run this once in the **Neon SQL Editor** (dashboard → SQL Editor):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
> Neon supports pgvector on all plans including free. This is a one-time command.

### 3. Install the pgvector Node.js helper
```bash
cd server
npm install pgvector
```
This package provides `pgvector.toSql()` to convert a float array into the Postgres `vector` literal format.

---

## Phase 6 — Step-by-Step Implementation

### Step 1 — Add `paper_chunks` to the Prisma schema

**File:** `server/prisma/schema.prisma`

Add the `postgresqlExtensions` preview feature and the `vector` extension, then add the new model:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

Add at the bottom of the schema:

```prisma
model PaperChunk {
  id         String   @id @default(cuid())
  paperId    String
  projectId  String
  chunkIndex Int
  text       String
  embedding  Unsupported("vector(384)")
  createdAt  DateTime @default(now())

  paper      Paper    @relation(fields: [paperId], references: [id], onDelete: Cascade)

  @@index([paperId])
  @@index([projectId])
  @@map("paper_chunks")
}
```

Also add the reverse relation to `Paper`:
```prisma
model Paper {
  // ... existing fields ...
  chunks     PaperChunk[]
}
```

Run the migration:
```bash
cd server
npx prisma migrate dev --name add_paper_chunks_pgvector
npx prisma generate
```

---

### Step 2 — Create the chunker

**New file:** `server/src/features/rag/chunker.js`

```js
// Splits plain text into overlapping word-based chunks.
// 384 words ≈ 512 tokens (optimal for sentence-transformers/all-MiniLM-L6-v2).
// 10% overlap prevents context being cut at chunk boundaries.

const CHUNK_WORDS   = 384;
const OVERLAP_WORDS = 38;
const MIN_WORDS     = 40; // discard headers / page-number fragments

export function chunkText(text) {
  const words  = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + CHUNK_WORDS);
    if (slice.length >= MIN_WORDS) {
      chunks.push(slice.join(' '));
    }
    i += CHUNK_WORDS - OVERLAP_WORDS;
  }

  return chunks;
}
```

---

### Step 3 — Create the embedder

**New file:** `server/src/features/rag/embedder.js`

```js
// Calls the HuggingFace Inference API to generate 384-dim embeddings.
// Model: sentence-transformers/all-MiniLM-L6-v2 (free, fast, high quality).
// Batches inputs in groups of 32 to stay within API limits.
// Retries once on 503 (model loading cold-start).

const HF_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';

async function callHF(texts, attempt = 1) {
  const res = await fetch(HF_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ inputs: texts }),
  });

  if (res.status === 503 && attempt === 1) {
    // Model is loading (cold start on free tier) — wait and retry once
    await new Promise(r => setTimeout(r, 20000));
    return callHF(texts, 2);
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HuggingFace API error ${res.status}: ${msg}`);
  }

  return res.json(); // float[][] — one 384-dim array per input string
}

export async function embedTexts(texts) {
  if (!process.env.HF_API_KEY) throw new Error('HF_API_KEY is not set');

  const BATCH = 32;
  const all   = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch  = texts.slice(i, i + BATCH);
    const result = await callHF(batch);
    all.push(...result);
    // Respect free-tier rate limits between batches
    if (i + BATCH < texts.length) await new Promise(r => setTimeout(r, 1000));
  }

  return all; // float[][]
}
```

---

### Step 4 — Create the RAG service

**New file:** `server/src/features/rag/rag.service.js`

```js
import { createId } from '@paralleldrive/cuid2';
import pgvector from 'pgvector';
import prisma from '../../config/prisma.js';
import { chunkText }   from './chunker.js';
import { embedTexts }  from './embedder.js';

// Called after PDF parse — chunks + embeds the paper and stores in paper_chunks.
// Deletes any existing chunks for this paper first (handles re-upload).
export async function indexPaper(paperId, projectId, rawText) {
  // Remove old chunks
  await prisma.paperChunk.deleteMany({ where: { paperId } });

  const chunks     = chunkText(rawText);
  if (chunks.length === 0) return;

  const embeddings = await embedTexts(chunks);

  // Insert each chunk with its embedding via raw SQL (Prisma doesn't support vector type natively)
  for (let i = 0; i < chunks.length; i++) {
    const vec = pgvector.toSql(embeddings[i]);
    await prisma.$executeRaw`
      INSERT INTO paper_chunks (id, paper_id, project_id, chunk_index, text, embedding, created_at)
      VALUES (
        ${createId()},
        ${paperId},
        ${projectId},
        ${i},
        ${chunks[i]},
        ${vec}::vector,
        NOW()
      )
    `;
  }
}

// Called on every AI chat message — finds the top-k most relevant chunks.
export async function retrieveChunks(projectId, queryText, topK = 5) {
  const [queryEmbedding] = await embedTexts([queryText]);
  const vec = pgvector.toSql(queryEmbedding);

  const rows = await prisma.$queryRaw`
    SELECT
      pc.text,
      pc.paper_id   AS "paperId",
      p.title,
      1 - (pc.embedding <=> ${vec}::vector) AS similarity
    FROM paper_chunks pc
    JOIN papers p ON p.id = pc.paper_id
    WHERE pc.project_id = ${projectId}
    ORDER BY pc.embedding <=> ${vec}::vector
    LIMIT ${topK}
  `;

  return rows; // [{ text, paperId, title, similarity }]
}
```

---

### Step 5 — Update the extraction service to index papers

**File:** `server/src/features/extraction/extraction.service.js`

After saving `rawText` and running Groq extraction (around line 113), replace the current "clear rawText" call with indexing:

**Remove:**
```js
// Clear rawText to save DB space after extraction
await prisma.paper.update({
  where: { id: paperId },
  data:  { rawText: null },
});
```

**Replace with:**
```js
// Index paper into pgvector for RAG (runs in background — don't await to avoid blocking response)
import { indexPaper } from '../rag/rag.service.js';

indexPaper(paperId, projectId, rawText).catch(err =>
  console.error('[RAG] Indexing failed for paper', paperId, err.message)
);

// Clear rawText after handing off to RAG indexer
await prisma.paper.update({
  where: { id: paperId },
  data:  { rawText: null },
});
```

> Note: `indexPaper` is fired-and-forgotten so the PDF upload response returns immediately. The user sees "Extracted" while embedding happens in the background (takes 5–30 seconds for a typical paper).

---

### Step 6 — Update the AI service to use RAG retrieval

**File:** `server/src/features/ai/ai.service.js`

Add the import at the top:
```js
import { retrieveChunks } from '../rag/rag.service.js';
```

Inside the `chat` function, after fetching papers, add retrieval:

```js
// Retrieve relevant chunks via pgvector cosine similarity
let ragContext = '';
try {
  const chunks = await retrieveChunks(projectId, userMessage, 5);
  if (chunks.length > 0) {
    ragContext = '\n\n--- RETRIEVED PASSAGES (most relevant to this question) ---\n' +
      chunks.map((c, i) =>
        `[Passage ${i + 1} from: ${c.title} · Relevance: ${Math.round(c.similarity * 100)}%]\n${c.text}`
      ).join('\n\n');
  }
} catch (err) {
  // RAG unavailable — fall back to context-stuffing silently
  console.warn('[RAG] Retrieval failed, falling back to context stuffing:', err.message);
}
```

Then add `ragContext` to the system prompt:

```js
const systemPrompt = `You are a research assistant for "${project.name}".

PAPER CORPUS (all papers — titles and abstracts):
${buildCorpusContext(papers)}${buildExtractionContext(papers)}${ragContext}

Rules:
- Prefer the RETRIEVED PASSAGES above when answering — they contain exact text from the papers.
- Only reference papers listed in the corpus. Never invent citations.
- When citing, include the paper ID e.g. [ID:abc123].
- Be concise and academic in tone.`;
```

---

### Step 7 — Add `HF_API_KEY` to env validation

**File:** `server/src/config/env.js`

Add `HF_API_KEY` to the list of required variables — or make it optional with a warning:

```js
// Optional — RAG features are disabled if not set
if (!process.env.HF_API_KEY) {
  console.warn('[RAG] HF_API_KEY not set — RAG retrieval disabled, falling back to context stuffing');
}
```

**File:** `.env.example` — add:
```
# ── HuggingFace (RAG embeddings) ─────────────────────────────
# Free account at huggingface.co → Settings → Access Tokens
HF_API_KEY=hf_your_token_here
```

---

### Step 8 — Add a re-index endpoint (optional but useful)

Lets you trigger re-embedding for a paper that was uploaded before RAG was added.

**File:** `server/src/features/extraction/extraction.routes.js` — add:
```
POST /api/projects/:id/papers/:pid/reindex
```

This endpoint reads `rawText` from the DB (if it still exists) and calls `indexPaper`. For papers where `rawText` was already cleared, the user needs to re-upload the PDF.

---

## File Summary

### New files
```
server/src/features/rag/
  chunker.js          # chunkText(rawText) → string[]
  embedder.js         # embedTexts(strings[]) → float[][]
  rag.service.js      # indexPaper() + retrieveChunks()
RAG_IMPLEMENTATION_PLAN.md   (this file)
```

### Modified files
```
server/prisma/schema.prisma             # add PaperChunk model + vector extension
server/src/features/extraction/
  extraction.service.js                 # call indexPaper() after PDF parse
server/src/features/ai/
  ai.service.js                         # call retrieveChunks(), inject into prompt
server/src/config/env.js               # warn if HF_API_KEY missing
.env.example                           # add HF_API_KEY
CLAUDE.md                              # updated architecture docs
```

---

## Data Flow (after this phase)

```
User uploads PDF
       │
       ▼
pdf-parse → rawText
       │
       ├──▶ Groq extraction (7 structured fields → extraction_results table)
       │
       └──▶ chunkText() → chunks[]
                  │
                  ▼
            embedTexts() [HuggingFace API]
                  │
                  ▼
            pgvector INSERT into paper_chunks
                  (runs in background)

User sends chat message
       │
       ▼
embedTexts(query) [HuggingFace API]
       │
       ▼
pgvector cosine search → top-5 chunks
       │
       ▼
system prompt = corpus metadata + extracted fields + retrieved passages
       │
       ▼
Groq LLM → response grounded in actual paper text
```

---

## Performance Notes

| Metric | Expected value |
|--------|---------------|
| Embedding a typical 8,000-word paper | ~15–25 chunks, ~3–5 sec on HF free tier |
| Query embedding (single string) | ~1 sec |
| pgvector cosine search (1,000 chunks) | < 10 ms |
| Total added latency per chat message | ~1–2 sec for query embedding |
| HF free tier rate limit | ~30,000 chars/min (≈ 4–5 papers/min) |
| Vector storage per paper | ~15 chunks × 384 floats × 4 bytes ≈ 23 KB |

---

## Rollback Plan

If RAG breaks, the AI service has a silent `try/catch` around `retrieveChunks`. If it throws for any reason (HF API down, pgvector not enabled, no chunks indexed), the system falls back to context stuffing automatically — the assistant still works, just without the deep passage retrieval.

---

## Sources

- [Neon pgvector docs](https://neon.com/docs/extensions/pgvector)
- [Building AI search with Neon + pgvector](https://neon.com/guides/ai-embeddings-postgres-search)
- [pgvector Node.js package](https://github.com/pgvector/pgvector-node)
- [HuggingFace Inference API docs](https://huggingface.co/docs/huggingface.js/en/inference/README)
- [RAG chunking benchmark 2026](https://nandigamharikrishna.substack.com/p/rag-chunking-strategies-and-embeddings)
- [Weaviate chunking strategies guide](https://weaviate.io/blog/chunking-strategies-for-rag)
