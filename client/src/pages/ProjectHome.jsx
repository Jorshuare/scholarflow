import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { listPapers } from '../services/papers.service';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg, Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EF] px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
          <p className="text-3xl font-bold mt-1 leading-none" style={{ color }}>{value}</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <Icon style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, value, total, color, suffix }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-[#F0F2F8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{value} of {total} {suffix}</p>
    </div>
  );
}

// ── PRISMA funnel ─────────────────────────────────────────────────────────────
function FunnelBox({ label, count, color }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 min-w-[74px] text-center"
      style={{ borderColor: color + '30', backgroundColor: color + '08' }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-xl font-bold leading-none mt-1" style={{ color }}>{count}</p>
    </div>
  );
}

function FunnelArrow() {
  return (
    <div className="flex items-center px-1 shrink-0">
      <svg width="28" height="14" viewBox="0 0 28 14">
        <line x1="0" y1="7" x2="20" y2="7" stroke="#D1D5DB" strokeWidth="1.5" />
        <path d="M16 3 L24 7 L16 11" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  INCLUDED: 'bg-emerald-50 text-emerald-700',
  EXCLUDED: 'bg-red-50 text-red-600',
  PENDING:  'bg-amber-50 text-amber-700',
};

// ── Quick-action icon components ──────────────────────────────────────────────
const QA_ICONS = {
  library:          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="1.5" width="10" height="13" rx="1.5"/><line x1="5.5" y1="6" x2="10.5" y2="6"/><line x1="5.5" y1="9" x2="10.5" y2="9"/></svg>,
  screening:        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="7" cy="7" r="4"/><line x1="10.2" y1="10.2" x2="13.5" y2="13.5"/></svg>,
  criteria:         <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M8 1.5l1.5 3.5 3.5 1-2.5 2.5.7 3.8L8 10.5l-3.2 1.8.7-3.8L3 6l3.5-1z"/></svg>,
  prisma:           <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="1.5" y="9" width="3" height="5.5" rx="0.5"/><rect x="6.5" y="5" width="3" height="9.5" rx="0.5"/><rect x="11.5" y="1.5" width="3" height="13" rx="0.5"/></svg>,
  ai:               <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M2 3h12v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z"/><path d="M5 13l1-2h4l1 2" strokeLinecap="round"/></svg>,
  'evidence-matrix':<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/><line x1="1.5" y1="6" x2="14.5" y2="6"/><line x1="1.5" y1="10.5" x2="14.5" y2="10.5"/><line x1="6" y1="1.5" x2="6" y2="14.5"/></svg>,
};

const QUICK_ACTIONS = [
  { to: 'library',          label: 'Papers',          desc: 'Browse & import',  color: '#002868', bg: '#002868' },
  { to: 'screening',        label: 'Manual Screen',   desc: 'Review one-by-one', color: '#0055B3', bg: '#0055B3' },
  { to: 'criteria',         label: 'AI Criteria',     desc: 'Set IC / EC rules', color: '#B8962E', bg: '#C8A951' },
  { to: 'prisma',           label: 'PRISMA',          desc: 'Flow diagram',      color: '#003580', bg: '#003580' },
  { to: 'ai',               label: 'AI Assistant',    desc: 'Ask questions',     color: '#059669', bg: '#059669' },
  { to: 'evidence-matrix',  label: 'Evidence Matrix', desc: 'Data extraction',   color: '#7C3AED', bg: '#7C3AED' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProjectHome() {
  const { id: projectId } = useParams();
  const { project }       = useOutletContext();
  const navigate          = useNavigate();
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const s        = project._stats ?? { total: 0, included: 0, excluded: 0, pending: 0, extracted: 0 };
  const screened = s.included + s.excluded;

  useEffect(() => {
    listPapers(projectId)
      .then(papers => setRecent(papers.slice(0, 5)))
      .finally(() => setLoadingRecent(false));
  }, [projectId]);

  return (
    <div className="flex flex-col min-h-full bg-[#F0F2F8]">

      {/* ── Project header ── */}
      <div className="bg-white border-b border-[#E4E7EF] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#C8A951]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Overview</p>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1.5 max-w-xl">{project.description}</p>
            )}
            <p className="text-xs text-gray-300 mt-2">
              Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => navigate('library')}
            className="shrink-0 px-4 py-2 bg-[#002868] hover:bg-[#001f52] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 mt-1"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <rect x="1" y="1" width="10" height="10" rx="1.5" />
              <line x1="1" y1="5" x2="11" y2="5" />
              <line x1="5" y1="1" x2="5" y2="11" />
            </svg>
            Open Library
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Stat cards row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Papers" value={s.total}
            color="#002868" bg="#00286815"
            Icon={p => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...p}><rect x="3" y="1.5" width="10" height="13" rx="1.5"/><line x1="5.5" y1="6" x2="10.5" y2="6"/><line x1="5.5" y1="9" x2="10.5" y2="9"/></svg>}
          />
          <StatCard
            label="Included" value={s.included}
            color="#059669" bg="#05966915"
            Icon={p => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...p}><circle cx="8" cy="8" r="6.5"/><path d="M5 8.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
          <StatCard
            label="Excluded" value={s.excluded}
            color="#DC2626" bg="#DC262615"
            Icon={p => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...p}><circle cx="8" cy="8" r="6.5"/><line x1="5.5" y1="5.5" x2="10.5" y2="10.5" strokeLinecap="round"/><line x1="10.5" y1="5.5" x2="5.5" y2="10.5" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="Pending" value={s.pending}
            color="#D97706" bg="#D9770615"
            Icon={p => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...p}><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5l2.5 1.5" strokeLinecap="round"/></svg>}
          />
        </div>

        {/* ── Two-column body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Left: progress + funnel (3/5) ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E4E7EF] p-5 shadow-sm space-y-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Research Progress</h2>

            <ProgressBar
              label="Screening progress"
              value={screened} total={s.total}
              color="#002868"
              suffix="papers screened"
            />
            <ProgressBar
              label="Extraction progress"
              value={s.extracted} total={Math.max(s.included, 1)}
              color="#C8A951"
              suffix="included papers extracted"
            />

            {/* PRISMA mini-funnel */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">PRISMA Flow</p>
              <div className="flex items-center overflow-x-auto pb-1">
                <FunnelBox label="Identified" count={s.total}    color="#002868" />
                <FunnelArrow />
                <FunnelBox label="Screened"   count={screened}   color="#0055B3" />
                <FunnelArrow />
                <FunnelBox label="Included"   count={s.included} color="#059669" />
                {s.extracted > 0 && <>
                  <FunnelArrow />
                  <FunnelBox label="Extracted" count={s.extracted} color="#C8A951" />
                </>}
              </div>
            </div>
          </div>

          {/* ── Right: quick actions + recent (2/5) ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-[#E4E7EF] p-5 shadow-sm">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.to}
                    onClick={() => navigate(a.to)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-[#E4E7EF] hover:border-[#C8A951]/40 hover:bg-[#FAFBFF] transition-all group"
                  >
                    <span
                      className="transition-colors"
                      style={{ color: a.color + 'B0' }}
                    >
                      {QA_ICONS[a.to]}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500 group-hover:text-[#002868] text-center leading-tight">
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent papers */}
            <div className="bg-white rounded-2xl border border-[#E4E7EF] p-5 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent Papers</h2>
                <button
                  onClick={() => navigate('library')}
                  className="text-[10px] font-semibold text-[#002868] hover:text-[#C8A951] transition-colors"
                >
                  View all →
                </button>
              </div>

              {loadingRecent ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-400">No papers yet.</p>
                  <button
                    onClick={() => navigate('library')}
                    className="mt-2 text-xs text-[#002868] hover:text-[#C8A951] font-semibold transition-colors"
                  >
                    Import papers →
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recent.map(paper => (
                    <div key={paper.id} className="flex items-center gap-2 py-1.5 border-b border-[#F0F2F8] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{paper.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {paper.authors?.split(',')[0]}{paper.year ? ` · ${paper.year}` : ''}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${STATUS_STYLE[paper.status]}`}>
                        {paper.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
