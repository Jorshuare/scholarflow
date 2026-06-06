import prisma from '../../config/prisma.js';

function notFound() {
  return Object.assign(new Error('Project not found'), { status: 404 });
}

const PAPER_STAT_FIELDS = { select: { status: true, pdfProcessed: true } };

function toStats({ papers, ...p }) {
  return {
    ...p,
    _stats: {
      total:     papers.length,
      included:  papers.filter(x => x.status === 'INCLUDED').length,
      excluded:  papers.filter(x => x.status === 'EXCLUDED').length,
      pending:   papers.filter(x => x.status === 'PENDING').length,
      extracted: papers.filter(x => x.pdfProcessed).length,
    },
  };
}

async function checkOwner(userId, id) {
  const p = await prisma.project.findFirst({ where: { id, userId } });
  if (!p) throw notFound();
}

export const listProjects = (userId) =>
  prisma.project.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    include: { papers: PAPER_STAT_FIELDS },
  }).then(ps => ps.map(toStats));

export const createProject = (userId, { name, description }) =>
  prisma.project.create({ data: { userId, name, description } });

export const getProject = async (userId, id) => {
  const project = await prisma.project.findFirst({
    where:   { id, userId },
    include: { papers: PAPER_STAT_FIELDS },
  });
  if (!project) throw notFound();
  return toStats(project);
};

export const updateProject = async (userId, id, data) => {
  await checkOwner(userId, id);
  return prisma.project.update({ where: { id }, data });
};

export const deleteProject = async (userId, id) => {
  await checkOwner(userId, id);
  return prisma.project.delete({ where: { id } });
};
