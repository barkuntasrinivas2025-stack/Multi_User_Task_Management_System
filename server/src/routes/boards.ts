import { Router, Response } from 'express';
import { db } from '../db';
import { boards, boardMembers, users } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// ─── GET /api/v1/boards ───────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const memberships = await db
      .select({ boardId: boardMembers.boardId })
      .from(boardMembers)
      .where(eq(boardMembers.userId, userId));

    const boardIds = memberships.map(m => m.boardId);
    if (boardIds.length === 0) {
      res.json({ data: [] });
      return;
    }

    const result = await db
      .select()
      .from(boards)
      .where(isNull(boards.deletedAt));

    const userBoards = result.filter(b => boardIds.includes(b.id));
    res.json({ data: userBoards });
  } catch (err) {
    console.error('[boards/list]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── POST /api/v1/boards ──────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.userId;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Board name is required', code: 'MISSING_FIELDS' });
      return;
    }

    const [board] = await db.insert(boards).values({
      name: name.trim(),
      description: description?.trim(),
      ownerId: userId,
    }).returning();

    // Add creator as admin member
    await db.insert(boardMembers).values({
      boardId: board.id,
      userId,
      role: 'admin',
    });

    res.status(201).json({ data: board });
  } catch (err) {
    console.error('[boards/create]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── GET /api/v1/boards/:id ───────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const [membership] = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, id), eq(boardMembers.userId, userId)));

    if (!membership) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    if (!board) {
      res.status(404).json({ error: 'Board not found', code: 'NOT_FOUND' });
      return;
    }

    // Get members with user info
    const members = await db
      .select({
        id: boardMembers.id,
        role: boardMembers.role,
        joinedAt: boardMembers.joinedAt,
        userId: users.id,
        name: users.name,
        email: users.email,
      })
      .from(boardMembers)
      .innerJoin(users, eq(boardMembers.userId, users.id))
      .where(eq(boardMembers.boardId, id));

    res.json({ data: { ...board, members } });
  } catch (err) {
    console.error('[boards/get]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── POST /api/v1/boards/join/:inviteCode ─────────────────────────────────────
router.post('/join/:inviteCode', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user!.userId;

    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.inviteCode, inviteCode), isNull(boards.deletedAt)));

    if (!board) {
      res.status(404).json({ error: 'Invalid invite link', code: 'NOT_FOUND' });
      return;
    }

    // Check already a member
    const [existing] = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, board.id), eq(boardMembers.userId, userId)));

    if (existing) {
      res.json({ data: board });
      return;
    }

    await db.insert(boardMembers).values({
      boardId: board.id,
      userId,
      role: 'member',
    });

    res.status(201).json({ data: board });
  } catch (err) {
    console.error('[boards/join]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

export default router;