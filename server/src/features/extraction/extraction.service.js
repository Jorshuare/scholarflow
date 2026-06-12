import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import Groq from 'groq-sdk';
import prisma from '../../config/prisma.js';
import { GROQ_MODEL } from '../../config/env.js';
import { indexPaper } from '../rag/rag.service.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function assertOwner(projectId, userId) {
  const p = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!p) throw Object.assign(new Error('Project not found'), { status: 404 });
}

async function assertPaper(projectId, paperId) {
  const paper = await prisma.paper.findFirst({ where: { id: paperId, projectId } });
  if (!paper) throw Object.assign(new Error('Paper not found'), { status: 404 });
  return paper;
}

// LLaMA 3.3 70B has a 128K-token context window, so a full paper (~10-15K tokens)
// fits comfortably. We send as much of the paper as possible — the methods, datasets,
// and results live in the middle, which the old first-2000/last-1000 approach discarded.
const MAX_CONTEXT_CHARS = 50000; // ≈ 12-13K tokens

function buildExtractionContext(rawText) {
  const clean = rawText.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (clean.length <= MAX_CONTEXT_CHARS) return clean;
  // For very long papers, keep a large head (abstract → methods → results) plus a
  // tail (conclusion, limitations, future work — usually at the very end).
  const head = clean.substring(0, 38000);
  const tail = clean.substring(clean.length - 12000);
  return `${head}\n\n[...middle section omitted for length...]\n\n${tail}`;
}

async function callGroqExtraction(title, context, attempt = 1) {
  const system = 'You are a meticulous research-paper data extraction assistant. Read the paper text carefully and extract the requested fields with concrete specifics: name the actual datasets, report the actual metric names, and include the actual numeric results stated in the paper. Prefer precise details from the methods and results sections over vague summaries. If a field genuinely cannot be found, use null. Respond ONLY with a valid JSON object.';
  const user   = `Extract the following fields from this research paper. Be specific — include dataset names, model names, metric names, and the actual numbers reported in the paper.\n\nPaper title: ${title}\n\nPaper text:\n${context}\n\nReturn a JSON object with exactly these keys:\n{\n  "method": "the main technical approach, model, or algorithm, named specifically (≤45 words)",\n  "dataset": "the dataset(s) used for evaluation, with names and sizes if stated (≤45 words)",\n  "metric": "the evaluation metric(s) used, named exactly (≤30 words)",\n  "performance": "the key quantitative results WITH the actual numbers reported (≤45 words)",\n  "limitations": "the main limitation(s) the authors acknowledge (≤45 words)",\n  "futureWork": "future work directions the authors mention (≤45 words)",\n  "contribution": "the main contribution as one specific sentence (≤45 words)"\n}`;

  const backoff = [0, 2000, 4000, 8000];
  for (let i = 0; i < attempt; i++) {
    if (backoff[i]) await new Promise(r => setTimeout(r, backoff[i]));
  }

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });

  let raw = res.choices[0].message.content.trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(raw);
}

export async function uploadAndExtract(projectId, userId, paperId, fileBuffer) {
  await assertOwner(projectId, userId);
  const paper = await assertPaper(projectId, paperId);

  if (paper.status !== 'INCLUDED')
    throw Object.assign(new Error('PDF extraction is only available for included papers'), { status: 400 });

  // Parse PDF text from buffer
  let rawText = '';
  try {
    const data = await pdfParse(fileBuffer);
    rawText = data.text || '';
  } catch {
    throw Object.assign(new Error('Could not read PDF — file may be corrupted'), { status: 422 });
  }

  // Scanned PDF detection
  if (rawText.trim().length < 200) {
    await prisma.paper.update({
      where: { id: paperId },
      data:  { pdfProcessed: false },
    });
    return {
      scanned: true,
      message: 'This appears to be a scanned PDF. Text extraction is not available. Please fill in the fields manually.',
    };
  }

  // Save rawText
  await prisma.paper.update({
    where: { id: paperId },
    data:  { rawText, pdfProcessed: true },
  });

  // Call Groq with retries
  let fields = null;
  let failed = false;
  const context = buildExtractionContext(rawText);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      fields = await callGroqExtraction(paper.title, context, attempt);
      break;
    } catch {
      if (attempt === 3) failed = true;
    }
  }

  const data = {
    paperId,
    method:       fields?.method       ?? null,
    dataset:      fields?.dataset      ?? null,
    metric:       fields?.metric       ?? null,
    performance:  fields?.performance  ?? null,
    limitations:  fields?.limitations  ?? null,
    futureWork:   fields?.futureWork   ?? null,
    contribution: fields?.contribution ?? null,
    failed,
  };

  const result = await prisma.extractionResult.upsert({
    where:  { paperId },
    create: data,
    update: { ...data, extractedAt: new Date() },
  });

  // Index paper into pgvector for RAG — fire-and-forget so response returns immediately.
  indexPaper(paperId, projectId, rawText).catch(err =>
    console.error('[RAG] Indexing failed for paper', paperId, err.message)
  );

  // Clear rawText after handing off to RAG indexer.
  await prisma.paper.update({
    where: { id: paperId },
    data:  { rawText: null },
  });

  return { extracted: true, failed, fields: result };
}

export async function getExtraction(projectId, userId, paperId) {
  await assertOwner(projectId, userId);
  await assertPaper(projectId, paperId);
  const result = await prisma.extractionResult.findUnique({ where: { paperId } });
  if (!result) throw Object.assign(new Error('No extraction result found'), { status: 404 });
  return result;
}

export async function updateExtraction(projectId, userId, paperId, patch) {
  await assertOwner(projectId, userId);
  await assertPaper(projectId, paperId);

  const allowed = ['method', 'dataset', 'metric', 'performance', 'limitations', 'futureWork', 'contribution'];
  const safe    = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));

  return prisma.extractionResult.upsert({
    where:  { paperId },
    create: { paperId, ...safe },
    update: safe,
  });
}

export async function getEvidenceMatrix(projectId, userId) {
  await assertOwner(projectId, userId);

  return prisma.paper.findMany({
    where:   { projectId, status: 'INCLUDED' },
    include: { extractionResult: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function exportMatrixCsv(projectId, userId) {
  const papers = await getEvidenceMatrix(projectId, userId);

  function esc(v) {
    if (v == null) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }

  const headers = ['title', 'authors', 'year', 'venue', 'method', 'dataset', 'metric', 'performance', 'limitations', 'futureWork', 'contribution'];
  const rows = papers.map(p => headers.map(h => {
    if (['method','dataset','metric','performance','limitations','futureWork','contribution'].includes(h)) {
      return esc(p.extractionResult?.[h]);
    }
    return esc(p[h]);
  }).join(','));

  return [headers.join(','), ...rows].join('\n');
}
