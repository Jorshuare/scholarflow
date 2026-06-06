# ScholarFlow — Progress Report

**Course:** Fundamentals of Software Technology · Beihang University · Spring 2026
**Demo deadline:** 2026-06-12 · **Docs deadline:** 2026-06-26
**Report date:** 2026-06-06
**Repository:** https://github.com/Jorshuare/scholarflow

---

## 1. Project Overview

ScholarFlow is a full-stack web application for AI-powered systematic literature reviews. Researchers use it to import a corpus of academic papers, screen them against inclusion/exclusion criteria, tag and annotate them, extract structured data from full-text PDFs, and export publication-ready PRISMA diagrams and evidence matrices.

The system is built on **React 18 + Vite** (frontend), **Node.js 20 + Express** (backend), **PostgreSQL on Neon** (database), and uses **Groq's LLaMA 3.3 70B** for AI features and **HuggingFace sentence-transformers** for vector embeddings.

---

## 2. Completed Work

### Phase 1 — Foundation (commit `3f3be6b`)

**Goal:** Get a working authenticated multi-project shell running.

**What was built:**
- User registration and login with **JWT authentication** (bcrypt password hashing, stateless tokens)
- Full **Projects CRUD** — create, list, view, update, delete projects scoped to the logged-in user
- **Prisma ORM** schema with `User`, `Project`, `Paper`, `Tag`, `PaperTag`, `ChatMessage` tables
- **React frontend scaffolding** — React Router v6, Axios with JWT interceptor, `AuthContext` for global user state, `ProjectContext` for active project
- Responsive Navbar/Sidebar layout with protected routes

**Tech decisions made:**
- JavaScript (not TypeScript) to keep setup lean given the 7-day demo deadline
- Feature-based folder structure mirrored on both client and server (`features/auth/`, `features/projects/`, etc.)
- No Redux or Zustand — React Context + local state is sufficient for this scope

---

### Phase 2 — Core Library Features (commit `e6c477a` area)

**Goal:** Make the app useful for importing and screening papers.

**What was built:**
- **BibTeX import** — server-side parser using `bibtex-parse` normalises entries to the paper schema; handles multi-author strings, year extraction
- **CSV import** — flexible column mapper that accepts common header variants (Title, title, TITLE, etc.)
- **Manual paper entry** — single-paper form with all metadata fields
- **Paper Library** — paginated table with search (title/author/venue), status filters (All / Pending / Included / Excluded), tag filter, and a slide-in side panel for full details
- **Bulk delete** — checkbox column in the table, bulk-action bar appears when any are checked, `Promise.allSettled` for parallel deletion
- **Screening Mode** — card-by-card view of PENDING papers with Include / Exclude buttons; exclusion requires a reason
- **Tags system** — create tags per project with a colour palette picker; apply/remove tags on any paper from the side panel
- **Status change in side panel** — "Change →" link reveals a three-button toggle (Include / Exclude / Reset) with an optional exclusion-reason text input, saves via the `/screen` endpoint

---

### Phase 3 — AI Features + Visualisation (commit `2790ed5`)

**Goal:** Add the intelligent and reporting features that differentiate ScholarFlow from a spreadsheet.

**What was built:**
- **PRISMA 2020 Diagram** — live React SVG component that derives all box counts from paper statuses in the database (Identified → Screened → Assessed → Included funnel). A separate server-side renderer (`prisma.svg.js`) generates the same diagram as a downloadable SVG file.
- **AI Assistant** — chat panel that sends the full paper corpus (titles + abstracts + statuses) as system context to Groq's `llama-3.3-70b-versatile` model. Chat history is persisted in `chat_messages`. Citations use paper IDs (`[ID:abc123]`) so the frontend can resolve them.
- **Extraction Table** — notes-based structured extraction for INCLUDED papers (method, dataset, metric, performance, limitations, future work, contribution)
- **Evidence Matrix** — spreadsheet view across all included papers showing all extraction fields side-by-side; exportable as CSV

