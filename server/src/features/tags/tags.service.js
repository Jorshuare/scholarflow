import prisma from '../../config/prisma.js';

async function assertProjectOwner(projectId, userId) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
}

export async function listTags(projectId, userId) {
  await assertProjectOwner(projectId, userId);
  return prisma.tag.findMany({ where: { projectId }, orderBy: { name: 'asc' } });
}

export async function createTag(projectId, userId, { name, colour }) {
  await assertProjectOwner(projectId, userId);
  return prisma.tag.create({ data: { projectId, name, colour: colour || '#6366f1' } });
}

export async function deleteTag(projectId, userId, tagId) {
  await assertProjectOwner(projectId, userId);
  const tag = await prisma.tag.findFirst({ where: { id: tagId, projectId } });
  if (!tag) throw Object.assign(new Error('Tag not found'), { status: 404 });
  return prisma.tag.delete({ where: { id: tagId } });
}

export async function applyTag(projectId, userId, paperId, tagId) {
  await assertProjectOwner(projectId, userId);
  return prisma.paperTag.upsert({
    where: { paperId_tagId: { paperId, tagId } },
    create: { paperId, tagId },
    update: {},
  });
}

export async function removeTag(projectId, userId, paperId, tagId) {
  await assertProjectOwner(projectId, userId);
  return prisma.paperTag.delete({ where: { paperId_tagId: { paperId, tagId } } });
}
