import multer from 'multer';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  uploadAndExtract, getExtraction, updateExtraction,
  getEvidenceMatrix, exportMatrixCsv,
} from './extraction.service.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(Object.assign(new Error('Only PDF files are accepted'), { status: 400 }), false);
  },
});

export const uploadPdf = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });
  const result = await uploadAndExtract(req.params.id, req.user.id, req.params.pid, req.file.buffer);
  res.json(result);
});

export const getResult = asyncHandler(async (req, res) => {
  res.json(await getExtraction(req.params.id, req.user.id, req.params.pid));
});

export const patchResult = asyncHandler(async (req, res) => {
  res.json(await updateExtraction(req.params.id, req.user.id, req.params.pid, req.body));
});

export const matrix = asyncHandler(async (req, res) => {
  res.json(await getEvidenceMatrix(req.params.id, req.user.id));
});

export const matrixCsv = asyncHandler(async (req, res) => {
  const csv = await exportMatrixCsv(req.params.id, req.user.id);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="evidence-matrix.csv"');
  res.send(csv);
});