**UI overhaul (Phase 3b):**
- Full light-mode redesign with Beihang palette: `#002868` navy + `#C8A951` gold
- All Tailwind components rebuilt — no component library dependency
- Tags colour palette with 12 preset swatches
- Redesigned front page with hero banner, KPI cards with SVG progress rings, per-project stat chips, and a rich empty state

---

### Phase 4A — AI Auto-Screening (commit `e6c477a`)

**Goal:** Let the AI pre-screen hundreds of papers overnight instead of manually clicking through each one.

**What was built:**
- **Criteria Manager** — add/delete Inclusion Criteria (IC1, IC2…) and Exclusion Criteria (EC1, EC2…) with plain-text descriptions
- **Groq screening pipeline** — for each PENDING paper, sends title + abstract + all criteria to Groq requesting a structured JSON response: `{ recommendation, confidence, matchedInclusion[], failedInclusion[], triggeredExclusion[], reasoning }`
- **Rate-limit compliance** — 2-second delay between each Groq call; 100 papers ≈ 3.5 minutes
- **Three-queue review UI:**
  - **Auto-Included** — papers where Groq recommended INCLUDE with ≥ 80% confidence; checkbox-based selective confirm (don't have to accept all)
  - **Needs Review** — low-confidence or UNCERTAIN; "Exclude" button shows a reason form with 6 quick-pick chips before confirming
  - **Auto-Excluded** — EXCLUDE ≥ 80%; "Confirm All" batch action
- **Progress polling** — frontend polls `/screening/status` every 3 seconds while the job runs; live progress bar shown
- **Methodology export** — `/screening-report` endpoint generates a plain-text METHODS section describing the AI screening process (model, criteria count, confidence thresholds, paper counts), ready to paste into a paper

---

### Phase 4B — PDF Knowledge Extraction (commit `30cbe29`)

**Goal:** Extract structured data from the actual full text of papers, not just the abstract.

**What was built:**
- **PDF upload endpoint** — `multer` memoryStorage; PDF never written to disk; `pdf-parse` converts buffer → plain text
- **Scanned PDF detection** — if `rawText.length < 200`, returns a warning and skips Groq; researcher fills fields manually
- **Groq extraction** — sends first 2,000 + last 1,000 characters of raw text to Groq with a JSON-only prompt requesting 7 fields; exponential backoff (2s → 4s → 8s) on rate limit; up to 3 attempts
- **ExtractionResult model** — upsert so re-uploading a PDF refreshes the extraction
- **Full-text queue** — dedicated UI showing INCLUDED papers awaiting PDF upload with drag-and-drop upload panel and per-paper extraction status badge
- **Editable evidence matrix** — inline editing of any extraction field; changes persist via PATCH endpoint

---

### Phase 5 — Deployment + Dashboard (commit `2790ed5`)

**Goal:** Make the app accessible at a public URL and presentable for the demo.

**What was built:**
- **Docker Compose** — three-service stack (`db`, `server`, `client`) for local development
- **Production deployment** on **Railway** (server) + **Netlify** (client frontend)
- **Project Overview page** — per-project landing page with 4 KPI stat cards, animated screening + extraction progress bars, mini PRISMA funnel, 6 quick-action tiles, and a "Recent papers" list with status badges
- **Skeleton loading states** for async data

---

### Phase 6 — RAG Pipeline (commit `8948fa3`)

**Goal:** Replace context-stuffing in the AI assistant with true Retrieval-Augmented Generation so the model reads actual paragraphs from uploaded papers instead of just abstracts.

**What was built:**

| File | Purpose |
|------|---------|
| `server/src/features/rag/chunker.js` | Splits plain text into 384-word chunks with 38-word overlap (10%), discards fragments < 40 words |
| `server/src/features/rag/embedder.js` | Calls HuggingFace Inference API (`sentence-transformers/all-MiniLM-L6-v2`) for 384-dim embeddings; batches 32 texts; retries once on 503 cold-start |
| `server/src/features/rag/rag.service.js` | `indexPaper()` — deletes old chunks, chunks text, embeds all, bulk-inserts into `paper_chunks` via raw SQL with pgvector cast; `retrieveChunks()` — embeds query, runs pgvector `<=>` cosine search, returns top-5 chunks with similarity score |
| `server/prisma/schema.prisma` | Added `PaperChunk` model with `Unsupported("vector(384)")` embedding field; cascade delete from `Paper`; explicit `@map` annotations for snake_case column names |
| Migration `20260606200000` | `CREATE EXTENSION IF NOT EXISTS "vector"` + `CREATE TABLE paper_chunks` with pgvector column |
| `extraction.service.js` | Calls `indexPaper()` fire-and-forget after PDF parse — PDF upload response returns immediately while embedding happens in background |
| `ai.service.js` | On every chat message: embeds the user query → retrieves top-5 chunks → injects "RETRIEVED PASSAGES" block into system prompt with relevance percentage |
| `env.js` | Warns at startup if `HF_API_KEY` is not set; RAG falls back silently to context-stuffing |

**Data flow:**
```
User uploads PDF
  → pdf-parse (rawText)
  → Groq extraction (7 structured fields saved to extraction_results)
  → indexPaper() [background]
      → chunkText() → 15–25 chunks
      → embedTexts() [HuggingFace API, ~5–10 sec]
      → INSERT INTO paper_chunks (pgvector)

User asks AI assistant a question
  → embedTexts(query) [~1 sec]
  → SELECT ... ORDER BY embedding <=> query_vec LIMIT 5
  → top-5 passages injected into system prompt
  → Groq LLM answers grounded in actual paper paragraphs
```

**Fallback safety:** The entire RAG retrieval is wrapped in `try/catch`. If HuggingFace is unreachable, no chunks have been indexed yet, or pgvector throws for any reason, the assistant falls back to the old abstract-only context-stuffing with a console warning. The app never crashes because of RAG.

---

## 3. Current System Architecture

```
scholarflow/
├── client/               # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── features/     # auth, projects, library, screening, ai-assistant,
│       │                 # extraction, prisma-diagram, tags
│       ├── pages/        # ProjectHome (per-project dashboard)
│       ├── services/     # Axios wrappers per domain
│       └── router/       # All <Route> definitions
│
├── server/               # Node.js 20 + Express
│   └── src/
│       ├── features/     # auth, projects, papers, tags, screening,
│       │                 # ai, exports, extraction, rag (NEW)
│       └── config/       # env.js, prisma.js
│
└── server/prisma/
    └── schema.prisma     # 10 tables: User, Project, Paper, Tag, PaperTag,
                          # ChatMessage, Criterion, ScreeningResult,
                          # ExtractionResult, PaperChunk (NEW)
```

**Infrastructure:**
- Database: **Neon** (PostgreSQL 16, serverless, pgvector enabled)
- Backend: **Railway** (auto-deploy from `main` branch)
- Frontend: **Netlify** (Vite build, auto-deploy from `main` branch)
- AI inference: **Groq** (llama-3.3-70b-versatile, free tier)
- Embeddings: **HuggingFace** (sentence-transformers/all-MiniLM-L6-v2, free tier)

---

## 4. Phase Checklist

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Auth, Projects CRUD, DB schema, routing skeleton | ✅ Done |
| 2 | BibTeX/CSV import, Paper Library, Screening Mode, Tags UI | ✅ Done |
| 3 | PRISMA diagram, AI Assistant, Extraction Table | ✅ Done |
| 3b | Light-mode UI overhaul, Tags palette, Project dashboard | ✅ Done |
| 4A | AI Auto-Screening: Criteria Manager, Groq pipeline, three-queue review | ✅ Done |
| 4B | PDF Knowledge Extraction: upload → pdf-parse → Groq → Evidence Matrix | ✅ Done |
| 5 | Deploy (Railway + Netlify), Docker Compose, documentation | ✅ Done |
| 6 | RAG: pgvector on Neon + HuggingFace embeddings + semantic retrieval | ✅ Done |

---

## 5. Next Stage — Pre-Demo Polish (by 2026-06-12)

The core feature set is complete. The remaining work before the demo is focused on robustness, usability, and making a strong impression in a live presentation.

### 5.1 Re-index Endpoint (RAG Step 8)

Papers uploaded before Phase 6 was deployed have no chunks in `paper_chunks`. Add a "Re-index" button in the Evidence Matrix or Full-Text Queue so researchers can trigger re-embedding without re-uploading the PDF.

**Backend:** `POST /api/projects/:id/papers/:pid/reindex` — reads `rawText` from DB (if still present) and calls `indexPaper()`. If `rawText` was already cleared, return a 409 asking the user to re-upload.
**Frontend:** Small icon button next to each paper's extraction status.

### 5.2 RAG Indexing Status Indicator

The user currently has no visibility into whether their uploaded PDF has been embedded. Add a subtle badge on the Paper card / side panel:

- `Indexed` (green dot) — `paper_chunks` rows exist for this paper
- `Indexing…` (spinning dot) — PDF uploaded recently but chunks not yet stored
- `Not indexed` (grey) — PDF not uploaded or rawText was cleared before RAG was added

**Backend:** `GET /api/projects/:id/papers/:pid/rag-status` — count rows in `paper_chunks` WHERE `paper_id = pid`.

### 5.3 End-to-End Demo Test

Run through the complete happy path with a real paper set:
1. Create a project
2. Import a BibTeX file (10+ papers)
3. Add IC/EC criteria and run auto-screening
4. Confirm the queues
5. Upload a PDF for an INCLUDED paper
6. Verify extraction fields are populated
7. Ask the AI assistant a question about methodology — confirm retrieved passages appear in the answer
8. Export the PRISMA diagram and evidence matrix CSV

Capture any broken flows and fix them before the demo.

### 5.4 Error Handling UX

Some error states currently only show console logs or generic HTTP errors. Before the demo:
- Show a user-facing toast / alert when PDF parsing fails
- Show a toast when Groq auto-screening fails mid-run (currently only updates status to `FAILED`)
- Show a message in the AI chat if Groq returns a non-200 response

### 5.5 Mobile / Narrow Screen Check

The app currently targets desktop (sidebar + main panel layout). Verify minimum 1024px width renders correctly on a laptop in a browser window — the demo will likely be a laptop screen.

---

## 6. Documentation Stage (by 2026-06-26)

The documentation deadline is two weeks after the demo. The deliverables are:

### 6.1 Technical Documentation

- **System Architecture Diagram** — component diagram showing client, server, Neon, Groq, HuggingFace, Railway, Netlify
- **Database Schema Diagram** — entity-relationship diagram of all 10 tables
- **API Reference** — table of all 40+ endpoints with method, path, auth requirement, request body, and response shape
- **RAG Architecture Section** — explain chunking strategy, embedding model choice, cosine similarity retrieval, and fallback behaviour

### 6.2 User Guide

- Step-by-step guide for creating a project, importing papers, screening, PDF upload, and using the AI assistant
- Screenshots of each major feature
- Explain what the PRISMA diagram numbers mean

### 6.3 Code Walkthrough (for course submission)

- Annotated explanation of the most complex features:
  - JWT auth flow (register → login → interceptor → protected route)
  - Auto-screening pipeline (criteria → Groq JSON → three queues → confirm)
  - RAG pipeline (PDF upload → chunk → embed → store → retrieve → inject)

---

## 7. Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| HuggingFace free tier cold-starts (~20s) | First embedding after idle period is slow | Retry logic in `embedder.js` handles it transparently |
| Groq auto-screening rate limit (30 req/min) | Large corpora (100+ papers) take 3–4 minutes | 2-second delay + progress bar makes it acceptable |
| rawText cleared after extraction | Re-uploading PDF is required to re-index for RAG | Re-index endpoint (Next Stage 5.1) will address this |
| pgvector LIMIT is not parameterised by Prisma | Minor — hardcoded to 5 chunks | Acceptable for demo; can be made configurable |
| No authentication on RAG indexing | Any project member can trigger re-index | Single-user scope per account; not a concern for demo |
| Neon cold-start latency (~2s first query) | Slow first page load after idle | Expected on free tier; acceptable for demo |
