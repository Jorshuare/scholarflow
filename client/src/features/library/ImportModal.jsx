import { useState, useRef } from 'react';
import { importBibtex, importCsv } from '../../services/papers.service';

export default function ImportModal({ projectId, onClose, onImported }) {
  const [tab, setTab]         = useState('bibtex');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [file, setFile]       = useState(null);
  const inputRef              = useRef();

  async function handleImport() {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const result = tab === 'bibtex'
        ? await importBibtex(projectId, file)
        : await importCsv(projectId, file);
      onImported(result.imported);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Import failed (${err.response?.status})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Import papers</h2>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg p-1">
            {['bibtex', 'csv'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setFile(null); setError(''); }}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                  tab === t
                    ? 'bg-white text-gray-800 shadow-sm border border-[#E4E7EF]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'bibtex' ? 'BibTeX (.bib)' : 'CSV (.csv)'}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-[#E4E7EF] hover:border-indigo-300 hover:bg-[#F8FAFC]'
            }`}
          >
            {file ? (
              <div>
                <p className="text-sm font-semibold text-indigo-600">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">Click to change</p>
              </div>
            ) : (
              <>
                <p className="text-2xl mb-2">📂</p>
                <p className="text-sm text-gray-500">Click to select a file</p>
                <p className="text-xs text-gray-400 mt-1">{tab === 'bibtex' ? '.bib' : '.csv'} · max 10 MB</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={tab === 'bibtex' ? '.bib,.txt' : '.csv'}
            className="hidden"
            onChange={e => setFile(e.target.files[0] || null)}
          />

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
