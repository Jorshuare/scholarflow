import { Router } from 'express';
import { run, status, results, confirm, override, methodologyReport } from './autoScreening.controller.js';

const router = Router({ mergeParams: true });

router.post('/run',           run);
router.get('/status',         status);
router.get('/results',        results);
router.post('/confirm',       confirm);
router.patch('/:pid/override', override);
router.get('/methodology',    methodologyReport);

export default router;
