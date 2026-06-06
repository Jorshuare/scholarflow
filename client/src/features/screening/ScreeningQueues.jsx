import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults, confirmDecisions, overrideDecision, getMethodology } from '../../services/autoScreening.service';
import { screenPaper } from '../../services/screening.service';

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
  const color = isInclude ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
               : isExclude ? 'bg-red-50 border-red-200 text-red-600'
               : 'bg-amber-50 border-amber-200 text-amber-700';
  const barColor = isInclude ? '#10b981' : isExclude ? '#ef4444' : '#f59e0b';

  return (
    <div className={`border rounded-lg px-3 py-2 mb-3 ${color}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold">AI: {result.recommendation} · {result.confidence}% confident</p>
        {result.matchedInclusion?.length > 0 && (
          <div className="flex gap-1">
            {result.matchedInclusion.map(c => (
              <span key={c} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        )}
        {result.triggeredExclusion?.length > 0 && (
          <div className="flex gap-1">
            {result.triggeredExclusion.map(c => (
              <span key={c} className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        )}
      </div>
      <ConfidenceBar value={result.confidence} color={barColor} />
      <p className="text-[10px] mt-1 opacity-75">{result.reasoning}</p>
    </div>
  );
}

function PaperCard({ result, compact = false }) {
  const p = result.paper;
  return (
    <div className="bg-white border border-[#E4E7EF] rounded-xl p-3 mb-2">
      {!compact && <AIBanner result={result} />}
      <p className="text-xs font-semibold text-gray-800 leading-snug">{p.title}</p>
      {p.authors && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.authors}</p>}
      <div className="flex gap-2 mt-0.5">
        {p.year  && <span className="text-[10px] text-gray-400">{p.year}</span>}
        {p.venue && <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{p.venue}</span>}
      </div>
      {compact && (
        <div className="mt-1.5">
          <ConfidenceBar
            value={result.confidence}
            color={result.recommendation === 'INCLUDE' ? '#10b981' : '#ef4444'}
          />
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{result.reasoning}</p>
        </div>
      )}
    </div>
  );
}

function UncertainQueue({ results, projectId, onDone }) {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const item = results[index];

  async function decide(decision) {
    setSaving(true);
    try {
      await overrideDecision(projectId, item.paperId, decision);
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
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${((index) / results.length) * 100}%` }} />
      </div>
      <div className="bg-white border border-[#E4E7EF] rounded-xl p-4 mb-3">
        <AIBanner result={item} />
        <p className="text-sm font-semibold text-gray-800 leading-snug">{item.paper.title}</p>
        {item.paper.authors && <p className="text-xs text-gray-400 mt-1">{item.paper.authors}</p>}
        {item.paper.abstract && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-4">{item.paper.abstract}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => decide('INCLUDE')} disabled={saving}
          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          Include
        </button>
        <button onClick={() => decide('EXCLUDE')} disabled={saving}
          className="flex-1 py-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          Exclude
        </button>
      </div>
    </div>
  );
}

export default function ScreeningQueues() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [included,  setIncluded]  = useState([]);
  const [excluded,  setExcluded]  = useState([]);
  const [uncertain, setUncertain] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState({ included: false, excluded: false });
  const [methodology, setMethodology] = useState('');
  const [showReport, setShowReport] = useState(false);

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

  async function bulkConfirm(queue) {
    setConfirming(true);
    const decisions = (queue === 'included' ? included : excluded).map(r => ({
      paperId: r.paperId,
      finalDecision: queue === 'included' ? 'INCLUDE' : 'EXCLUDE',
    }));
    try {
      await confirmDecisions(projectId, decisions);
      setConfirmed(prev => ({ ...prev, [queue]: true }));
    } finally {
      setConfirming(false);
    }
  }

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
            <span className="text-xs font-semibold text-emerald-600">{included.length} included</span>
            <span className="text-xs font-semibold text-amber-600">{uncertain.length} needs review</span>
            <span className="text-xs font-semibold text-red-500">{excluded.length} excluded</span>
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

        {/* Auto-Included */}
        <div className="flex-1 flex flex-col border-r border-[#E4E7EF] bg-white">
          <div className="px-4 py-3 border-b border-[#E4E7EF] bg-emerald-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700">✓ Auto-Included</p>
              <p className="text-[10px] text-emerald-600">{included.length} papers · high confidence</p>
            </div>
            {!confirmed.included && included.length > 0 && (
              <button
                onClick={() => bulkConfirm('included')}
                disabled={confirming}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-colors"
              >
                Confirm All
              </button>
            )}
            {confirmed.included && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Confirmed</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {included.length === 0
              ? <p className="text-xs text-gray-400 text-center mt-4">No papers here</p>
              : included.map(r => <PaperCard key={r.id} result={r} compact />)
            }
          </div>
        </div>

        {/* Needs Review */}
        <div className="flex-1 flex flex-col border-r border-[#E4E7EF] bg-white">
          <div className="px-4 py-3 border-b border-[#E4E7EF] bg-amber-50">
            <p className="text-xs font-bold text-amber-700">⚠ Needs Review</p>
            <p className="text-[10px] text-amber-600">{uncertain.length} papers · uncertain signals</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {uncertain.length === 0
              ? <p className="text-xs text-gray-400 text-center mt-4">No papers here</p>
              : <UncertainQueue results={uncertain} projectId={projectId} onDone={() => {}} />
            }
          </div>
        </div>

        {/* Auto-Excluded */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-[#E4E7EF] bg-red-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600">✗ Auto-Excluded</p>
              <p className="text-[10px] text-red-500">{excluded.length} papers · high confidence</p>
            </div>
            {!confirmed.excluded && excluded.length > 0 && (
              <button
                onClick={() => bulkConfirm('excluded')}
                disabled={confirming}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition-colors"
              >
                Confirm All
              </button>
            )}
            {confirmed.excluded && (
              <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">✓ Confirmed</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {excluded.length === 0
              ? <p className="text-xs text-gray-400 text-center mt-4">No papers here</p>
              : excluded.map(r => <PaperCard key={r.id} result={r} compact />)
            }
          </div>
        </div>
      </div>

      {/* Methodology report modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowReport(false)}>
          <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 -mx-6 -mt-6 mb-5 rounded-t-2xl" />
            <h2 className="text-sm font-bold text-gray-800 mb-3">Methodology Export</h2>
            <p className="text-xs text-gray-500 mb-3">Paste this into your paper's Methods section:</p>
            <div className="bg-[#F8FAFC] border border-[#E4E7EF] rounded-xl p-4 text-xs text-gray-700 leading-relaxed">
              {methodology}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { navigator.clipboard.writeText(methodology); }}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
              >
                Copy
              </button>
              <button onClick={() => setShowReport(false)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
