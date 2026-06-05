import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import type { Board } from './BoardsPage';
import { io as socketIO } from 'socket.io-client';
import { useRef } from 'react';

interface Card {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  columnName: 'todo' | 'in_progress' | 'done';
  position: string;
  boardId: string;
}

interface BoardViewProps {
  board: Board;
  currentUserId: string;
}

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-100' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-blue-50'   },
  { id: 'done',        label: 'Done',         color: 'bg-green-50'  },
] as const;

const PRIORITY_COLORS = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100 text-red-600',
};

export function BoardView({ board, currentUserId: _currentUserId }: BoardViewProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const socketRef = useRef<any>(null);

useEffect(() => {
  const token = localStorage.getItem('token');
  const socket = socketIO(
    import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
    { auth: { token } }
  );
  socketRef.current = socket;
  socket.emit('board:join', board.id);

  socket.on('card:created', ({ card }: { card: Card }) => {
    setCards(prev => prev.find(c => c.id === card.id) ? prev : [...prev, card]);
  });

  socket.on('card:updated', ({ card }: { card: Card }) => {
    setCards(prev => prev.map(c => c.id === card.id ? card : c));
  });

  socket.on('card:deleted', ({ cardId }: { cardId: string }) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  });

  return () => {
    socket.emit('board:leave', board.id);
    socket.disconnect();
  };
}, [board.id]);

  useEffect(() => {
    api.get(`/boards/${board.id}/cards`)
      .then(res => setCards(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [board.id]);

  const handleAddCard = async (columnName: string) => {
    if (!newCardTitle.trim()) return;
    try {
      const res = await api.post(`/boards/${board.id}/cards`, {
        title: newCardTitle.trim(),
        columnName,
        priority: newCardPriority,
      });
      setCards(prev => [...prev, res.data.data]);
      setNewCardTitle('');
      setNewCardPriority('medium');
      setAddingTo(null);
    } catch {
      console.error('Failed to add card');
    }
  };

  const handleMoveCard = async (cardId: string, newColumn: string) => {
    // Optimistic update
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, columnName: newColumn as Card['columnName'] } : c
    ));
    try {
      await api.patch(`/boards/${board.id}/cards/${cardId}`, { columnName: newColumn });
    } catch {
      // Revert on failure
      setCards(prev => prev.map(c =>
        c.id === cardId ? { ...c, columnName: cards.find(x => x.id === cardId)!.columnName } : c
      ));
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    try {
      await api.delete(`/boards/${board.id}/cards/${cardId}`);
    } catch {
      console.error('Failed to delete card');
    }
  };

  const handleUpdateCard = async (cardId: string, patch: Partial<Card>) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...patch } : c));
    try {
      await api.patch(`/boards/${board.id}/cards/${cardId}`, patch);
    } catch {
      console.error('Failed to update card');
    }
    setEditingCard(null);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Loading board...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Board invite link */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-slate-400">Invite link:</span>
        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 select-all">
          {board.inviteCode}
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(board.inviteCode)}
          className="text-xs text-indigo-600 hover:underline"
        >
          Copy
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colCards = cards
            .filter(c => c.columnName === col.id)
            .sort((a, b) => a.position.localeCompare(b.position));

          return (
            <div key={col.id} className={`${col.color} rounded-xl p-3 min-h-96`}>
              {/* Column header */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  {col.label}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {colCards.length}
                  </span>
                </h3>
                <button
                  onClick={() => { setAddingTo(col.id); setNewCardTitle(''); }}
                  className="text-slate-400 hover:text-indigo-600 text-lg leading-none"
                >
                  +
                </button>
              </div>

              {/* Add card form */}
              {addingTo === col.id && (
                <div className="bg-white rounded-lg p-3 mb-2 border border-slate-200 space-y-2">
                  <input
                    type="text"
                    placeholder="Card title"
                    value={newCardTitle}
                    onChange={e => setNewCardTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCard(col.id)}
                    autoFocus
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <select
                    value={newCardPriority}
                    onChange={e => setNewCardPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAddCard(col.id)}
                      className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingTo(null)}
                      className="text-xs px-3 py-1 border border-slate-200 rounded hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="space-y-2">
                {colCards.map(card => (
                  <div
                    key={card.id}
                    className={`bg-white rounded-lg p-3 border shadow-xs group cursor-pointer
                      ${isOverdue(card.dueDate) && card.columnName !== 'done'
                        ? 'border-red-300'
                        : 'border-slate-200'
                      }`}
                    onClick={() => setEditingCard(card)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-medium text-slate-800 flex-1">
                        {card.title}
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteCard(card.id); }}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {card.description && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {card.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[card.priority]}`}>
                        {card.priority}
                      </span>
                      {card.dueDate && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isOverdue(card.dueDate) && card.columnName !== 'done'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {new Date(card.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Move buttons */}
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.id !== 'todo' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const prev = COLUMNS[COLUMNS.findIndex(c => c.id === col.id) - 1];
                            if (prev) handleMoveCard(card.id, prev.id);
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded hover:bg-slate-200"
                        >
                          ← Move back
                        </button>
                      )}
                      {col.id !== 'done' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            const next = COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1];
                            if (next) handleMoveCard(card.id, next.id);
                          }}
                          className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Move forward →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit card modal */}
      {editingCard && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingCard(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-800">Edit Card</h3>
            <input
              type="text"
              defaultValue={editingCard.title}
              onChange={e => setEditingCard(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Description (optional)"
              defaultValue={editingCard.description ?? ''}
              onChange={e => setEditingCard(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Priority</label>
                <select
                  value={editingCard.priority}
                  onChange={e => setEditingCard(prev => prev ? { ...prev, priority: e.target.value as 'low' | 'medium' | 'high' } : null)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Due Date</label>
                <input
                  type="date"
                  defaultValue={editingCard.dueDate?.slice(0, 10) ?? ''}
                  onChange={e => setEditingCard(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateCard(editingCard.id, {
                  title: editingCard.title,
                  description: editingCard.description,
                  priority: editingCard.priority,
                  dueDate: editingCard.dueDate,
                })}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingCard(null)}
                className="flex-1 border border-slate-200 rounded-lg py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}