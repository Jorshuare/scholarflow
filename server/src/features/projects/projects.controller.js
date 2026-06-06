import * as svc from './projects.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const list   = asyncHandler(async (req, res) => res.json(await svc.listProjects(req.user.id)));
export const create = asyncHandler(async (req, res) => res.status(201).json(await svc.createProject(req.user.id, req.body)));
export const get    = asyncHandler(async (req, res) => res.json(await svc.getProject(req.user.id, req.params.id)));
export const update = asyncHandler(async (req, res) => res.json(await svc.updateProject(req.user.id, req.params.id, req.body)));
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteProject(req.user.id, req.params.id);
  res.status(204).end();
});
