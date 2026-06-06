import Groq from 'groq-sdk';
import prisma from '../../config/prisma.js';
import { GROQ_MODEL } from '../../config/env.js';
import { retrieveChunks } from '../rag/rag.service.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function assertProjectOwner(projectId, userId) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  return project;
}

function buildCorpusContext(papers) {
  if (!papers.length) return 'No papers have been imported into this project yet.';
  return papers.map(p =>
    `[ID:${p.id}] ${p.title} (${p.authors || 'Unknown authors'}, ${p.year || 'n.d.'}) — Status: ${p.status}` +
    (p.abstract ? `\nAbstract: ${p.abstract}` : '')
  ).join('\n\n');
}

function buildExtractionContext(papers) {
  const extracted = papers.filter(p => p.status === 'INCLUDED' && p.extractionResult);
  if (!extracted.length) return '';
  const rows = extracted.map(p => {
    const e = p.extractionResult;
    return `[ID:${p.id}] ${p.title}
  Method: ${e.method || 'N/A'}
  Dataset: ${e.dataset || 'N/A'}
  Metric: ${e.metric || 'N/A'}
  Performance: ${e.performance || 'N/A'}
  Limitations: ${e.limitations || 'N/A'}`;
  }).join('\n\n');
  return `\n\n--- EXTRACTED STRUCTURED DATA (included papers) ---\n${rows}`;
}

export async function chat(projectId, userId, userMessage) {
  const project = await assertProjectOwner(projectId, userId);

  const papers = await prisma.paper.findMany({
    where:   { projectId },
    select:  { id: true, title: true, authors: true, year: true, abstract: true, status: true, extractionResult: true },
  });

  const history = await prisma.chatMessage.findMany({
    where:   { projectId },
    orderBy: { createdAt: 'asc' },
    take:    20,
  });

  // Retrieve most relevant chunks from indexed PDFs via pgvector cosine search.
  // Falls back silently to context-stuffing if RAG is unavailable (no HF key, no chunks).
  let ragContext = '';
  try {
    const chunks = await retrieveChunks(projectId, userMessage, 5);
    if (chunks.length > 0) {
      ragContext = '\n\n--- RETRIEVED PASSAGES (most relevant to this question) ---\n' +
        chunks.map((c, i) =>
          `[Passage ${i + 1} from: ${c.title} · Relevance: ${Math.round(Number(c.similarity) * 100)}%]\n${c.text}`
        ).join('\n\n');
    }
  } catch (err) {
    console.warn('[RAG] Retrieval skipped:', err.message);
  }

  const systemPrompt = `You are a research assistant for a systematic literature review project titled "${project.name}".
You have access to the following papers in the corpus:

${buildCorpusContext(papers)}${buildExtractionContext(papers)}${ragContext}

Rules:
- Prefer the RETRIEVED PASSAGES above when answering — they contain exact text from the papers.
- Only reference papers listed in the corpus. Never invent citations.
- When citing a paper, include its ID in brackets e.g. [ID:abc123].
- Be concise and academic in tone.
- If asked about papers not in the corpus, say they are not in the library.
- When doing gap analysis, reason from the structured extraction data and retrieved passages.`;

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });

  const assistantMessage = response.choices[0].message.content;

  await prisma.chatMessage.createMany({
    data: [
      { projectId, role: 'user',      content: userMessage },
      { projectId, role: 'assistant', content: assistantMessage },
    ],
  });

  return { message: assistantMessage };
}

export async function getHistory(projectId, userId) {
  await assertProjectOwner(projectId, userId);
  return prisma.chatMessage.findMany({
    where:   { projectId },
    orderBy: { createdAt: 'asc' },
  });
}
