import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import Groq from 'groq-sdk';
import prisma from '../../config/prisma.js';
import { GROQ_MODEL } from '../../config/env.js';

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

function buildExtractionContext(rawText) {
  const start = rawText.substring(0, 2000);
  const end   = rawText.substring(Math.max(0, rawText.length - 1000));
  return `${start}\n\n[...middle omitted...]\n\n${end}`;
}

async function callGroqExtraction(title, context, attempt = 1) {
  const system = 'You are a research paper data extraction assistant. Extract specific fields from the paper text. Respond ONLY with valid JSON. No markdown, no preamble. If a field cannot be found, use null. Keep all values under 30 words each.';
  const user   = `Extract these fields from the paper.\n\nPaper title: ${title}\n\nPaper text:\n${context}\n\nReturn this exact JSON:\n{\n  "method": "primary method or model used",\n  "dataset": "dataset(s) used for evaluation",\n  "metric": "evaluation metric(s) used",\n  "performance": "key quantitative result",\n  "limitations": "main limitation stated by authors",\n  "futureWork": "future work directions mentioned",\n  "contribution": "one-sentence summary of main contribution"\n}`;

  const backoff = [0, 2000, 4000, 8000];
  for (let i = 0; i < attempt; i++) {
    if (backoff[i]) await new Promise(r => setTimeout(r, backoff[i]));
  }

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
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

  // Clear rawText to save DB space after extraction
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
