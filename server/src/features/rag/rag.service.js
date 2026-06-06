import { randomUUID }  from 'crypto';
import pgvector        from 'pgvector';
import prisma          from '../../config/prisma.js';
import { chunkText }   from './chunker.js';
import { embedTexts }  from './embedder.js';

// Chunks + embeds a paper's raw text and inserts into paper_chunks.
// Deletes any existing chunks first (handles re-upload).
export async function indexPaper(paperId, projectId, rawText) {
  await prisma.paperChunk.deleteMany({ where: { paperId } });

  const chunks = chunkText(rawText);
  if (chunks.length === 0) return;

  const embeddings = await embedTexts(chunks);

  for (let i = 0; i < chunks.length; i++) {
    const vec = pgvector.toSql(embeddings[i]);
    await prisma.$executeRaw`
      INSERT INTO paper_chunks (id, paper_id, project_id, chunk_index, text, embedding, created_at)
      VALUES (
        ${randomUUID()},
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

// Embeds the user query and returns the top-k most relevant chunks in the project.
export async function retrieveChunks(projectId, queryText, topK = 5) {
  const [queryEmbedding] = await embedTexts([queryText]);
  const vec = pgvector.toSql(queryEmbedding);

  return prisma.$queryRaw`
    SELECT
      pc.text,
      pc.paper_id            AS "paperId",
      p."title",
      (1 - (pc.embedding <=> ${vec}::vector)) AS similarity
    FROM paper_chunks pc
    JOIN "Paper" p ON p."id" = pc.paper_id
    WHERE pc.project_id = ${projectId}
    ORDER BY pc.embedding <=> ${vec}::vector
    LIMIT ${topK}
  `;
}
