import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listProjects, deleteProject } from '../../services/projects.service';
import NewProjectModal from './NewProjectModal';

// ── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ value, total }) {
  const r    = 24;
  const cx   = 30;
  const cy   = 30;
  const circ = 2 * Math.PI * r;
  const pct  = total > 0 ? value / total : 0;
  const off  = circ * (1 - pct);
  const disp = total > 0 ? Math.round(pct * 100) : 0;

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg width="60" height="60">
        <circle cx={cx} cy={cy} r={r} stroke="#E9EBF2" strokeWidth="4" fill="none" />
        <circle
          cx={cx} cy={cy} r={r}
          stroke="#C8A951" strokeWidth="4" fill="none"
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#002868">
          {disp}%
        </text>
      </svg>
      <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider">included</p>
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EF] px-5 py-4 shadow-sm flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: color + '18' }}
      >
        <Icon style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-2xl font-bold leading-none mt-1" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────
const ReviewsIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...props}>
    <rect x="1.5" y="3" width="13" height="11" rx="1.5" />
    <path d="M5 3V1.5h6V3" />
    <line x1="4.5" y1="7" x2="11.5" y2="7" />
    <line x1="4.5" y1="9.5" x2="9" y2="9.5" />
  </svg>
);

const PapersIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...props}>
    <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
    <line x1="5.5" y1="6" x2="10.5" y2="6" />
    <line x1="5.5" y1="9" x2="10.5" y2="9" />
  </svg>
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...props}>
    <circle cx="8" cy="8" r="6.5" />
    <path d="M5 8.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" {...props}>
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5v3.5l2.5 1.5" strokeLinecap="round" />
  </svg>
);

