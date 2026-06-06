-- AlterTable
ALTER TABLE "Paper" ADD COLUMN     "pdfProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rawText" TEXT;

-- CreateTable
CREATE TABLE "ExtractionResult" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "method" TEXT,
    "dataset" TEXT,
    "metric" TEXT,
    "performance" TEXT,
    "limitations" TEXT,
    "futureWork" TEXT,
    "contribution" TEXT,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionResult_paperId_key" ON "ExtractionResult"("paperId");

-- AddForeignKey
ALTER TABLE "ExtractionResult" ADD CONSTRAINT "ExtractionResult_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
