import 'dotenv/config';
import express from 'express';
import path from 'path';
import apiRoutes from '../src/server/routes/index';
import { errorHandler } from '../src/server/middleware/errorHandler';

const app = express();

app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

// Serve static uploaded files (Note: ephemeral on Vercel serverless)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

export default app;
