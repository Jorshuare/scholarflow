import asyncHandler from '../../utils/asyncHandler.js';
import { listCriteria, createCriterion, deleteCriterion } from './criteria.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await listCriteria(req.params.id, req.user.id));
});

export const create = asyncHandler(async (req, res) => {
  const { type, description } = req.body;
  if (!type || !description?.trim())
    return res.status(400).json({ error: 'type and description are required' });
  if (!['INCLUSION', 'EXCLUSION'].includes(type))
    return res.status(400).json({ error: 'type must be INCLUSION or EXCLUSION' });
  res.status(201).json(await createCriterion(req.params.id, req.user.id, { type, description: description.trim() }));
});

export const remove = asyncHandler(async (req, res) => {
  await deleteCriterion(req.params.id, req.user.id, req.params.cid);
  res.status(204).end();
});
