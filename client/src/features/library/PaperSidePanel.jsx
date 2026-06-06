import { useEffect, useState } from 'react';
import { listTags, applyTag, removeTag } from '../../services/tags.service';

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

export default function PaperSidePanel({ paper, projectId, onClose, onPaperChanged }) {
  const [allTags, setAllTags]     = useState([]);
  const [paperTags, setPaperTags] = useState(paper?.paperTags ?? []);
  const [showMenu, setShowMenu]   = useState(false);

  useEffect(() => { listTags(projectId).then(setAllTags); }, [projectId]);
  useEffect(() => { setPaperTags(paper?.paperTags ?? []); }, [paper]);

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
              className="text-xs text-indigo-600 hover:text-indigo-500 transition-colors break-all"
            >
              {paper.doi}
            </a>
          </div>
        )}

        {/* Status */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Status</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[paper.status]}`}>
            {paper.status}
          </span>
          {paper.exclusionReason && (
            <p className="text-xs text-gray-500 mt-1.5 bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-2.5 py-2">
              {paper.exclusionReason}
            </p>
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
                  className="text-[10px] text-indigo-600 hover:text-indigo-500 font-semibold transition-colors"
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
    </div>
  );
}
