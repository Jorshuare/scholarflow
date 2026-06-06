import { useState } from 'react';
import { createProject } from '../../services/projects.service';

export default function NewProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const project = await createProject({ name, description });
      onCreated(project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#E4E7EF] w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-[#002868] to-[#C8A951]" />
        <div className="p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4">New review project</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Project name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="e.g. ML for autonomous vehicles"
                className="w-full bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Description <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of the review topic…"
                className="w-full bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#002868] hover:bg-[#001f52] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
