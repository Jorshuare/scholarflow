import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listProjects } from '../../services/projects.service';
import NewProjectModal from './NewProjectModal';

export default function ProjectList() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(project) {
    setProjects((prev) => [project, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Top bar */}
      <header className="border-b border-[#2A2D3A] px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#F0F2F8]">ScholarFlow</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#7B7F96]">{currentUser?.email}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-[#7B7F96] hover:text-[#F0F2F8] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-semibold text-[#F0F2F8]">Your reviews</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New review
          </button>
        </div>

        {/* Project list */}
        {loading ? (
          <p className="text-sm text-[#7B7F96]">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-[#2A2D3A] rounded-xl p-12 text-center">
            <p className="text-sm text-[#7B7F96]">No reviews yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create your first review →
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full text-left bg-[#1A1D27] border border-[#2A2D3A] rounded-xl px-5 py-4 hover:border-indigo-500/50 transition-colors group"
              >
                <p className="text-sm font-medium text-[#F0F2F8] group-hover:text-indigo-300 transition-colors">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-[#7B7F96] mt-1 line-clamp-1">{p.description}</p>
                )}
                <p className="text-xs text-[#7B7F96] mt-2">
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
