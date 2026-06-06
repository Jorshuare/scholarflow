import { Router } from 'express';
import multer from 'multer';
import { verifyToken } from '../../middleware/auth.middleware.js';
import { list, get, create, update, remove, importBibtex, importCsv } from './papers.controller.js';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(verifyToken);

router.get('/',                    list);
router.post('/',                   create);
router.post('/import/bibtex',      upload.single('file'), importBibtex);
router.post('/import/csv',         upload.single('file'), importCsv);
router.get('/:pid',                get);
router.put('/:pid',                update);
router.delete('/:pid',             remove);

export default router;
