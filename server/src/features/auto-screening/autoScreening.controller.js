import asyncHandler from '../../utils/asyncHandler.js';
import {
  runScreening, getStatus, getResults,
  confirmDecisions, overrideDecision, getMethodologyReport,
} from './autoScreening.service.js';

export const run = asyncHandler(async (req, res) => {
  const result = await runScreening(req.params.id, req.user.id);
  res.status(202).json(result);
});

export const status = asyncHandler(async (req, res) => {
  res.json(getStatus(req.params.id));
});

export const results = asyncHandler(async (req, res) => {
  const data = await getResults(req.params.id, req.user.id, req.query.queue);
  res.json(data);
});

export const confirm = asyncHandler(async (req, res) => {
  const { decisions } = req.body;
  if (!Array.isArray(decisions) || !decisions.length)
    return res.status(400).json({ error: 'decisions array is required' });
  res.json(await confirmDecisions(req.params.id, req.user.id, decisions));
});

export const override = asyncHandler(async (req, res) => {
  const { finalDecision, reason } = req.body;
  if (!['INCLUDE', 'EXCLUDE'].includes(finalDecision))
    return res.status(400).json({ error: 'finalDecision must be INCLUDE or EXCLUDE' });
  res.json(await overrideDecision(req.params.id, req.user.id, req.params.pid, finalDecision, reason));
});

export const methodologyReport = asyncHandler(async (req, res) => {
  const text = await getMethodologyReport(req.params.id, req.user.id);
  res.setHeader('Content-Type', 'text/plain');
  res.send(text);
});
