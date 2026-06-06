import { Router } from 'express';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { list, create, remove, apply, detach } from './tags.controller.js';

const router = Router({ mergeParams: true });

router.use(verifyToken);

router.get('/',                            list);
router.post('/',                           create);
router.delete('/:tid',                     remove);
router.post('/:pid/tags/:tid',             apply);
router.delete('/:pid/tags/:tid',           detach);

export default router;