// ── Empty-state illustration ──────────────────────────────────────────────────
function EmptyIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      {/* Back paper */}
      <rect x="22" y="28" width="68" height="52" rx="4" fill="#E4E7EF" />
      {/* Mid paper */}
      <rect x="16" y="22" width="68" height="52" rx="4" fill="#F0F2F8" stroke="#E4E7EF" strokeWidth="1" />
      {/* Front paper */}
      <rect x="10" y="16" width="68" height="52" rx="4" fill="white" stroke="#E4E7EF" strokeWidth="1.5" />
      {/* Lines on front paper */}
      <line x1="20" y1="30" x2="68" y2="30" stroke="#C8A951" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="38" x2="62" y2="38" stroke="#E4E7EF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="44" x2="65" y2="44" stroke="#E4E7EF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="50" x2="58" y2="50" stroke="#E4E7EF" strokeWidth="1.5" strokeLinecap="round" />
      {/* Plus circle */}
      <circle cx="90" cy="72" r="18" fill="#002868" />
      <line x1="90" y1="64" x2="90" y2="80" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="82" y1="72" x2="98" y2="72" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectList() {
  const { currentUser, logout } = useAuth();
  const navigate                = useNavigate();
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (confirmId !== id) { setConfirmId(id); return; }
    setDeleting(true);
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } finally {
      setConfirmId(null);
      setDeleting(false);
    }
  }

  useEffect(() => {
    listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  function handleCreated(project) {
    // New project has no papers yet — inject empty _stats
    setProjects(prev => [
      { ...project, _stats: { total: 0, included: 0, excluded: 0, pending: 0, extracted: 0 } },
      ...prev,
    ]);
  }

  const hour        = new Date().getHours();
  const timeGreet   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const rawName     = currentUser?.email?.split('@')[0] ?? 'researcher';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const totalPapers   = projects.reduce((a, p) => a + (p._stats?.total    ?? 0), 0);
  const totalIncluded = projects.reduce((a, p) => a + (p._stats?.included ?? 0), 0);
  const totalPending  = projects.reduce((a, p) => a + (p._stats?.pending  ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F0F2F8]">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-[#E4E7EF] px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <span className="text-sm font-bold bg-gradient-to-r from-[#002868] to-[#C8A951] bg-clip-text text-transparent tracking-wide">
          ScholarFlow
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">{currentUser?.email}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#002868] via-[#003580] to-[#001f52]">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#C8A951]/10 pointer-events-none" />
        <div className="absolute bottom-0 left-[40%] w-48 h-48 rounded-full bg-white/[0.03] translate-y-1/2 pointer-events-none" />
        <div className="absolute top-6 left-[60%] w-20 h-20 rounded-full bg-[#C8A951]/5 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-8 pt-10 pb-16">
          <p className="text-[#C8A951] text-xs font-semibold uppercase tracking-widest mb-2">{timeGreet}</p>
          <h1 className="text-3xl font-bold text-white leading-tight">{displayName}</h1>
          <p className="text-blue-200 text-sm mt-2 max-w-sm">
            AI-powered systematic literature reviews — import, screen, analyse, export.
          </p>
          {projects.length > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <span className="text-[#C8A951]/90 text-xs font-semibold">
                {projects.length} review{projects.length !== 1 ? 's' : ''}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[#C8A951]/90 text-xs font-semibold">{totalPapers} papers imported</span>
              {totalIncluded > 0 && <>
                <span className="text-white/20">·</span>
                <span className="text-emerald-300 text-xs font-semibold">{totalIncluded} included</span>
              </>}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI cards (float up over hero) ── */}
      <div className="max-w-4xl mx-auto px-6 -mt-5 mb-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Reviews"   value={projects.length} color="#002868" Icon={ReviewsIcon} />
          <KpiCard label="Papers"    value={totalPapers}     color="#0055B3" Icon={PapersIcon}  />
          <KpiCard label="Included"  value={totalIncluded}   color="#059669" Icon={CheckIcon}   />
          <KpiCard label="Pending"   value={totalPending}    color="#D97706" Icon={ClockIcon}   />
        </div>
      </div>

      {/* ── Project list section ── */}
      <main className="max-w-4xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700">
            Your Reviews
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#002868] hover:bg-[#001f52] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <line x1="6" y1="1" x2="6" y2="11" strokeLinecap="round" />
              <line x1="1" y1="6" x2="11" y2="6" strokeLinecap="round" />
            </svg>
            New review
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#E4E7EF] h-36 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-white border border-dashed border-[#D0D3E0] rounded-2xl p-14 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <EmptyIllustration />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">Start your first systematic review</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
              Import BibTeX or CSV, screen papers with AI, and export PRISMA-compliant results.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-[#002868] hover:bg-[#001f52] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Create your first review
            </button>
          </div>
        ) : (
          /* ── Cards grid ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const s     = p._stats ?? { total: 0, included: 0, excluded: 0, pending: 0 };
              const dated = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const screenedPct = s.total > 0
                ? Math.round((s.included + s.excluded) / s.total * 100)
                : 0;

              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}/home`)}
                  className="group w-full text-left bg-white rounded-2xl border border-[#E4E7EF] overflow-hidden hover:shadow-lg hover:border-[#C8A951]/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Top accent gradient line */}
                  <div className="h-0.5 bg-gradient-to-r from-[#002868] via-[#0055B3] to-[#C8A951]" />

                  <div className="p-5 flex items-start gap-4">
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 group-hover:text-[#002868] transition-colors truncate leading-snug">
                        {p.name}
                      </h3>
                      {p.description ? (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-1 italic">No description</p>
                      )}

                      {/* Stats chips */}
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#F0F2F8] text-[#002868] rounded-full">
                          {s.total} papers
                        </span>
                        {s.included > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                            {s.included} included
                          </span>
                        )}
                        {s.excluded > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
                            {s.excluded} excluded
                          </span>
                        )}
                        {s.pending > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                            {s.pending} pending
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[10px] text-gray-300">Created {dated}</p>
                        <div className="flex items-center gap-1.5">
                          {/* Mini screening bar */}
                          {s.total > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-[#F0F2F8] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#002868] rounded-full transition-all duration-700"
                                  style={{ width: `${screenedPct}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-gray-400">{screenedPct}% screened</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress ring + delete */}
                    <div className="flex flex-col items-center gap-2">
                      <ProgressRing value={s.included} total={s.total} />
                      <button
                        onClick={(e) => handleDelete(e, p.id)}
                        disabled={deleting && confirmId === p.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors ${
                          confirmId === p.id
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {confirmId === p.id ? (deleting ? 'Deleting…' : 'Confirm?') : 'Delete'}
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
