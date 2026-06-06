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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#1A1D27] border border-[#2A2D3A] rounded-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-[#F0F2F8] mb-4">New review project</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#7B7F96] mb-1">Project name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#0F1117] border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm text-[#F0F2F8] placeholder-[#7B7F96] focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. ML for autonomous vehicles"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#7B7F96] mb-1">Description <span className="text-[#7B7F96]">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#0F1117] border border-[#2A2D3A] rounded-lg px-3 py-2 text-sm text-[#F0F2F8] placeholder-[#7B7F96] focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Brief description of the review topic…"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#7B7F96] hover:text-[#F0F2F8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
