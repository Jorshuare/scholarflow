import * as svc from './screening.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const screen = asyncHandler(async (req, res) => {
  const paper = await svc.screenPaper(
    req.params.id,
    req.user.id,
    req.params.pid,
    req.body
  );
  res.json(paper);
});
