import * as svc from './papers.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const papers = await svc.listPapers(req.params.id, req.user.id, req.query);
  res.json(papers);
});

export const get = asyncHandler(async (req, res) => {
  const paper = await svc.getPaper(req.params.id, req.user.id, req.params.pid);
  res.json(paper);
});

export const create = asyncHandler(async (req, res) => {
  const paper = await svc.createPaper(req.params.id, req.user.id, req.body);
  res.status(201).json(paper);
});

export const update = asyncHandler(async (req, res) => {
  const paper = await svc.updatePaper(req.params.id, req.user.id, req.params.pid, req.body);
  res.json(paper);
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deletePaper(req.params.id, req.user.id, req.params.pid);
  res.status(204).end();
});

export const importBibtex = asyncHandler(async (req, res) => {
  if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
  const result = await svc.importBibtex(req.params.id, req.user.id, req.file.buffer);
  res.status(201).json(result);
});

export const importCsv = asyncHandler(async (req, res) => {
  if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
  const result = await svc.importCsv(req.params.id, req.user.id, req.file.buffer);
  res.status(201).json(result);
});
