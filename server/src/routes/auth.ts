import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { signToken } from '../lib/jwt';
import { eq } from 'drizzle-orm';

const router = Router();

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'email, password and name are required', code: 'MISSING_FIELDS' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' });
      return;
    }

    // Check duplicate
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered', code: 'DUPLICATE_EMAIL' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: 'member',
    }).returning();

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required', code: 'MISSING_FIELDS' });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', code: 'MISSING_TOKEN' });
      return;
    }
    const { verifyToken } = await import('../lib/jwt');
    const payload = verifyToken(authHeader.split(' ')[1]);
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ data: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    res.status(401).json({ error: 'Unauthorized', code: 'INVALID_TOKEN' });
  }
});

export default router;