import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import boardsRouter from './routes/boards';
import cardsRouter from './routes/cards';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/boards', boardsRouter);
app.use('/api/v1/boards/:boardId/cards', cardsRouter);
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] running on port ${PORT}`);
});

export default app;