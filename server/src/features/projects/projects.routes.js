import { Router } from 'express';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { list, create, get, update, remove } from './projects.controller.js';
import papersRoutes    from '../papers/papers.routes.js';
import screeningRoutes from '../screening/screening.routes.js';
import tagsRoutes      from '../tags/tags.routes.js';
import aiRoutes        from '../ai/ai.routes.js';
import exportsRoutes   from '../exports/exports.routes.js';
import criteriaRoutes      from '../auto-screening/criteria.routes.js';
import screeningAutoRoutes from '../auto-screening/autoScreening.routes.js';
import extractionRoutes    from '../extraction/extraction.routes.js';

const router = Router();

router.use(verifyToken);

router.get('/',       list);
router.post('/',      create);
router.get('/:id',    get);
router.put('/:id',    update);
router.delete('/:id', remove);

// Nest sub-resources so :id param flows through correctly
router.use('/:id/papers',  papersRoutes);
router.use('/:id/papers',  screeningRoutes);
router.use('/:id/tags',    tagsRoutes);
router.use('/:id/papers',  tagsRoutes);
router.use('/:id/ai',           aiRoutes);
router.use('/:id/export',       exportsRoutes);
router.use('/:id/criteria',     criteriaRoutes);
router.use('/:id/screening',    screeningAutoRoutes);
router.use('/:id/papers',       extractionRoutes);
router.use('/:id',              extractionRoutes);

export default router;
