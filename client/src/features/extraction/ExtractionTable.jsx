import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listPapers, updatePaper } from '../../services/papers.service';
import { downloadExport } from '../../services/export.service';

const DEFAULT_COLS = ['title', 'authors', 'year', 'venue', 'notes'];
const ALL_COLS = ['title', 'authors', 'year', 'venue', 'doi', 'abstract', 'notes'];
const COL_LABELS = {
  title: 'Title', authors: 'Authors', year: 'Year', venue: 'Venue/Journal',
  doi: 'DOI', abstract: 'Abstract', notes: 'Notes',
};

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
        className="cursor-text min-h-[1.25rem] text-xs text-gray-700 hover:bg-[#002868]/5 rounded px-1 py-0.5 transition-colors border border-transparent hover:border-[#C8A951]/20"
        title="Click to edit"
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

export default function ExtractionTable() {
  const { id: projectId } = useParams();
  const [papers, setPapers]       = useState([]);
  const [cols, setCols]           = useState(DEFAULT_COLS);
  const [loading, setLoading]     = useState(true);
  const [showColMenu, setColMenu] = useState(false);

  useEffect(() => {
    listPapers(projectId, { status: 'INCLUDED' }).then(setPapers).finally(() => setLoading(false));
  }, [projectId]);

  async function handleCellSave(paperId, field, value) {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, [field]: value } : p));
    await updatePaper(projectId, paperId, { [field]: value });
  }

  function toggleCol(col) {
    setCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  }

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-800">Extraction Table</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {papers.length} included paper{papers.length !== 1 ? 's' : ''} · click any notes cell to edit
          </p>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setColMenu(v => !v)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
          >
            Columns
          </button>
          {showColMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setColMenu(false)} />
              <div className="absolute right-0 top-9 z-20 bg-white border border-[#E4E7EF] rounded-xl p-3 min-w-[160px] shadow-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Show columns</p>
                {ALL_COLS.map(c => (
                  <label key={c} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={cols.includes(c)} onChange={() => toggleCol(c)} className="accent-[#002868]" />
                    <span className="text-xs text-gray-700 font-medium">{COL_LABELS[c]}</span>
                  </label>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => downloadExport(projectId, 'csv')}
            className="px-3 py-1.5 bg-[#002868] hover:bg-[#001f52] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {papers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-8 bg-white">
          <div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3 text-xl">📋</div>
            <p className="text-sm font-semibold text-gray-700">No included papers yet</p>
            <p className="text-xs text-gray-400 mt-1">Go to Screening and mark papers as Included to populate this table.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#F8FAFC] z-10 border-b border-[#E4E7EF]">
              <tr>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#E4E7EF] w-8">#</th>
                {cols.map(c => (
                  <th key={c} className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#E4E7EF]">
                    {COL_LABELS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {papers.map((p, i) => (
                <tr key={p.id} className="border-b border-[#F0F2F8] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-300 font-medium">{i + 1}</td>
                  {cols.map(c => (
                    <td key={c} className="px-4 py-2.5 align-top max-w-[280px]">
                      {c === 'notes' ? (
                        <EditableCell value={p[c]} onSave={val => handleCellSave(p.id, c, val)} />
                      ) : (
                        <span className="text-xs text-gray-700">
                          {p[c] ?? <span className="text-gray-300 italic">—</span>}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
