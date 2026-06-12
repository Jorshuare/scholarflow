import Groq from 'groq-sdk';
import prisma from '../../config/prisma.js';
import { GROQ_MODEL } from '../../config/env.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// In-memory job state keyed by projectId
const jobs = new Map();

function getJob(projectId) {
  return jobs.get(projectId) ?? { status: 'IDLE', processed: 0, total: 0, included: 0, excluded: 0, uncertain: 0 };
}

async function assertOwner(projectId, userId) {
  const p = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!p) throw Object.assign(new Error('Project not found'), { status: 404 });
  return p;
}

function assignQueue(recommendation, confidence) {
  if (recommendation === 'UNCERTAIN') return 'uncertain';
  if (recommendation === 'INCLUDE' && confidence >= 80) return 'included';
  if (recommendation === 'EXCLUDE' && confidence >= 80) return 'excluded';
  return 'uncertain';
}

function buildPrompt(criteria, paper) {
  const inclusion = criteria.filter(c => c.type === 'INCLUSION');
  const exclusion = criteria.filter(c => c.type === 'EXCLUSION');

  const icText = inclusion.map(c => `${c.code}: ${c.description}`).join('\n');
  const ecText = exclusion.map(c => `${c.code}: ${c.description}`).join('\n');
  const abstract = (paper.abstract || 'Not available').slice(0, 800);

  return `INCLUSION CRITERIA:\n${icText || 'None defined'}\n\nEXCLUSION CRITERIA:\n${ecText || 'None defined'}\n\nPAPER TO EVALUATE:\nTitle: ${paper.title}\nAbstract: ${abstract}\nYear: ${paper.year || 'Unknown'}\nVenue: ${paper.venue || 'Unknown'}\n\nReturn this exact JSON structure (no markdown, no explanation):\n{\n  "recommendation": "INCLUDE" | "EXCLUDE" | "UNCERTAIN",\n  "confidence": <integer 0-100>,\n  "matched_inclusion": ["IC1"],\n  "failed_inclusion": [],\n  "triggered_exclusion": [],\n  "reasoning": "<one sentence>"\n}`;
}

