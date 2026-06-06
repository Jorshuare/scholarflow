import prisma from '../../config/prisma.js';

export async function screenPaper(projectId, userId, paperId, { status, exclusionReason }) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  const paper = await prisma.paper.findFirst({ where: { id: paperId, projectId } });
  if (!paper) throw Object.assign(new Error('Paper not found'), { status: 404 });

  return prisma.paper.update({
    where: { id: paperId },
    data: {
      status,
      exclusionReason: status === 'EXCLUDED' ? (exclusionReason || null) : null,
    },
  });
}
