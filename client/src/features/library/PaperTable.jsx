import { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { listPapers } from '../../services/papers.service';
import PaperSidePanel from './PaperSidePanel';
import ImportModal from './ImportModal';

const STATUS_STYLE = {
  INCLUDED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  EXCLUDED: 'bg-red-50    text-red-600    border border-red-200',
  PENDING:  'bg-amber-50  text-amber-700  border border-amber-200',
};

export default function PaperTable() {
  const { id: projectId } = useParams();
  const { project } = useOutletContext();

  const [papers, setPapers]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [keyword, setKeyword]       = useState('');
  const [statusFilter, setFilter]   = useState('');
  const [search, setSearch]         = useState('');

  const fetchPapers = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)       params.keyword = search;
    if (statusFilter) params.status  = statusFilter;
    listPapers(projectId, params).then(setPapers).finally(() => setLoading(false));
  }, [projectId, search, statusFilter]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  function handlePaperChanged(updated) {
    setPapers(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
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
        {/* Header */}
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            Import papers
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-white border-b border-[#E4E7EF] flex gap-3">
          <input
            type="text"
            placeholder="Search title, authors, abstract…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(keyword)}
            className="flex-1 bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <select
            value={statusFilter}
            onChange={e => setFilter(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 transition-all"
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

        {/* Table */}
        <div className="flex-1 overflow-auto bg-white">
          {loading ? (
            <p className="text-sm text-gray-400 p-6">Loading…</p>
          ) : papers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">No papers found.</p>
              <button onClick={() => setShowImport(true)} className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
                Import your first batch →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E4E7EF]">
                <tr>
                  {['Title', 'Authors', 'Year', 'Status', 'Tags'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {papers.map((paper, i) => (
                  <tr
                    key={paper.id}
                    onClick={() => setSelected(selected?.id === paper.id ? null : paper)}
                    className={`border-b border-[#F0F2F8] cursor-pointer transition-colors ${
                      selected?.id === paper.id
                        ? 'bg-indigo-50/80'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <td className="px-4 py-3 pl-6 max-w-xs">
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
                ))}
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
