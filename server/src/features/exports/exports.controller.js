import prisma from '../../config/prisma.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { calcPrismaNumbers } from '../../utils/prismaCalc.js';
import { generatePrismaSvg } from './prisma.svg.js';
import { papersToBibtex } from './bibtex.exporter.js';
import { papersToCsv } from './csv.exporter.js';

async function getProjectPapers(projectId, userId, statusFilter) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw Object.assign(new Error('Not found'), { status: 404 });
  const where = { projectId };
  if (statusFilter) where.status = statusFilter;
  return prisma.paper.findMany({ where, orderBy: { createdAt: 'asc' } });
}

export const exportBibtex = asyncHandler(async (req, res) => {
  const papers = await getProjectPapers(req.params.id, req.user.id, 'INCLUDED');
  res.setHeader('Content-Type', 'application/x-bibtex');
  res.setHeader('Content-Disposition', 'attachment; filename="included_papers.bib"');
  res.send(papersToBibtex(papers));
});

export const exportCsv = asyncHandler(async (req, res) => {
  const papers = await getProjectPapers(req.params.id, req.user.id);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="papers.csv"');
  res.send(papersToCsv(papers));
});

export const exportPrismaSvg = asyncHandler(async (req, res) => {
  const papers = await getProjectPapers(req.params.id, req.user.id);
  const counts = calcPrismaNumbers(papers);
  const svg    = generatePrismaSvg(counts);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Disposition', 'attachment; filename="prisma.svg"');
  res.send(svg);
});

export const getPrismaCounts = asyncHandler(async (req, res) => {
  const papers = await getProjectPapers(req.params.id, req.user.id);
  res.json(calcPrismaNumbers(papers));
});
