import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listCriteria, createCriterion, deleteCriterion } from '../../services/criteria.service';
import { getStatus, runScreening } from '../../services/autoScreening.service';

function CriterionBadge({ criterion, onDelete, locked }) {
  const isIC = criterion.type === 'INCLUSION';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${
      isIC ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
    }`}>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
        isIC ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
      }`}>
        {criterion.code}
      </span>
      <p className="text-sm text-gray-700 flex-1">{criterion.description}</p>
      {!locked && (
        <button
          onClick={() => onDelete(criterion.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function CriteriaManager() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [locked, setLocked]     = useState(false);
  const [type, setType]         = useState('INCLUSION');
  const [description, setDesc]  = useState('');
  const [saving, setSaving]     = useState(false);
  const [running, setRunning]   = useState(false);

  useEffect(() => {
    Promise.all([
      listCriteria(projectId),
      getStatus(projectId),
    ]).then(([c, s]) => {
      setCriteria(c);
      setLocked(s.status === 'RUNNING' || s.status === 'COMPLETE');
    }).finally(() => setLoading(false));
  }, [projectId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    try {
      const c = await createCriterion(projectId, { type, description: description.trim() });
      setCriteria(prev => [...prev, c]);
      setDesc('');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cid) {
    await deleteCriterion(projectId, cid);
    setCriteria(prev => prev.filter(c => c.id !== cid));
  }

  async function handleRun() {
    setRunning(true);
    try {
      await runScreening(projectId);
      navigate(`/projects/${projectId}/screening/progress`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start screening');
      setRunning(false);
    }
  }

  const inclusion = criteria.filter(c => c.type === 'INCLUSION');
  const exclusion = criteria.filter(c => c.type === 'EXCLUSION');

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-800">Criteria Manager</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Define inclusion and exclusion criteria before running auto-screening
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running || locked || criteria.length === 0}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          {running ? 'Starting…' : locked ? 'Screening run' : `Run Auto-Screening (${criteria.length} criteria)`}
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl grid grid-cols-2 gap-6">
          {/* Inclusion */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Inclusion Criteria
                <span className="ml-2 font-normal text-gray-400">({inclusion.length})</span>
              </p>
            </div>
            <div className="space-y-2">
              {inclusion.length === 0
                ? <p className="text-xs text-gray-400 italic">No inclusion criteria yet</p>
                : inclusion.map(c => <CriterionBadge key={c.id} criterion={c} onDelete={handleDelete} locked={locked} />)
              }
            </div>
          </div>

          {/* Exclusion */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Exclusion Criteria
                <span className="ml-2 font-normal text-gray-400">({exclusion.length})</span>
              </p>
            </div>
            <div className="space-y-2">
              {exclusion.length === 0
                ? <p className="text-xs text-gray-400 italic">No exclusion criteria yet</p>
                : exclusion.map(c => <CriterionBadge key={c.id} criterion={c} onDelete={handleDelete} locked={locked} />)
              }
            </div>
          </div>
        </div>

        {/* Add form */}
        {locked ? (
          <div className="max-w-3xl mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-700">
              Criteria are locked — screening has already been run for this project.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="max-w-3xl mt-6 bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-5">
            <p className="text-xs font-bold text-gray-700 mb-4">Add a criterion</p>
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => setType('INCLUSION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  type === 'INCLUSION'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#F8FAFC] border border-[#E4E7EF] text-gray-500 hover:bg-emerald-50'
                }`}
              >
                Inclusion
              </button>
              <button
                type="button"
                onClick={() => setType('EXCLUSION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  type === 'EXCLUSION'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#F8FAFC] border border-[#E4E7EF] text-gray-500 hover:bg-red-50'
                }`}
              >
                Exclusion
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder={type === 'INCLUSION'
                  ? 'e.g. Study must involve machine learning methods'
                  : 'e.g. Survey or review papers (not primary research)'}
                className="flex-1 bg-[#F8FAFC] border border-[#E4E7EF] focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!description.trim() || saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
