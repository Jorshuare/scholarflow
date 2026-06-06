import { Router } from 'express';
import { postChat, getChat } from './ai.controller.js';

const router = Router({ mergeParams: true });

router.post('/chat', postChat);
router.get('/history', getChat);

export default router;
