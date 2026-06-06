import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { getMatrix, patchExtraction } from '../../services/extraction.service';

const META_COLS    = [{ key: 'title', label: 'Title' }, { key: 'authors', label: 'Authors' }, { key: 'year', label: 'Year' }];
const EXTRACT_COLS = [
  { key: 'method',       label: 'Method'       },
  { key: 'dataset',      label: 'Dataset'       },
  { key: 'metric',       label: 'Metric'        },
  { key: 'performance',  label: 'Performance'   },
  { key: 'limitations',  label: 'Limitations'   },
  { key: 'futureWork',   label: 'Future Work'   },
  { key: 'contribution', label: 'Contribution'  },
];
const ALL_COLS     = [...META_COLS, ...EXTRACT_COLS];
const EXTRACT_KEYS = new Set(EXTRACT_COLS.map(c => c.key));

function EditableCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  function commit() {
    setEditing(false);
    if (draft !== (value || '')) onSave(draft);
  }

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        title="Click to edit"
        className="cursor-text min-h-[1.25rem] text-xs text-gray-700 hover:bg-[#002868]/5 rounded px-1 py-0.5 transition-colors border border-transparent hover:border-[#C8A951]/20"
      >
        {value || <span className="text-gray-300 italic">—</span>}
      </div>
    );
  }

  return (
    <textarea
      autoFocus
      rows={3}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
      className="w-full bg-white border border-[#C8A951]/50 rounded-lg px-1.5 py-1 text-xs text-gray-800 outline-none resize-none focus:ring-2 focus:ring-[#C8A951]/20"
    />
  );
}

export default function EvidenceMatrix() {
  const { id: projectId }     = useParams();
  const [papers, setPapers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [visible, setVisible] = useState(ALL_COLS.map(c => c.key));
  const [colMenu, setColMenu] = useState(false);
  const [exporting, setExp]   = useState(false);

  useEffect(() => {
    getMatrix(projectId).then(data => { setPapers(data); setLoading(false); });
  }, [projectId]);

  async function handleSave(paperId, field, value) {
    setPapers(prev => prev.map(p => {
      if (p.id !== paperId) return p;
      return { ...p, extractionResult: { ...p.extractionResult, [field]: value } };
    }));
    await patchExtraction(projectId, paperId, { [field]: value });
  }

  async function handleExportCsv() {
    setExp(true);
    try {
      const res = await api.get(`/projects/${projectId}/matrix.csv`, { responseType: 'text' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'evidence-matrix.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExp(false);
    }
  }

  function toggleCol(key) {
    setVisible(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  const displayed = papers.filter(p => {
    if (filter === 'extracted') return !!(p.extractionResult && !p.extractionResult.failed);
    if (filter === 'pending')   return !p.extractionResult || p.extractionResult.failed;
    return true;
  });

  const activeCols    = ALL_COLS.filter(c => visible.includes(c.key));
  const extractedCount = papers.filter(p => p.extractionResult && !p.extractionResult.failed).length;

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-gray-800">Evidence Matrix</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {extractedCount}/{papers.length} extracted · click any extraction cell to edit
          </p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          {/* Filter pills */}
          <div className="flex gap-0.5 bg-[#F0F2F8] rounded-lg p-0.5 border border-[#E4E7EF]">
            {[['all', 'All'], ['extracted', 'Extracted'], ['pending', 'Pending']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  filter === val ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Column picker */}
          <div className="relative">
            <button
              onClick={() => setColMenu(v => !v)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
            >
              Columns
            </button>
            {colMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setColMenu(false)} />
                <div className="absolute right-0 top-9 z-20 bg-white border border-[#E4E7EF] rounded-xl p-3 min-w-[180px] shadow-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Visible columns</p>
                  {ALL_COLS.map(c => (
                    <label key={c.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visible.includes(c.key)}
                        onChange={() => toggleCol(c.key)}
                        className="accent-[#002868]"
                      />
                      <span className="text-xs text-gray-700">{c.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3 py-1.5 bg-[#002868] hover:bg-[#001f52] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-8 bg-white">
          <div>
            <div className="w-12 h-12 rounded-full bg-[#002868]/5 border border-[#C8A951]/20 flex items-center justify-center mx-auto mb-3 text-xl">🔬</div>
            <p className="text-sm font-semibold text-gray-700">
              {filter !== 'all' ? 'No papers match this filter' : 'No included papers yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filter !== 'all'
                ? 'Try switching the filter above.'
                : 'Upload PDFs via Full-Text Queue to populate this matrix.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#F8FAFC] z-10 border-b border-[#E4E7EF]">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-8">#</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">Status</th>
                {activeCols.map(c => (
                  <th key={c.key} className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((p, i) => {
                const ex          = p.extractionResult;
                const isExtracted = !!(ex && !ex.failed);
                return (
                  <tr key={p.id} className="border-b border-[#F0F2F8] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-3 py-2.5 text-xs text-gray-300 align-top">{i + 1}</td>
                    <td className="px-3 py-2.5 align-top">
                      {isExtracted ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">✓</span>
                      ) : ex?.failed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-100">!</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 font-bold border border-gray-200">—</span>
                      )}
                    </td>
                    {activeCols.map(c => {
                      const isEx  = EXTRACT_KEYS.has(c.key);
                      const value = isEx ? ex?.[c.key] : p[c.key];
                      return (
                        <td key={c.key} className="px-3 py-2.5 align-top max-w-[220px]">
                          {isEx ? (
                            <EditableCell value={value} onSave={v => handleSave(p.id, c.key, v)} />
                          ) : (
                            <span className="text-xs text-gray-700">
                              {value || <span className="text-gray-300 italic">—</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
