import { useEffect, useState } from 'react';
import { listTags, applyTag, removeTag } from '../../services/tags.service';
import { deletePaper } from '../../services/papers.service';
import { screenPaper } from '../../services/screening.service';

const STATUS_STYLE = {
  INCLUDED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  EXCLUDED: 'bg-red-50    text-red-600    border border-red-200',
  PENDING:  'bg-amber-50  text-amber-700  border border-amber-200',
};

function TagChip({ tag, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: tag.colour + '18', color: tag.colour }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.colour }} />
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">×</button>
      )}
    </span>
  );
}

export default function PaperSidePanel({ paper, projectId, onClose, onPaperChanged, onDeleted }) {
  const [allTags, setAllTags]         = useState([]);
  const [paperTags, setPaperTags]     = useState(paper?.paperTags ?? []);
  const [showMenu, setShowMenu]       = useState(false);
  const [confirming, setConfirming]   = useState(false);
  const [deleting, setDeleting]       = useState(false);

  // Status-change state
  const [changingStatus, setChangingStatus] = useState(false);
  const [pendingStatus, setPendingStatus]   = useState(null); // 'INCLUDED' | 'EXCLUDED' | 'PENDING'
  const [excludeReason, setExcludeReason]   = useState('');
  const [savingStatus, setSavingStatus]     = useState(false);

  useEffect(() => { listTags(projectId).then(setAllTags); }, [projectId]);
  useEffect(() => {
    setPaperTags(paper?.paperTags ?? []);
    setChangingStatus(false);
    setPendingStatus(null);
    setExcludeReason('');
  }, [paper]);

  if (!paper) return null;

  const appliedIds = new Set(paperTags.map(pt => pt.tagId));
  const unapplied  = allTags.filter(t => !appliedIds.has(t.id));

  async function handleApply(tag) {
    await applyTag(projectId, paper.id, tag.id);
    const next = [...paperTags, { tagId: tag.id, tag }];
    setPaperTags(next);
    onPaperChanged?.({ ...paper, paperTags: next });
    setShowMenu(false);
  }

  async function handleRemove(tagId) {
    await removeTag(projectId, paper.id, tagId);
    const next = paperTags.filter(pt => pt.tagId !== tagId);
    setPaperTags(next);
    onPaperChanged?.({ ...paper, paperTags: next });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePaper(projectId, paper.id);
      onDeleted?.(paper.id);
      onClose();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  // ── Status change ──────────────────────────────────────────────────────────
  function openStatusChange() {
    setPendingStatus(paper.status);
    setExcludeReason(paper.exclusionReason ?? '');
    setChangingStatus(true);
  }

  function cancelStatusChange() {
    setChangingStatus(false);
    setPendingStatus(null);
    setExcludeReason('');
  }

  async function saveStatusChange() {
    if (!pendingStatus || pendingStatus === paper.status) {
      cancelStatusChange();
      return;
    }
    setSavingStatus(true);
    try {
      const payload = { status: pendingStatus };
      if (pendingStatus === 'EXCLUDED') payload.exclusionReason = excludeReason || null;
      else payload.exclusionReason = null;
      const updated = await screenPaper(projectId, paper.id, payload);
      onPaperChanged?.({ ...paper, ...updated });
      setChangingStatus(false);
    } finally {
      setSavingStatus(false);
    }
  }

  const STATUS_OPTS = [
    { value: 'INCLUDED', label: 'Include',    activeClass: 'bg-emerald-500 text-white border-emerald-500', inactiveClass: 'bg-white text-gray-500 border-[#E4E7EF] hover:border-emerald-300 hover:text-emerald-600' },
    { value: 'EXCLUDED', label: 'Exclude',    activeClass: 'bg-red-500 text-white border-red-500',         inactiveClass: 'bg-white text-gray-500 border-[#E4E7EF] hover:border-red-300 hover:text-red-600' },
    { value: 'PENDING',  label: 'Reset',      activeClass: 'bg-amber-400 text-white border-amber-400',     inactiveClass: 'bg-white text-gray-500 border-[#E4E7EF] hover:border-amber-300 hover:text-amber-600' },
  ];

  return (
    <div className="w-96 shrink-0 border-l border-[#E4E7EF] bg-white h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E7EF] bg-[#F8FAFC]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paper details</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">×</button>
      </div>

      <div className="px-5 py-4 space-y-4 flex-1">
        <p className="text-sm font-bold text-gray-800 leading-snug">{paper.title}</p>

        {paper.authors && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Authors</p>
            <p className="text-xs text-gray-700">{paper.authors}</p>
          </div>
        )}

        <div className="flex gap-5">
          {paper.year && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Year</p>
              <p className="text-xs text-gray-700">{paper.year}</p>
            </div>
          )}
          {paper.venue && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Venue</p>
              <p className="text-xs text-gray-700">{paper.venue}</p>
            </div>
          )}
        </div>

        {paper.doi && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">DOI</p>
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#002868] hover:text-[#001f52] transition-colors break-all"
            >
              {paper.doi}
            </a>
          </div>
        )}

        {/* ── Status ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</p>
            {!changingStatus && (
              <button
                onClick={openStatusChange}
                className="text-[10px] font-semibold text-[#002868] hover:text-[#C8A951] transition-colors"
              >
                Change →
              </button>
            )}
          </div>

          {!changingStatus ? (
            <>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[paper.status]}`}>
                {paper.status}
              </span>
              {paper.exclusionReason && (
                <p className="text-xs text-gray-500 mt-1.5 bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-2.5 py-2">
                  {paper.exclusionReason}
                </p>
              )}
            </>
          ) : (
            <div className="bg-[#F8FAFC] border border-[#E4E7EF] rounded-xl p-3 space-y-3">
              {/* Three-button toggle */}
              <div className="flex gap-1.5">
                {STATUS_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPendingStatus(opt.value)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                      pendingStatus === opt.value ? opt.activeClass : opt.inactiveClass
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Exclusion reason input */}
              {pendingStatus === 'EXCLUDED' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Exclusion reason <span className="font-normal normal-case text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={excludeReason}
                    onChange={e => setExcludeReason(e.target.value)}
                    placeholder="e.g. Out of scope, wrong study design…"
                    className="w-full bg-white border border-[#E4E7EF] rounded-lg px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all"
                    autoFocus
                  />
                </div>
              )}

              {/* Save / Cancel */}
              <div className="flex gap-2">
                <button
                  onClick={saveStatusChange}
                  disabled={savingStatus || pendingStatus === paper.status}
                  className="flex-1 py-1.5 bg-[#002868] hover:bg-[#001f52] disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {savingStatus ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 py-1.5 bg-white border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tags</p>
            {unapplied.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(v => !v)}
                  className="text-[10px] text-[#002868] hover:text-[#001f52] font-semibold transition-colors"
                >
                  + Add tag
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-5 z-20 bg-white border border-[#E4E7EF] rounded-xl p-2 min-w-[160px] shadow-xl max-h-52 overflow-y-auto">
                      {unapplied.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleApply(tag)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.colour }} />
                          <span className="text-xs text-gray-700 font-medium">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {paperTags.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No tags applied</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {paperTags.map(pt => (
                <TagChip key={pt.tagId} tag={pt.tag} onRemove={() => handleRemove(pt.tagId)} />
              ))}
            </div>
          )}
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Abstract</p>
            <p className="text-xs text-gray-600 leading-relaxed">{paper.abstract}</p>
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="px-5 py-4 border-t border-[#E4E7EF]">
        {confirming ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-red-700 mb-2">Delete this paper permanently?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-1.5 bg-white border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all font-medium"
          >
            Delete paper
          </button>
        )}
      </div>
    </div>
  );
}
