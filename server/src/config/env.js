import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'GROQ_API_KEY'];

console.log('[env] Checking required variables...');
for (const key of required) {
  console.log(`[env] ${key}: ${process.env[key] ? 'SET' : 'MISSING'}`);
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
console.log('[env] All required variables present.');

export const PORT       = process.env.PORT       || 3001;
export const JWT_SECRET = process.env.JWT_SECRET;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

if (!process.env.HF_API_KEY) {
  console.warn('[RAG] HF_API_KEY not set — RAG retrieval disabled, falling back to context stuffing');
}
