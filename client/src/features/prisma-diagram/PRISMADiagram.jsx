import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { downloadExport } from '../../services/export.service';

const W = 800, H = 680, FONT = 'Inter,Arial,sans-serif';
const LX = 90, LW = 248;
const RX = 462, RW = 240;
const R1 = 60, R2 = 210, R3 = 330, R4 = 450, R5 = 570;
const BH = 75;
const BH_MULTI = 95;
const BLUE = '#002868', GOLD = '#C8A951', GRAY = '#9CA3AF';
const RED  = '#EF4444', DARK = '#374151', MUTED = '#6B7280';

function Box({ x, y, w = LW, h = BH, stroke = BLUE, children }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="white" stroke={stroke} strokeWidth={1.5} />
      {children}
    </g>
  );
}

function VArrow({ x, y1, y2 }) {
  return <line x1={x} y1={y1} x2={x} y2={y2 - 8} stroke={DARK} strokeWidth={1.5} markerEnd="url(#arr)" />;
}

function HArrow({ y, x1, x2 }) {
  return <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={DARK} strokeWidth={1.5} markerEnd="url(#arr)" />;
}

export default function PRISMADiagram() {
  const { id: projectId } = useParams();
  const [c, setC]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExp]   = useState(false);

  useEffect(() => {
    api.get(`/projects/${projectId}/export/prisma-counts`)
      .then(r => setC(r.data))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleExport() {
    setExp(true);
    try { await downloadExport(projectId, 'prismaSvg'); }
    finally { setExp(false); }
  }

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;
  if (!c)      return <p className="p-8 text-sm text-red-500">Failed to load diagram.</p>;

  const midL = LX + LW / 2;
  const r4RightH = c.exclusionReasons?.length > 0
    ? Math.min(100, 28 + c.exclusionReasons.length * 17)
    : BH;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Page header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-800">PRISMA 2020 Diagram</h1>
          <p className="text-xs text-gray-400 mt-0.5">Live — updates as you screen papers</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-3 py-1.5 bg-[#002868] hover:bg-[#001f52] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          {exporting ? 'Exporting…' : 'Export SVG'}
        </button>
      </div>

      {/* Diagram */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-4 inline-block">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto' }}
            fontFamily={FONT}>
            <defs>
              <marker id="arr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill={DARK} />
              </marker>
            </defs>
            <rect width={W} height={H} fill="white" />

            {/* Gold header */}
            <rect x={0} y={0} width={W} height={48} fill={GOLD} />
            <text x={W / 2} y={30} textAnchor="middle" fontSize={13} fontWeight="700" fill={BLUE} fontFamily={FONT}>
              Identification of studies via databases and registers
            </text>

            {/* Section label bars */}
            {[
              [48, 200, 'IDENTIFICATION'],
              [200, 560, 'SCREENING'],
              [560, H, 'INCLUDED'],
            ].map(([y1, y2, label]) => (
              <g key={label}>
                <rect x={0} y={y1} width={28} height={y2 - y1} fill={BLUE} />
                <text x={14} y={(y1 + y2) / 2} textAnchor="middle" fontSize={9} fontWeight="700"
                  fill="white" fontFamily={FONT}
                  transform={`rotate(-90,14,${(y1 + y2) / 2})`}>
                  {label}
                </text>
              </g>
            ))}

            {/* ROW 1 — Identification */}
            <Box x={LX} y={R1}>
              <text x={midL} y={R1 + 22} textAnchor="middle" fontSize={11} fill={DARK}>Records identified from</text>
              <text x={midL} y={R1 + 38} textAnchor="middle" fontSize={11} fill={DARK}>databases and registers</text>
              <text x={midL} y={R1 + 62} textAnchor="middle" fontSize={18} fontWeight="700" fill={BLUE}>(n = {c.identified})</text>
            </Box>
            <HArrow y={R1 + BH / 2} x1={LX + LW} x2={RX} />
            <Box x={RX} y={R1} w={RW} stroke={GRAY}>
              <text x={RX + RW / 2} y={R1 + 16} textAnchor="middle" fontSize={10} fill={DARK}>Records removed before screening:</text>
              <text x={RX + RW / 2} y={R1 + 32} textAnchor="middle" fontSize={10} fill={MUTED}>Duplicate records removed (n = {c.duplicatesRemoved})</text>
              <text x={RX + RW / 2} y={R1 + 47} textAnchor="middle" fontSize={10} fill={MUTED}>Marked ineligible by automation (n = {c.automationRemoved})</text>
              <text x={RX + RW / 2} y={R1 + 62} textAnchor="middle" fontSize={10} fill={MUTED}>Removed for other reasons (n = 0)</text>
            </Box>

            <VArrow x={midL} y1={R1 + BH} y2={R2} />

            {/* ROW 2 — Screened */}
            <Box x={LX} y={R2}>
              <text x={midL} y={R2 + 28} textAnchor="middle" fontSize={11} fill={DARK}>Records screened</text>
              <text x={midL} y={R2 + 54} textAnchor="middle" fontSize={18} fontWeight="700" fill={BLUE}>(n = {c.screened})</text>
            </Box>
            <HArrow y={R2 + BH / 2} x1={LX + LW} x2={RX} />
            <Box x={RX} y={R2} w={RW} stroke={GRAY}>
              <text x={RX + RW / 2} y={R2 + 26} textAnchor="middle" fontSize={11} fill={DARK}>Records excluded</text>
              <text x={RX + RW / 2} y={R2 + 50} textAnchor="middle" fontSize={17} fontWeight="700" fill={RED}>(n = {c.excludedScreening})</text>
            </Box>

            <VArrow x={midL} y1={R2 + BH} y2={R3} />

            {/* ROW 3 — Retrieval */}
            <Box x={LX} y={R3}>
              <text x={midL} y={R3 + 28} textAnchor="middle" fontSize={11} fill={DARK}>Reports sought for retrieval</text>
              <text x={midL} y={R3 + 54} textAnchor="middle" fontSize={18} fontWeight="700" fill={BLUE}>(n = {c.soughtRetrieval})</text>
            </Box>
            <HArrow y={R3 + BH / 2} x1={LX + LW} x2={RX} />
            <Box x={RX} y={R3} w={RW} stroke={GRAY}>
              <text x={RX + RW / 2} y={R3 + 26} textAnchor="middle" fontSize={11} fill={DARK}>Reports not retrieved</text>
              <text x={RX + RW / 2} y={R3 + 50} textAnchor="middle" fontSize={17} fontWeight="700" fill={RED}>(n = {c.notRetrieved})</text>
            </Box>

            <VArrow x={midL} y1={R3 + BH} y2={R4} />

            {/* ROW 4 — Eligibility */}
            <Box x={LX} y={R4}>
              <text x={midL} y={R4 + 28} textAnchor="middle" fontSize={11} fill={DARK}>Reports assessed for eligibility</text>
              <text x={midL} y={R4 + 54} textAnchor="middle" fontSize={18} fontWeight="700" fill={BLUE}>(n = {c.assessedEligibility})</text>
            </Box>
            <HArrow y={R4 + BH / 2} x1={LX + LW} x2={RX} />
            <Box x={RX} y={R4} w={RW} h={r4RightH} stroke={GRAY}>
              <text x={RX + RW / 2} y={R4 + 16} textAnchor="middle" fontSize={11} fill={DARK}>
                {c.exclusionReasons?.length > 0 ? 'Records excluded:' : 'Reports excluded'}
              </text>
              {c.exclusionReasons?.length > 0
                ? c.exclusionReasons.map((r, i) => (
                    <text key={i} x={RX + RW / 2} y={R4 + 34 + i * 17}
                      textAnchor="middle" fontSize={10} fill={MUTED}>
                      {r.reason.length > 22 ? r.reason.slice(0, 21) + '…' : r.reason} (n = {r.count})
                    </text>
                  ))
                : <text x={RX + RW / 2} y={R4 + 50} textAnchor="middle" fontSize={17} fontWeight="700" fill={RED}>(n = 0)</text>
              }
            </Box>

            <VArrow x={midL} y1={R4 + BH} y2={R5} />

            {/* ROW 5 — Included */}
            <Box x={LX} y={R5}>
              <text x={midL} y={R5 + 24} textAnchor="middle" fontSize={11} fill={DARK}>Studies included in review</text>
              <text x={midL} y={R5 + 40} textAnchor="middle" fontSize={10} fill={MUTED}>and reports of included studies</text>
              <text x={midL} y={R5 + 64} textAnchor="middle" fontSize={18} fontWeight="700" fill={BLUE}>(n = {c.included})</text>
            </Box>
          </svg>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-3 bg-white border-t border-[#E4E7EF] flex gap-6 flex-wrap">
        {[
          { label: 'Identified',  value: c.identified,         color: 'text-[#002868]' },
          { label: 'Screened',    value: c.screened,           color: 'text-[#002868]' },
          { label: 'Excluded',    value: c.excludedScreening,  color: 'text-red-500'   },
          { label: 'Retrieved',   value: c.soughtRetrieval,    color: 'text-[#002868]' },
          { label: 'Assessed',    value: c.assessedEligibility,color: 'text-amber-600' },
          { label: 'Included',    value: c.included,           color: 'text-emerald-600'},
        ].map(s => (
          <div key={s.label}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
