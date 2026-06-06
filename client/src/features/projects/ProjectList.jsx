import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listProjects } from '../../services/projects.service';
import NewProjectModal from './NewProjectModal';

const CARD_ACCENTS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#3b82f6'];

export default function ProjectList() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  function handleCreated(project) {
    setProjects(prev => [project, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#F0F2F8]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E4E7EF] px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
          ScholarFlow
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{currentUser?.email}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
            Your Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered systematic literature reviews</p>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">{projects.length} review{projects.length !== 1 ? 's' : ''}</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            + New review
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-dashed border-[#E4E7EF] rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-xl">
              📚
            </div>
            <p className="text-sm text-gray-500">No reviews yet.</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
              Create your first review →
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {projects.map((p, i) => {
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full text-left bg-white border border-[#E4E7EF] rounded-xl overflow-hidden hover:shadow-md hover:border-[#D0D3E0] transition-all duration-150 group flex"
                >
                  <div className="w-1 shrink-0" style={{ backgroundColor: accent }} />
                  <div className="flex-1 px-5 py-4">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.description}</p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-2">
                      Created {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center pr-4">
                    <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
