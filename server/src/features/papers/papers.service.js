import prisma from '../../config/prisma.js';
import { parseBibtex } from './parsers/bibtex.parser.js';
import { parseCsv } from './parsers/csv.parser.js';

function notFound() {
  return Object.assign(new Error('Paper not found'), { status: 404 });
}

function notFoundProject() {
  return Object.assign(new Error('Project not found'), { status: 404 });
}

async function assertProjectOwner(projectId, userId) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw notFoundProject();
}

export async function listPapers(projectId, userId, filters = {}) {
  await assertProjectOwner(projectId, userId);

  const where = { projectId };

  if (filters.status)  where.status = filters.status;
  if (filters.keyword) {
    where.OR = [
      { title:    { contains: filters.keyword, mode: 'insensitive' } },
      { authors:  { contains: filters.keyword, mode: 'insensitive' } },
      { abstract: { contains: filters.keyword, mode: 'insensitive' } },
    ];
  }
  if (filters.year) where.year = parseInt(filters.year, 10);

  return prisma.paper.findMany({
    where,
    include: { paperTags: { include: { tag: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPaper(projectId, userId, paperId) {
  await assertProjectOwner(projectId, userId);
  const paper = await prisma.paper.findFirst({
    where: { id: paperId, projectId },
    include: { paperTags: { include: { tag: true } } },
  });
  if (!paper) throw notFound();
  return paper;
}

export async function createPaper(projectId, userId, data) {
  await assertProjectOwner(projectId, userId);
  return prisma.paper.create({ data: { ...data, projectId } });
}

export async function updatePaper(projectId, userId, paperId, data) {
  await getPaper(projectId, userId, paperId);
  return prisma.paper.update({ where: { id: paperId }, data });
}

export async function deletePaper(projectId, userId, paperId) {
  await getPaper(projectId, userId, paperId);
  return prisma.paper.delete({ where: { id: paperId } });
}

export async function importBibtex(projectId, userId, fileBuffer) {
  await assertProjectOwner(projectId, userId);
  const papers = parseBibtex(fileBuffer.toString('utf-8'));
  const created = await prisma.paper.createMany({
    data: papers.map((p) => ({ ...p, projectId })),
    skipDuplicates: false,
  });
  return { imported: created.count };
}

export async function importCsv(projectId, userId, fileBuffer) {
  await assertProjectOwner(projectId, userId);
  const papers = parseCsv(fileBuffer);
  const created = await prisma.paper.createMany({
    data: papers.map((p) => ({ ...p, projectId })),
    skipDuplicates: false,
  });
  return { imported: created.count };
}
