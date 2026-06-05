import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../../shared/lib/api';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
}

interface BoardsPageProps {
  user: { id: string; name: string };
  onSelectBoard: (board: Board) => void;
}

export function BoardsPage({ user, onSelectBoard }: BoardsPageProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    api.get('/boards')
      .then(res => setBoards(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await api.post('/boards', {
        name: newBoardName.trim(),
        description: newBoardDesc.trim(),
      });
      setBoards(prev => [res.data.data, ...prev]);
      setNewBoardName('');
      setNewBoardDesc('');
      setShowCreate(false);
      toast.success('Board created successfully!');
    } catch {
      // Handled by global interceptor
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/boards/join/${inviteCode.trim()}`);
      setBoards(prev => [...prev, res.data.data]);
      setInviteCode('');
      setShowJoin(false);
      toast.success('Joined board successfully!');
    } catch {
      // Handled by global interceptor
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Boards</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Welcome back, {user.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); }}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Join Board
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); }}
            className="text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New Board
          </button>
        </div>
      </div>

      {/* Create board form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Create New Board</h3>
          <input
            type="text"
            placeholder="Board name"
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newBoardDesc}
            onChange={e => setNewBoardDesc(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="text-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Join board form */}
      {showJoin && (
        <form onSubmit={handleJoin} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Join Board via Invite Code</h3>
          <input
            type="text"
            placeholder="Paste invite code (UUID)"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="text-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Join
            </button>
            <button type="button" onClick={() => setShowJoin(false)} className="text-xs px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Boards grid */}
      {loading ? (
        <div className="text-sm text-slate-400 text-center py-12">Loading boards...</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm mb-3">No boards yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create your first board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(board => (
            <button
              key={board.id}
              onClick={() => onSelectBoard(board)}
              className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-indigo-600 text-sm font-bold">
                  {board.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                {board.name}
              </h3>
              {board.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{board.description}</p>
              )}
              <p className="text-[10px] text-slate-300 mt-3">
                {board.ownerId === user.id ? 'Owner' : 'Member'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
