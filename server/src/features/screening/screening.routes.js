import { Router } from 'express';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { screen } from './screening.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyToken);
router.patch('/:pid/screen', screen);

export default router;
