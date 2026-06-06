import { Router } from 'express';
import { upload, uploadPdf, getResult, patchResult, matrix, matrixCsv } from './extraction.controller.js';

const router = Router({ mergeParams: true });

// Evidence matrix routes (project-level)
router.get('/matrix',          matrix);
router.get('/matrix.csv',      matrixCsv);

// Per-paper extraction routes
router.post('/:pid/upload-pdf',  upload.single('pdf'), uploadPdf);
router.get('/:pid/extraction',   getResult);
router.patch('/:pid/extraction', patchResult);

export default router;
