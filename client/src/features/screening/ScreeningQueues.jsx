import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getResults, confirmDecisions, overrideDecision, getMethodology } from '../../services/autoScreening.service';

// Clamped reasoning line that reveals the full AI reasoning on hover.
// Uses fixed positioning because the queue columns are inside overflow-y-auto
// containers that would otherwise clip a normally-positioned tooltip.
function HoverReasoning({ text, className = 'text-gray-400' }) {
  const [hover, setHover] = useState(false);
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  if (!text) return null;

  function show() {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top:  rect.bottom + 6,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 340)),
      });
    }
    setHover(true);
  }

  return (
    <>
      <p
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setHover(false)}
        className={`text-[10px] mt-1 line-clamp-1 cursor-help ${className}`}
      >
        {text}
      </p>
      {hover && (
        <div
          className="fixed z-[60] w-[320px] bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
        >
          {text}
        </div>
      )}
    </>
  );
}

function ConfidenceBar({ value, color }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-semibold text-gray-400 w-7 text-right">{value}%</span>
    </div>
  );
}

function AIBanner({ result }) {
  const isInclude = result.recommendation === 'INCLUDE';
  const isExclude = result.recommendation === 'EXCLUDE';
  const color    = isInclude ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                 : isExclude ? 'bg-red-50 border-red-200 text-red-600'
                 : 'bg-amber-50 border-amber-200 text-amber-700';
  const barColor  = isInclude ? '#10b981' : isExclude ? '#ef4444' : '#f59e0b';
  return (
    <div className={`border rounded-lg px-3 py-2 mb-3 ${color}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold">AI: {result.recommendation} · {result.confidence}% confident</p>
        <div className="flex gap-1">
          {result.matchedInclusion?.map(c => (
            <span key={c} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{c}</span>
          ))}
          {result.triggeredExclusion?.map(c => (
            <span key={c} className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{c}</span>
          ))}
        </div>
      </div>
      <ConfidenceBar value={result.confidence} color={barColor} />
      <p className="text-[10px] mt-1 opacity-75">{result.reasoning}</p>
    </div>
  );
}

// ── Auto-Included queue with per-paper checkboxes ─────────────────────────────
function IncludedQueue({ results, projectId, confirmed, onConfirmed, onConfirming }) {
  const [checkedIds, setCheckedIds] = useState(new Set());
  const allChecked  = results.length > 0 && results.every(r => checkedIds.has(r.paperId));
  const someChecked = checkedIds.size > 0 && !allChecked;

  function toggleCheck(id) {
    setCheckedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleAll() {
    setCheckedIds(allChecked ? new Set() : new Set(results.map(r => r.paperId)));
  }

  async function handleConfirm(ids) {
    onConfirming(true);
    const decisions = [...ids].map(id => ({ paperId: id, finalDecision: 'INCLUDE' }));
    try {
      await confirmDecisions(projectId, decisions);
      onConfirmed();
    } finally {
      onConfirming(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col border-r border-[#E4E7EF] bg-white min-w-0">
      {/* Column header */}
      <div className="px-4 py-3 border-b border-[#E4E7EF] bg-emerald-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700">Auto-Included</p>
            <p className="text-[10px] text-emerald-600">{results.length} papers · high confidence</p>
          </div>
          {confirmed ? (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Confirmed</span>
          ) : results.length > 0 && (
            <div className="flex flex-col items-end gap-1">
              {checkedIds.size > 0 ? (
                <button
                  onClick={() => handleConfirm(checkedIds)}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  Confirm {checkedIds.size} selected
                </button>
              ) : (
                <button
                  onClick={() => handleConfirm(new Set(results.map(r => r.paperId)))}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  Confirm All ({results.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Select-all row */}
        {results.length > 0 && !confirmed && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-100">
            <input
              type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked; }}
              onChange={toggleAll}
              className="w-3 h-3 accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-emerald-700 font-medium">
              {checkedIds.size === 0 ? 'Select papers to confirm individually' : `${checkedIds.size} selected`}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {results.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-4">No papers here</p>
        ) : (
          results.map(r => (
            <div
              key={r.id}
              className={`bg-white border rounded-xl p-3 mb-2 transition-colors ${
                checkedIds.has(r.paperId) ? 'border-emerald-300 bg-emerald-50/40' : 'border-[#E4E7EF]'
              }`}
            >
              <div className="flex items-start gap-2">
                {!confirmed && (
                  <input
                    type="checkbox"
                    checked={checkedIds.has(r.paperId)}
                    onChange={() => toggleCheck(r.paperId)}
                    className="w-3 h-3 mt-0.5 accent-emerald-600 cursor-pointer shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{r.paper.title}</p>
                  {r.paper.authors && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{r.paper.authors}</p>
                  )}
                  <div className="flex gap-2 mt-0.5">
                    {r.paper.year  && <span className="text-[10px] text-gray-400">{r.paper.year}</span>}
                    {r.paper.venue && <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{r.paper.venue}</span>}
                  </div>
                  <ConfidenceBar value={r.confidence} color="#10b981" />
                  <HoverReasoning text={r.reasoning} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Needs Review queue with exclusion reason prompt ───────────────────────────
const QUICK_REASONS = [
  'Out of scope',
  'Wrong study design',
  'Wrong population',
  'Full text not available',
  'Not peer-reviewed',
  'Duplicate',
];

function UncertainQueue({ results, projectId, onDone }) {
  const [index, setIndex]           = useState(0);
  const [saving, setSaving]         = useState(false);
  const [showExcludeForm, setShowExcludeForm] = useState(false);
  const [excludeReason, setExcludeReason]     = useState('');

  const item = results[index];

  function openExclude() {
    setExcludeReason('');
    setShowExcludeForm(true);
  }

  function cancelExclude() {
    setShowExcludeForm(false);
    setExcludeReason('');
  }

  async function decide(decision, reason) {
    setSaving(true);
    try {
      await overrideDecision(projectId, item.paperId, decision, reason || null);
      setShowExcludeForm(false);
      setExcludeReason('');
      if (index + 1 >= results.length) onDone();
      else setIndex(i => i + 1);
    } finally {
      setSaving(false);
    }
  }

  if (!item) return (
    <div className="text-center py-8">
      <p className="text-sm font-semibold text-gray-600">All uncertain papers reviewed</p>
    </div>
  );

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">{index + 1} of {results.length}</p>
      <div className="h-1.5 bg-[#E4E7EF] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${(index / results.length) * 100}%` }}
        />
      </div>

      <div className="bg-white border border-[#E4E7EF] rounded-xl p-4 mb-3">
        <AIBanner result={item} />
        <p className="text-sm font-semibold text-gray-800 leading-snug">{item.paper.title}</p>
        {item.paper.authors && <p className="text-xs text-gray-400 mt-1">{item.paper.authors}</p>}
        {item.paper.abstract && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-4">{item.paper.abstract}</p>
        )}
      </div>

      {showExcludeForm ? (
        /* Exclusion reason form */
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-red-700">Exclusion reason</p>

          {/* Quick-pick chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setExcludeReason(r)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-full border transition-all ${
                  excludeReason === r
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-red-600 border-red-200 hover:border-red-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={excludeReason}
            onChange={e => setExcludeReason(e.target.value)}
            placeholder="Or type a custom reason…"
            className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 transition-all"
            autoFocus
          />

          <div className="flex gap-2">
            <button
              onClick={() => decide('EXCLUDE', excludeReason)}
              disabled={saving}
              className="flex-1 py-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Confirm Exclude'}
            </button>
            <button
              onClick={cancelExclude}
              className="flex-1 py-2 bg-white border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => decide('INCLUDE')}
            disabled={saving}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Include
          </button>
          <button
            onClick={openExclude}
            disabled={saving}
            className="flex-1 py-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Exclude
          </button>
        </div>
      )}
    </div>
  );
}

// ── Auto-Excluded queue ───────────────────────────────────────────────────────
function ExcludedQueue({ results, projectId, confirmed, onConfirmed, onConfirming }) {
  async function handleConfirmAll() {
    onConfirming(true);
    const decisions = results.map(r => ({ paperId: r.paperId, finalDecision: 'EXCLUDE' }));
    try {
      await confirmDecisions(projectId, decisions);
      onConfirmed();
    } finally {
      onConfirming(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <div className="px-4 py-3 border-b border-[#E4E7EF] bg-red-50 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-red-600">Auto-Excluded</p>
          <p className="text-[10px] text-red-500">{results.length} papers · high confidence</p>
        </div>
        {confirmed ? (
          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Confirmed</span>
        ) : results.length > 0 && (
          <button
            onClick={handleConfirmAll}
            className="px-2.5 py-1 bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold rounded-lg transition-colors"
          >
            Confirm All ({results.length})
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {results.length === 0 ? (
          <p className="text-xs text-gray-400 text-center mt-4">No papers here</p>
        ) : (
          results.map(r => (
            <div key={r.id} className="bg-white border border-[#E4E7EF] rounded-xl p-3 mb-2">
              <p className="text-xs font-semibold text-gray-800 leading-snug">{r.paper.title}</p>
              {r.paper.authors && (
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{r.paper.authors}</p>
              )}
              <div className="flex gap-2 mt-0.5">
                {r.paper.year  && <span className="text-[10px] text-gray-400">{r.paper.year}</span>}
                {r.paper.venue && <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{r.paper.venue}</span>}
              </div>
              <ConfidenceBar value={r.confidence} color="#ef4444" />
              <HoverReasoning text={r.reasoning} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function ScreeningQueues() {
  const { id: projectId } = useParams();

  const [included,  setIncluded]  = useState([]);
  const [excluded,  setExcluded]  = useState([]);
  const [uncertain, setUncertain] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState({ included: false, excluded: false });
  const [methodology, setMethodology] = useState('');
  const [showReport, setShowReport]   = useState(false);

  useEffect(() => {
    Promise.all([
      getResults(projectId, 'included'),
      getResults(projectId, 'excluded'),
      getResults(projectId, 'uncertain'),
    ]).then(([inc, exc, unc]) => {
      setIncluded(inc);
      setExcluded(exc);
      setUncertain(unc);
    }).finally(() => setLoading(false));
  }, [projectId]);

  async function loadMethodology() {
    const text = await getMethodology(projectId);
    setMethodology(text);
    setShowReport(true);
  }

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading results…</p>;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-800">Auto-Screening Results</h1>
          <div className="flex gap-4 mt-1">
            <span className="text-xs font-semibold text-emerald-600">{included.length} auto-included</span>
            <span className="text-xs font-semibold text-amber-600">{uncertain.length} needs review</span>
            <span className="text-xs font-semibold text-red-500">{excluded.length} auto-excluded</span>
          </div>
        </div>
        <button
          onClick={loadMethodology}
          className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
        >
          Methodology export
        </button>
      </div>

      {/* Three columns */}
      <div className="flex-1 overflow-hidden flex">
        <IncludedQueue
          results={included}
          projectId={projectId}
          confirmed={confirmed.included}
          onConfirmed={() => setConfirmed(p => ({ ...p, included: true }))}
          onConfirming={setConfirming}
        />

        {/* Needs Review */}
        <div className="flex-1 flex flex-col border-r border-[#E4E7EF] bg-white min-w-0">
          <div className="px-4 py-3 border-b border-[#E4E7EF] bg-amber-50">
            <p className="text-xs font-bold text-amber-700">Needs Review</p>
            <p className="text-[10px] text-amber-600">{uncertain.length} papers · uncertain signals</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {uncertain.length === 0
              ? <p className="text-xs text-gray-400 text-center mt-4">No papers here</p>
              : <UncertainQueue results={uncertain} projectId={projectId} onDone={() => {}} />
            }
          </div>
        </div>

        <ExcludedQueue
          results={excluded}
          projectId={projectId}
          confirmed={confirmed.excluded}
          onConfirmed={() => setConfirmed(p => ({ ...p, excluded: true }))}
          onConfirming={setConfirming}
        />
      </div>

      {/* Methodology modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowReport(false)}>
          <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-gradient-to-r from-[#002868] to-[#C8A951] -mx-6 -mt-6 mb-5 rounded-t-2xl" />
            <h2 className="text-sm font-bold text-gray-800 mb-3">Methodology Export</h2>
            <p className="text-xs text-gray-500 mb-3">Paste this into your paper's Methods section:</p>
            <div className="bg-[#F8FAFC] border border-[#E4E7EF] rounded-xl p-4 text-xs text-gray-700 leading-relaxed max-h-60 overflow-y-auto">
              {methodology}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => navigator.clipboard.writeText(methodology)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="px-4 py-1.5 bg-[#002868] hover:bg-[#001f52] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
