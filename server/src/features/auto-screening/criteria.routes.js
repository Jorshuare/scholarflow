import { Router } from 'express';
import { list, create, remove } from './criteria.controller.js';

const router = Router({ mergeParams: true });

router.get('/',       list);
router.post('/',      create);
router.delete('/:cid', remove);

export default router;
