import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listPapers } from '../../services/papers.service';
import { screenPaper } from '../../services/screening.service';

const EXCLUSION_REASONS = [
  'Title/abstract not relevant',
  'Wrong study design',
  'Wrong population',
  'Wrong intervention',
  'Wrong outcome',
  'Duplicate',
  'Full text not available',
  'Other',
];

export default function ScreeningCard() {
  const { id: projectId } = useParams();
  const [queue, setQueue]           = useState([]);
  const [index, setIndex]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [selectedReasons, setSelected] = useState([]);
  const [otherText, setOtherText]   = useState('');
  const [total, setTotal]           = useState(0);

  useEffect(() => {
    listPapers(projectId, { status: 'PENDING' })
      .then(papers => { setQueue(papers); setTotal(papers.length); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const paper    = queue[index];
  const done     = !paper;
  const progress = total > 0 ? ((total - queue.length + index) / total) * 100 : 0;

  function toggleReason(r) {
    setSelected(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  async function decide(status, exclusionReason) {
    if (!paper) return;
    setSaving(true);
    try {
      await screenPaper(projectId, paper.id, { status, exclusionReason });
      setShowReasons(false);
      setSelected([]);
      setOtherText('');
      setIndex(i => i + 1);
    } finally {
      setSaving(false);
    }
  }

  function confirmExclusion() {
    const reasons = selectedReasons.map(r =>
      r === 'Other' && otherText.trim() ? `Other: ${otherText.trim()}` : r
    );
    if (!reasons.length) return;
    decide('EXCLUDED', reasons.join('; '));
  }

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-sm font-bold text-gray-800">Screening</h1>
          <span className="text-xs text-gray-400">
            {done ? total : index + 1} / {total}
          </span>
        </div>
        <div className="h-1.5 bg-[#E4E7EF] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#002868] to-[#C8A951] transition-all duration-300 rounded-full"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 overflow-auto px-6 py-6 flex flex-col items-center">
        {done ? (
          <div className="max-w-lg w-full text-center mt-16">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <p className="text-sm font-bold text-gray-800">All papers screened</p>
            <p className="text-xs text-gray-400 mt-1">
              {total} paper{total !== 1 ? 's' : ''} processed. Go to the Library to review decisions.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl w-full">
            {/* Paper card */}
            <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <p className="text-base font-bold text-gray-800 leading-snug">{paper.title}</p>
                {paper.authors && <p className="text-xs text-gray-400 mt-1">{paper.authors}</p>}
                <div className="flex gap-3 mt-1">
                  {paper.year  && <span className="text-xs text-gray-400">{paper.year}</span>}
                  {paper.venue && <span className="text-xs text-gray-400">{paper.venue}</span>}
                </div>
              </div>
              {paper.abstract ? (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Abstract</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{paper.abstract}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No abstract available</p>
              )}
            </div>

            {/* Actions */}
            {!showReasons ? (
              <div className="flex gap-3 mt-4 justify-center">
                <button
                  onClick={() => decide('INCLUDED')}
                  disabled={saving}
                  className="flex-1 max-w-[160px] py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Include
                </button>
                <button
                  onClick={() => decide('PENDING')}
                  disabled={saving}
                  className="flex-1 max-w-[160px] py-2.5 bg-white border border-[#E4E7EF] hover:bg-[#F8FAFC] disabled:opacity-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Skip
                </button>
                <button
                  onClick={() => setShowReasons(true)}
                  disabled={saving}
                  className="flex-1 max-w-[160px] py-2.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Exclude
                </button>
              </div>
            ) : (
              <div className="mt-4 bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
                  Select exclusion reason(s)
                </p>
                <div className="space-y-1">
                  {EXCLUSION_REASONS.map(reason => {
                    const checked = selectedReasons.includes(reason);
                    return (
                      <button
                        key={reason}
                        onClick={() => toggleReason(reason)}
                        disabled={saving}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                          checked
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'text-gray-600 hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-xs font-bold ${
                          checked ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300'
                        }`}>
                          {checked && '✓'}
                        </span>
                        {reason}
                      </button>
                    );
                  })}
                </div>

                {selectedReasons.includes('Other') && (
                  <input
                    type="text"
                    value={otherText}
                    onChange={e => setOtherText(e.target.value)}
                    placeholder="Describe the reason…"
                    autoFocus
                    className="mt-3 w-full bg-[#F8FAFC] border border-[#E4E7EF] focus:border-red-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
                  />
                )}

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => { setShowReasons(false); setSelected([]); setOtherText(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={confirmExclusion}
                    disabled={saving || !selectedReasons.length || (selectedReasons.includes('Other') && !otherText.trim())}
                    className="px-4 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {saving ? 'Saving…' : `Confirm${selectedReasons.length > 1 ? ` (${selectedReasons.length})` : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
