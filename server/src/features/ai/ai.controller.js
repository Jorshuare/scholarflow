import { chat, getHistory } from './ai.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const postChat = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
  const result = await chat(projectId, req.user.id, message.trim());
  res.json(result);
});

export const getChat = asyncHandler(async (req, res) => {
  const { id: projectId } = req.params;
  const messages = await getHistory(projectId, req.user.id);
  res.json(messages);
});
