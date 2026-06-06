import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMatrix } from '../../services/extraction.service';
import PDFUploadPanel from './PDFUploadPanel';

function StatusBadge({ paper }) {
  const ex = paper.extractionResult;
  if (ex && !ex.failed) {
    return (
      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
        Extracted
      </span>
    );
  }
  if (ex?.failed) {
    return (
      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold border border-amber-100">
        Failed
      </span>
    );
  }
  return (
    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 font-semibold border border-gray-200">
      Pending
    </span>
  );
}

export default function FullTextQueue() {
  const { id: projectId }       = useParams();
  const [papers, setPapers]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    getMatrix(projectId).then(data => {
      setPapers(data);
      setLoading(false);
    });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  function handleExtracted(updated) {
    setPapers(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  }

  const extracted = papers.filter(p => p.extractionResult && !p.extractionResult.failed).length;
  const total     = papers.length;
  const pct       = total > 0 ? Math.round((extracted / total) * 100) : 0;

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;

  return (
    <div className="flex h-full bg-[#F0F2F8]">
      {/* Left — paper list */}
      <div className="w-72 shrink-0 bg-white border-r border-[#E4E7EF] flex flex-col">
        <div className="px-4 py-4 border-b border-[#E4E7EF]">
          <h1 className="text-sm font-bold text-gray-800">Full-Text Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {extracted} / {total} extracted ({pct}%)
          </p>
          {total > 0 && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {total === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 font-medium">No included papers yet</p>
              <p className="text-xs text-gray-400 mt-1">Screen papers first, then upload PDFs here.</p>
            </div>
          ) : (
            papers.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full text-left px-4 py-3 border-b border-[#F0F2F8] transition-colors ${
                  selected?.id === p.id
                    ? 'bg-[#002868]/5 border-l-2 border-l-[#C8A951] pl-3.5'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{p.title}</p>
                  <StatusBadge paper={p} />
                </div>
                {p.authors && (
                  <p className="text-[10px] text-gray-400 mt-1 truncate">{p.authors}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right — upload / edit panel */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <PDFUploadPanel
            key={selected.id}
            projectId={projectId}
            paper={selected}
            onExtracted={handleExtracted}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#002868]/5 to-[#002868]/10 border border-[#C8A951]/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                📄
              </div>
              <p className="text-sm font-semibold text-gray-700">Select a paper</p>
              <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                Select a paper from the list, upload its full-text PDF, and let AI extract key information.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
