import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import boardsRouter from './routes/boards';
import cardsRouter from './routes/cards';
import { verifyToken } from './lib/jwt';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
});

const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ─── Attach io to request ─────────────────────────────────────────────────────
app.use((req: any, _res, next) => {
  req.io = io;
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/boards', boardsRouter);
app.use('/api/v1/boards/:boardId/cards', cardsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const payload = verifyToken(token);
    (socket as any).user = payload;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(`[socket] connected: ${user.email}`);

  // Join a board room
  socket.on('board:join', (boardId: string) => {
    socket.join(`board:${boardId}`);
    console.log(`[socket] ${user.email} joined board:${boardId}`);
  });

  // Leave a board room
  socket.on('board:leave', (boardId: string) => {
    socket.leave(`board:${boardId}`);
  });

  // Typing indicator
  socket.on('card:edit:start', ({ boardId, cardId }: { boardId: string; cardId: string }) => {
    socket.to(`board:${boardId}`).emit('user:typing', {
      cardId,
      user: { id: user.userId, email: user.email },
    });
  });

  socket.on('card:edit:stop', ({ boardId, cardId }: { boardId: string; cardId: string }) => {
    socket.to(`board:${boardId}`).emit('user:stopped', {
      cardId,
      userId: user.userId,
    });
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${user.email}`);
  });
});

export { io };

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] running on port ${PORT}`);
});