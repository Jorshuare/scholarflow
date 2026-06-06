import { Router } from 'express';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { list, create, get, update, remove } from './projects.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/',      list);
router.post('/',     create);
router.get('/:id',   get);
router.put('/:id',   update);
router.delete('/:id', remove);

export default router;
