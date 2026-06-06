import prisma from '../../config/prisma.js';

async function assertOwner(projectId, userId) {
  const p = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!p) throw Object.assign(new Error('Project not found'), { status: 404 });
  return p;
}

export async function listCriteria(projectId, userId) {
  await assertOwner(projectId, userId);
  return prisma.criterion.findMany({
    where: { projectId },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });
}

export async function createCriterion(projectId, userId, { type, description }) {
  await assertOwner(projectId, userId);

  const existing = await prisma.criterion.findMany({
    where: { projectId, type },
    orderBy: { code: 'asc' },
  });

  const prefix = type === 'INCLUSION' ? 'IC' : 'EC';
  const next = existing.length + 1;
  const code = `${prefix}${next}`;

  return prisma.criterion.create({
    data: { projectId, type, code, description },
  });
}

export async function deleteCriterion(projectId, userId, criterionId) {
  await assertOwner(projectId, userId);
  const c = await prisma.criterion.findFirst({ where: { id: criterionId, projectId } });
  if (!c) throw Object.assign(new Error('Criterion not found'), { status: 404 });
  return prisma.criterion.delete({ where: { id: criterionId } });
}
