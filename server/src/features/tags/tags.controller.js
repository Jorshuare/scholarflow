import * as svc from './tags.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const list   = asyncHandler(async (req, res) => res.json(await svc.listTags(req.params.id, req.user.id)));
export const create = asyncHandler(async (req, res) => res.status(201).json(await svc.createTag(req.params.id, req.user.id, req.body)));
export const remove = asyncHandler(async (req, res) => { await svc.deleteTag(req.params.id, req.user.id, req.params.tid); res.status(204).end(); });
export const apply  = asyncHandler(async (req, res) => res.status(201).json(await svc.applyTag(req.params.id, req.user.id, req.params.pid, req.params.tid)));
export const detach = asyncHandler(async (req, res) => { await svc.removeTag(req.params.id, req.user.id, req.params.pid, req.params.tid); res.status(204).end(); });
