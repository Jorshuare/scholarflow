import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listTags, createTag, deleteTag } from '../../services/tags.service';

export const TAG_PALETTE = [
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899',
];

function TagBadge({ tag, onDelete }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: tag.colour + '18', color: tag.colour, border: `1px solid ${tag.colour}30` }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.colour }} />
      {tag.name}
      {onDelete && (
        <button
          onClick={() => onDelete(tag.id)}
          className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-xs opacity-50 hover:opacity-100 hover:bg-black/10 transition-all"
        >
          ×
        </button>
      )}
    </span>
  );
}

export default function TagsManager() {
  const { id: projectId } = useParams();
  const [tags, setTags]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState('');
  const [colour, setColour]   = useState(TAG_PALETTE[10]); // indigo default
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    listTags(projectId).then(setTags).finally(() => setLoading(false));
  }, [projectId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const tag = await createTag(projectId, { name: name.trim(), colour });
      setTags(prev => [...prev, tag]);
      setName('');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tid) {
    await deleteTag(projectId, tid);
    setTags(prev => prev.filter(t => t.id !== tid));
  }

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF]">
        <h1 className="text-sm font-bold text-gray-800">Tags</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Organise papers with colour-coded labels. Apply tags from any paper's detail panel.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 max-w-2xl">
        {/* Create form */}
        <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-6 mb-6">
          <p className="text-xs font-bold text-gray-700 mb-4">Create a new tag</p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Machine Learning, RCT, Systematic Review…"
                maxLength={40}
                className="w-full bg-[#F8FAFC] border border-[#E4E7EF] focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Colour</label>
              <div className="flex flex-wrap gap-2">
                {TAG_PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColour(c)}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: c,
                      outline: colour === c ? `2.5px solid ${c}` : 'none',
                      outlineOffset: '3px',
                      boxShadow: colour === c ? `0 0 0 1px white, 0 0 0 3.5px ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {name.trim() && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Preview</label>
                <TagBadge tag={{ name: name.trim(), colour }} />
              </div>
            )}

            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              {saving ? 'Creating…' : 'Create tag'}
            </button>
          </form>
        </div>

        {/* Existing tags */}
        <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-6">
          <p className="text-xs font-bold text-gray-700 mb-4">
            Project tags
            <span className="ml-2 text-gray-400 font-normal">({tags.length})</span>
          </p>

          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="text-xs text-gray-400">No tags yet. Create one above.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <TagBadge key={tag.id} tag={tag} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
