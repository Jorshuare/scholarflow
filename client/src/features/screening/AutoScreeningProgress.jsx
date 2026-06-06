import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStatus } from '../../services/autoScreening.service';

export default function AutoScreeningProgress() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState({ status: 'RUNNING', processed: 0, total: 0, included: 0, excluded: 0, uncertain: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    async function poll() {
      const data = await getStatus(projectId);
      setJob(data);
      if (data.status === 'COMPLETE' || data.status === 'FAILED') {
        clearInterval(intervalRef.current);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [projectId]);

  const pct = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF]">
        <h1 className="text-sm font-bold text-gray-800">Auto-Screening</h1>
        <p className="text-xs text-gray-400 mt-0.5">Groq is evaluating your papers against your criteria</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-8 w-full max-w-lg">

          {/* Status header */}
          <div className="text-center mb-8">
            {job.status === 'COMPLETE' ? (
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
            ) : job.status === 'FAILED' ? (
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-3 text-2xl">✗</div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3">
                <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <p className="text-base font-bold text-gray-800">
              {job.status === 'COMPLETE' ? 'Screening complete' :
               job.status === 'FAILED'   ? 'Screening failed' :
               `Processing paper ${job.processed} of ${job.total}…`}
            </p>
            {job.status === 'RUNNING' && (
              <p className="text-xs text-gray-400 mt-1">~2 seconds per paper · do not close this tab</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{pct}% complete</span>
              <span>{job.processed} / {job.total}</span>
            </div>
            <div className="h-2.5 bg-[#F0F2F8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Live counters */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Auto-Included', count: job.included,  color: 'text-emerald-600', bg: 'bg-emerald-50  border-emerald-200', icon: '✓' },
              { label: 'Needs Review',  count: job.uncertain, color: 'text-amber-600',   bg: 'bg-amber-50   border-amber-200',   icon: '⚠' },
              { label: 'Auto-Excluded', count: job.excluded,  color: 'text-red-500',     bg: 'bg-red-50     border-red-200',     icon: '✗' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          {job.status === 'COMPLETE' && (
            <button
              onClick={() => navigate(`/projects/${projectId}/screening/results`)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              View Results →
            </button>
          )}
          {job.status === 'FAILED' && (
            <button
              onClick={() => navigate(`/projects/${projectId}/criteria`)}
              className="w-full py-2.5 bg-[#F8FAFC] border border-[#E4E7EF] hover:bg-[#F0F2F8] text-gray-600 text-sm font-semibold rounded-xl transition-colors"
            >
              ← Back to Criteria
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
