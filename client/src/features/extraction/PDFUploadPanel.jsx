import { useRef, useState } from 'react';
import { uploadPdf, patchExtraction } from '../../services/extraction.service';

const FIELDS = [
  { key: 'method',       label: 'Method'       },
  { key: 'dataset',      label: 'Dataset'       },
  { key: 'metric',       label: 'Metric'        },
  { key: 'performance',  label: 'Performance'   },
  { key: 'limitations',  label: 'Limitations'   },
  { key: 'futureWork',   label: 'Future Work'   },
  { key: 'contribution', label: 'Contribution'  },
];

function EditField({ label, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  function commit() {
    setEditing(false);
    if (draft !== (value || '')) onSave(draft);
  }

  return (
    <div className="border border-[#E4E7EF] rounded-lg p-2.5 bg-[#F8FAFC]">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      {editing ? (
        <textarea
          autoFocus
          rows={2}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
          className="w-full text-xs text-gray-800 bg-white border border-[#C8A951]/50 rounded-md px-2 py-1 outline-none resize-none focus:ring-2 focus:ring-[#C8A951]/20"
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-xs text-gray-700 cursor-text min-h-[1.5rem] hover:text-[#002868] transition-colors"
        >
          {value || <span className="text-gray-300 italic">Click to fill</span>}
        </div>
      )}
    </div>
  );
}

export default function PDFUploadPanel({ projectId, paper, onExtracted }) {
  const fileRef                     = useRef(null);
  const [uploading, setUploading]   = useState(false);
  const [msg, setMsg]               = useState(null);
  const [fields, setFields]         = useState(paper.extractionResult || {});
  const [dragging, setDragging]     = useState(false);

  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setMsg({ type: 'error', text: 'Please upload a PDF file.' });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const result = await uploadPdf(projectId, paper.id, file);
      if (result.scanned) {
        setMsg({ type: 'warning', text: result.message });
      } else if (result.extracted) {
        setFields(result.fields);
        setMsg({
          type: 'success',
          text: result.failed
            ? 'Extracted with some gaps — please review and fill any missing fields manually.'
            : 'Extracted successfully.',
        });
        onExtracted?.({ ...paper, pdfProcessed: true, extractionResult: result.fields });
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function saveField(key, value) {
    const updated = { ...fields, [key]: value };
    setFields(updated);
    try {
      await patchExtraction(projectId, paper.id, { [key]: value });
      onExtracted?.({ ...paper, extractionResult: updated });
    } catch { /* silent — UI already updated */ }
  }

  const hasExtraction = !!(fields.method || fields.contribution);

  return (
    <div className="h-full flex flex-col gap-4 p-5 overflow-y-auto">
      {/* Paper title */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-3">{paper.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {paper.authors}{paper.year ? ` · ${paper.year}` : ''}
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all select-none ${
          dragging
            ? 'border-[#C8A951] bg-[#002868]/5'
            : 'border-[#E4E7EF] hover:border-[#C8A951]/50 hover:bg-[#002868]/5/40 bg-[#F8FAFC]'
        } ${uploading ? 'opacity-60 cursor-wait pointer-events-none' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[#002868]/20 border-t-[#002868] rounded-full animate-spin" />
            <p className="text-xs text-[#002868] font-semibold">Extracting with AI…</p>
          </div>
        ) : (
          <>
            <div className="text-2xl mb-1.5">{hasExtraction ? '🔄' : '📄'}</div>
            <p className="text-xs font-semibold text-gray-700">{hasExtraction ? 'Re-upload PDF' : 'Upload PDF'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Drag & drop or click · PDF only · Max 20 MB</p>
          </>
        )}
      </div>

      {msg && (
        <div className={`text-xs px-3 py-2 rounded-lg font-medium border ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
          msg.type === 'warning' ? 'bg-amber-50  text-amber-700  border-amber-100'  :
                                   'bg-red-50    text-red-700    border-red-100'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Extracted fields */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          Extracted Fields <span className="normal-case font-normal">(click any field to edit)</span>
        </p>
        <div className="flex flex-col gap-2">
          {FIELDS.map(f => (
            <EditField
              key={f.key}
              label={f.label}
              value={fields[f.key]}
              onSave={val => saveField(f.key, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
