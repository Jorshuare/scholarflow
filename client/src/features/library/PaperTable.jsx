import { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { listPapers, deletePaper } from '../../services/papers.service';
import PaperSidePanel from './PaperSidePanel';
import ImportModal from './ImportModal';

const STATUS_STYLE = {
  INCLUDED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  EXCLUDED: 'bg-red-50    text-red-600    border border-red-200',
  PENDING:  'bg-amber-50  text-amber-700  border border-amber-200',
};

export default function PaperTable() {
  const { id: projectId } = useParams();
  const { project }       = useOutletContext();

  const [papers, setPapers]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);   // side-panel paper
  const [checkedIds, setCheckedIds] = useState(new Set()); // bulk-select
  const [showImport, setShowImport] = useState(false);
  const [keyword, setKeyword]       = useState('');
  const [statusFilter, setFilter]   = useState('');
  const [search, setSearch]         = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const fetchPapers = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)       params.keyword = search;
    if (statusFilter) params.status  = statusFilter;
    listPapers(projectId, params)
      .then(data => { setPapers(data); setCheckedIds(new Set()); })
      .finally(() => setLoading(false));
  }, [projectId, search, statusFilter]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  function handlePaperChanged(updated) {
    setPapers(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  }

  function handlePaperDeleted(paperId) {
    setPapers(prev => prev.filter(p => p.id !== paperId));
    setCheckedIds(prev => { const s = new Set(prev); s.delete(paperId); return s; });
    setSelected(null);
  }

  // ── Bulk-select helpers ──────────────────────────────────────────────────
  function toggleCheck(id, e) {
    e.stopPropagation(); // don't open side panel
    setCheckedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  const allChecked   = papers.length > 0 && papers.every(p => checkedIds.has(p.id));
  const someChecked  = checkedIds.size > 0 && !allChecked;

  function toggleAll(e) {
    e.stopPropagation();
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(papers.map(p => p.id)));
    }
  }

  // ── Bulk delete ──────────────────────────────────────────────────────────
  async function handleBulkDelete() {
    setDeleting(true);
    const ids = [...checkedIds];
    await Promise.allSettled(ids.map(id => deletePaper(projectId, id)));
    setPapers(prev => prev.filter(p => !checkedIds.has(p.id)));
    if (selected && checkedIds.has(selected.id)) setSelected(null);
    setCheckedIds(new Set());
    setConfirming(false);
    setDeleting(false);
  }

  const counts = {
    total:    papers.length,
    included: papers.filter(p => p.status === 'INCLUDED').length,
    excluded: papers.filter(p => p.status === 'EXCLUDED').length,
    pending:  papers.filter(p => p.status === 'PENDING').length,
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Header ── */}
        <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-gray-800">Paper Library</h1>
            <div className="flex gap-3 mt-1.5">
              <span className="text-xs text-gray-500">{counts.total} total</span>
              <span className="text-xs font-semibold text-emerald-600">{counts.included} included</span>
              <span className="text-xs font-semibold text-red-500">{counts.excluded} excluded</span>
              <span className="text-xs font-semibold text-amber-600">{counts.pending} pending</span>
            </div>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-[#002868] hover:bg-[#001f52] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Import papers
          </button>
        </div>

        {/* ── Bulk-action bar (visible when papers are checked) ── */}
        {checkedIds.size > 0 && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between">
            {confirming ? (
              <>
                <p className="text-xs font-semibold text-red-700">
                  Permanently delete {checkedIds.size} paper{checkedIds.size !== 1 ? 's' : ''}? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {deleting ? 'Deleting…' : `Yes, delete ${checkedIds.size}`}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1.5 bg-white border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-red-700">
                  {checkedIds.size} paper{checkedIds.size !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(true)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Delete selected
                  </button>
                  <button
                    onClick={() => setCheckedIds(new Set())}
                    className="px-3 py-1.5 bg-white border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Clear selection
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="px-6 py-3 bg-white border-b border-[#E4E7EF] flex gap-3">
          <input
            type="text"
            placeholder="Search title, authors, abstract…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(keyword)}
            className="flex-1 bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all"
          />
          <select
            value={statusFilter}
            onChange={e => setFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#C8A951] transition-all"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="INCLUDED">Included</option>
            <option value="EXCLUDED">Excluded</option>
          </select>
          <button
            onClick={() => setSearch(keyword)}
            className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-700 text-sm rounded-lg transition-colors"
          >
            Search
          </button>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto bg-white">
          {loading ? (
            <p className="text-sm text-gray-400 p-6">Loading…</p>
          ) : papers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">No papers found.</p>
              <button onClick={() => setShowImport(true)} className="mt-2 text-sm text-[#002868] hover:text-[#001f52] font-medium transition-colors">
                Import your first batch →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E4E7EF] z-10">
                <tr>
                  {/* Select-all checkbox */}
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded accent-[#002868] cursor-pointer"
                    />
                  </th>
                  {['Title', 'Authors', 'Year', 'Status', 'Tags'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {papers.map(paper => {
                  const isChecked = checkedIds.has(paper.id);
                  const isOpen    = selected?.id === paper.id;
                  return (
                    <tr
                      key={paper.id}
                      onClick={() => setSelected(isOpen ? null : paper)}
                      className={`border-b border-[#F0F2F8] cursor-pointer transition-colors ${
                        isChecked ? 'bg-red-50/60' : isOpen ? 'bg-[#002868]/5' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => toggleCheck(paper.id, e)}
                          className="w-3.5 h-3.5 rounded accent-[#002868] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-semibold text-gray-800 truncate">{paper.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                        <p className="truncate text-xs">{paper.authors || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{paper.year || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[paper.status]}`}>
                          {paper.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {paper.paperTags?.slice(0, 3).map(pt => (
                            <span
                              key={pt.tagId}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: pt.tag.colour + '18', color: pt.tag.colour }}
                            >
                              {pt.tag.name}
                            </span>
                          ))}
                          {(paper.paperTags?.length ?? 0) > 3 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] text-gray-400 bg-gray-100">
                              +{paper.paperTags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <PaperSidePanel
          paper={selected}
          projectId={projectId}
          onClose={() => setSelected(null)}
          onPaperChanged={handlePaperChanged}
          onDeleted={handlePaperDeleted}
        />
      )}

      {showImport && (
        <ImportModal
          projectId={projectId}
          onClose={() => setShowImport(false)}
          onImported={() => fetchPapers()}
        />
      )}
    </div>
  );
}
