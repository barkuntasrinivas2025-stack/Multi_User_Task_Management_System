import { Router, Response } from 'express';
import { db } from '../db';
import { cards, boardMembers, cardActivity } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function verifyBoardAccess(boardId: string, userId: string): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));
  return !!membership;
}

// ─── GET /api/v1/boards/:boardId/cards ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const userId = req.user!.userId;

    if (!await verifyBoardAccess(boardId, userId)) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    const result = await db
      .select()
      .from(cards)
      .where(and(eq(cards.boardId, boardId), isNull(cards.deletedAt)));

    res.json({ data: result });
  } catch (err) {
    console.error('[cards/list]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── POST /api/v1/boards/:boardId/cards ──────────────────────────────────────
router.post('/', async (req: AuthRequest & { io?: any }, res: Response): Promise<void> => {
  try {
    const { boardId } = req.params;
    const userId = req.user!.userId;
    const { title, description, assigneeId, priority, dueDate, columnName } = req.body;

    if (!await verifyBoardAccess(boardId, userId)) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    if (!title?.trim()) {
      res.status(400).json({ error: 'Card title is required', code: 'MISSING_FIELDS' });
      return;
    }

    const [card] = await db.insert(cards).values({
      boardId,
      title: title.trim(),
      description: description?.trim(),
      assigneeId: assigneeId ?? null,
      priority: priority ?? 'medium',
      columnName: columnName ?? 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      position: Date.now().toString(),
    }).returning();

    await db.insert(cardActivity).values({
      cardId: card.id,
      userId,
      action: 'created',
      metadata: JSON.stringify({ title: card.title }),
    });

    // Broadcast to all users on this board
    if (req.io) {
      req.io.to(`board:${boardId}`).emit('card:created', { card });
    }

    res.status(201).json({ data: card });
  } catch (err) {
    console.error('[cards/create]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── PATCH /api/v1/boards/:boardId/cards/:cardId ─────────────────────────────
router.patch('/:cardId', async (req: AuthRequest & { io?: any }, res: Response): Promise<void> => {
  try {
    const { boardId, cardId } = req.params;
    const userId = req.user!.userId;

    if (!await verifyBoardAccess(boardId, userId)) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    const { title, description, assigneeId, priority, dueDate, columnName, position } = req.body;

    const [updated] = await db
      .update(cards)
      .set({
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(columnName && { columnName }),
        ...(position && { position }),
        updatedAt: new Date(),
      })
      .where(and(eq(cards.id, cardId), eq(cards.boardId, boardId), isNull(cards.deletedAt)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Card not found', code: 'NOT_FOUND' });
      return;
    }

    await db.insert(cardActivity).values({
      cardId,
      userId,
      action: columnName ? `moved to ${columnName}` : 'updated',
      metadata: JSON.stringify(req.body),
    });

    // Broadcast to all users on this board
    if (req.io) {
      req.io.to(`board:${boardId}`).emit('card:updated', { card: updated });
    }

    res.json({ data: updated });
  } catch (err) {
    console.error('[cards/update]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// ─── DELETE /api/v1/boards/:boardId/cards/:cardId ────────────────────────────
router.delete('/:cardId', async (req: AuthRequest & { io?: any }, res: Response): Promise<void> => {
  try {
    const { boardId, cardId } = req.params;
    const userId = req.user!.userId;

    if (!await verifyBoardAccess(boardId, userId)) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    await db
      .update(cards)
      .set({ deletedAt: new Date() })
      .where(and(eq(cards.id, cardId), eq(cards.boardId, boardId)));

    // Broadcast deletion
    if (req.io) {
      req.io.to(`board:${boardId}`).emit('card:deleted', { cardId });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[cards/delete]', err);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

export default router;