import { Router } from 'express';
import { exportBibtex, exportCsv, exportPrismaSvg, getPrismaCounts } from './exports.controller.js';

const router = Router({ mergeParams: true });

router.get('/bibtex',      exportBibtex);
router.get('/csv',         exportCsv);
router.get('/prisma.svg',  exportPrismaSvg);
router.get('/prisma-counts', getPrismaCounts);

export default router;
