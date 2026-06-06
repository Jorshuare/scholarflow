// 384 words ≈ 512 tokens — optimal window for sentence-transformers/all-MiniLM-L6-v2.
// 10% overlap prevents a sentence being split right at a chunk boundary.
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
