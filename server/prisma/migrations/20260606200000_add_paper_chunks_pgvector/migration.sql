-- Enable pgvector extension (requires Neon or pg with pgvector installed)
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "paper_chunks" (
    "id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "paper_chunks_paper_id_idx" ON "paper_chunks"("paper_id");

-- CreateIndex
CREATE INDEX "paper_chunks_project_id_idx" ON "paper_chunks"("project_id");

-- AddForeignKey
ALTER TABLE "paper_chunks" ADD CONSTRAINT "paper_chunks_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
