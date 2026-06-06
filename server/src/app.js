import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import authRoutes       from './features/auth/auth.routes.js';
import projectRoutes    from './features/projects/projects.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);

app.use(errorHandler);

export default app;
