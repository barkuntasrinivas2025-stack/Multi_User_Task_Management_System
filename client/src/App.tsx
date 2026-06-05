import { useState } from 'react';
import { useAuth } from './shared/hooks/useAuth';
import { AuthPage } from './features/auth/components/AuthPage';
import { BoardsPage } from './features/boards/components/BoardsPage';
import type { Board } from './features/boards/components/BoardsPage';
import { BoardView } from './features/boards/components/BoardView';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => setSelectedBoard(null)}
          className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition-colors"
        >
          📋 Azentrix Task Board
        </button>
        <div className="flex items-center gap-3">
          {selectedBoard && (
            <span className="text-sm text-slate-500 border-r border-slate-200 pr-3">
              {selectedBoard.name}
            </span>
          )}
          <span className="text-sm text-slate-500">{user.name}</span>
          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main>
        {!selectedBoard ? (
          <BoardsPage user={user} onSelectBoard={setSelectedBoard} />
        ) : (
          <BoardView board={selectedBoard} currentUserId={user.id} />
        )}
      </main>
    </div>
  );
  
}
