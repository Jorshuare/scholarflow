// HuggingFace Inference API — sentence-transformers/all-MiniLM-L6-v2 (384-dim, free tier).
// Batches in groups of 32 to stay within payload limits.
// Retries once on 503 (model cold-start on free tier, can take ~20s).

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
    await new Promise(r => setTimeout(r, 20000));
    return callHF(texts, 2);
  }

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HuggingFace API error ${res.status}: ${msg}`);
  }

  return res.json(); // float[][] — one 384-dim array per input
}

export async function embedTexts(texts) {
  if (!process.env.HF_API_KEY) throw new Error('HF_API_KEY is not set — RAG unavailable');

  const BATCH = 32;
  const all   = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const result = await callHF(texts.slice(i, i + BATCH));
    all.push(...result);
    if (i + BATCH < texts.length) await new Promise(r => setTimeout(r, 1000));
  }

  return all; // float[][]
}
