import prisma from '../../config/prisma.js';

function notFound() {
  return Object.assign(new Error('Project not found'), { status: 404 });
}

export const listProjects = (userId) =>
  prisma.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

export const createProject = (userId, { name, description }) =>
  prisma.project.create({ data: { userId, name, description } });

export const getProject = async (userId, id) => {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw notFound();
  return project;
};

export const updateProject = async (userId, id, data) => {
  await getProject(userId, id);
  return prisma.project.update({ where: { id }, data });
};

export const deleteProject = async (userId, id) => {
  await getProject(userId, id);
  return prisma.project.delete({ where: { id } });
};