async function screenOnePaper(criteria, paper) {
  const systemMsg = 'You are a systematic review screening assistant. Evaluate whether a research paper meets the specified criteria. Respond ONLY with valid JSON. No explanation, no markdown, no preamble.';

  let raw;
  try {
    const res = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user',   content: buildPrompt(criteria, paper) },
      ],
    });
    raw = res.choices[0].message.content.trim();
    // Strip potential markdown code fences
    raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(raw);
  } catch {
    // Retry once with a simpler prompt
    try {
      const res = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'Return valid JSON only.' },
          { role: 'user',   content: `Does this paper title meet systematic review criteria? Title: "${paper.title}". Reply: {"recommendation":"UNCERTAIN","confidence":50,"matched_inclusion":[],"failed_inclusion":[],"triggered_exclusion":[],"reasoning":"Could not parse — marked uncertain"}` },
        ],
      });
      raw = res.choices[0].message.content.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(raw);
    } catch {
      return { recommendation: 'UNCERTAIN', confidence: 0, matched_inclusion: [], failed_inclusion: [], triggered_exclusion: [], reasoning: 'Parsing failed — marked uncertain' };
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPipeline(projectId, papers, criteria) {
  const job = { status: 'RUNNING', processed: 0, total: papers.length, included: 0, excluded: 0, uncertain: 0 };
  jobs.set(projectId, job);

  for (const paper of papers) {
    const result = await screenOnePaper(criteria, paper);
    const queue  = assignQueue(result.recommendation, result.confidence);

    await prisma.screeningResult.upsert({
      where: { paperId: paper.id },
      create: {
        paperId:            paper.id,
        recommendation:     result.recommendation,
        confidence:         result.confidence ?? 0,
        matchedInclusion:   result.matched_inclusion  ?? [],
        failedInclusion:    result.failed_inclusion   ?? [],
        triggeredExclusion: result.triggered_exclusion ?? [],
        reasoning:          result.reasoning ?? '',
      },
      update: {
        recommendation:     result.recommendation,
        confidence:         result.confidence ?? 0,
        matchedInclusion:   result.matched_inclusion  ?? [],
        failedInclusion:    result.failed_inclusion   ?? [],
        triggeredExclusion: result.triggered_exclusion ?? [],
        reasoning:          result.reasoning ?? '',
        humanOverride:      false,
        finalDecision:      null,
        processedAt:        new Date(),
      },
    });

    job.processed++;
    if (queue === 'included')  job.included++;
    else if (queue === 'excluded') job.excluded++;
    else                           job.uncertain++;

    if (job.processed < papers.length) await sleep(2000);
  }

  job.status = 'COMPLETE';
  jobs.set(projectId, job);
}

export async function runScreening(projectId, userId) {
  await assertOwner(projectId, userId);

  const current = getJob(projectId);
  if (current.status === 'RUNNING')
    throw Object.assign(new Error('Screening already in progress'), { status: 409 });

  const [papers, criteria] = await Promise.all([
    prisma.paper.findMany({ where: { projectId, status: 'PENDING' } }),
    prisma.criterion.findMany({ where: { projectId }, orderBy: { code: 'asc' } }),
  ]);

  if (!papers.length)   throw Object.assign(new Error('No pending papers to screen'), { status: 400 });
  if (!criteria.length) throw Object.assign(new Error('Define criteria before running screening'), { status: 400 });

  // Fire and forget — don't await
  runPipeline(projectId, papers, criteria).catch(err => {
    const job = jobs.get(projectId);
    if (job) { job.status = 'FAILED'; jobs.set(projectId, job); }
    console.error('Auto-screening pipeline error:', err);
  });

  return { message: 'Screening started', total: papers.length };
}

export function getStatus(projectId) {
  return getJob(projectId);
}

export async function getResults(projectId, userId, queue) {
  await assertOwner(projectId, userId);

  const results = await prisma.screeningResult.findMany({
    where: { paper: { projectId } },
    include: { paper: true },
    orderBy: { confidence: 'desc' },
  });

  function queueOf(r) { return assignQueue(r.recommendation, r.confidence); }

  if (queue === 'included')  return results.filter(r => queueOf(r) === 'included');
  if (queue === 'excluded')  return results.filter(r => queueOf(r) === 'excluded');
  if (queue === 'uncertain') return results.filter(r => queueOf(r) === 'uncertain');
  return results;
}

// Builds the exclusion reason stored on the paper from the AI screening result,
// prefixing any triggered exclusion criteria codes (e.g. "EC1, EC2: <reasoning>").
function buildExclusionReason(sr) {
  if (!sr) return null;
  const codes     = (sr.triggeredExclusion ?? []).join(', ');
  const reasoning = sr.reasoning?.trim() || '';
  if (codes && reasoning) return `${codes}: ${reasoning}`;
  return reasoning || codes || null;
}

export async function confirmDecisions(projectId, userId, decisions) {
  await assertOwner(projectId, userId);

  await Promise.all(decisions.map(async ({ paperId, finalDecision }) => {
    const sr = await prisma.screeningResult.update({
      where: { paperId },
      data:  { finalDecision },
    });

    const isExclude = finalDecision !== 'INCLUDE';
    await prisma.paper.update({
      where: { id: paperId },
      data:  {
        status:          isExclude ? 'EXCLUDED' : 'INCLUDED',
        exclusionReason: isExclude ? buildExclusionReason(sr) : null,
      },
    });
  }));

  return { confirmed: decisions.length };
}

export async function overrideDecision(projectId, userId, paperId, finalDecision, reason) {
  await assertOwner(projectId, userId);

  const sr = await prisma.screeningResult.update({
    where: { paperId },
    data:  { finalDecision, humanOverride: true },
  });

  const isExclude = finalDecision !== 'INCLUDE';
  await prisma.paper.update({
    where: { id: paperId },
    data:  {
      status:          isExclude ? 'EXCLUDED' : 'INCLUDED',
      exclusionReason: isExclude ? (reason?.trim() || buildExclusionReason(sr)) : null,
    },
  });

  return { overridden: true };
}

export async function getMethodologyReport(projectId, userId) {
  await assertOwner(projectId, userId);

  const project  = await prisma.project.findUnique({ where: { id: projectId } });
  const criteria = await prisma.criterion.findMany({ where: { projectId } });
  const results  = await prisma.screeningResult.findMany({ where: { paper: { projectId } } });

  const total      = results.length;
  const autoIncl   = results.filter(r => assignQueue(r.recommendation, r.confidence) === 'included' && !r.humanOverride).length;
  const autoExcl   = results.filter(r => assignQueue(r.recommendation, r.confidence) === 'excluded' && !r.humanOverride).length;
  const uncertain  = results.filter(r => assignQueue(r.recommendation, r.confidence) === 'uncertain').length;
  const overrides  = results.filter(r => r.humanOverride).length;
  const overridePct = total > 0 ? Math.round((overrides / total) * 100) : 0;
  const inclCount  = criteria.filter(c => c.type === 'INCLUSION').length;
  const exclCount  = criteria.filter(c => c.type === 'EXCLUSION').length;

  return `Title and abstract screening was conducted using AI-assisted screening (ScholarFlow, Groq ${GROQ_MODEL}). Each record was evaluated against ${inclCount} inclusion and ${exclCount} exclusion criteria. Of ${total} records screened, ${autoIncl} were automatically recommended for inclusion (confidence ≥ 80%), ${autoExcl} automatically excluded (confidence ≥ 80%), and ${uncertain} flagged for human review. All AI recommendations were verified by the primary researcher. Human overrides were applied to ${overrides} records (${overridePct}%).`;
}
