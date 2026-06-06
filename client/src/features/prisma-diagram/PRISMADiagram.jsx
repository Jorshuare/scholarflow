import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const BOX_W = 220, BOX_H = 52, RX = 6;
const MAIN_X = 70, EX_X = 340;
const ROWS = [40, 142, 244, 346];
const SVG_W = 620, SVG_H = 430;

const PHASES = [
  { label: 'IDENTIFICATION', color: '#6366f1' },
  { label: 'SCREENING',      color: '#8b5cf6' },
  { label: 'ELIGIBILITY',    color: '#06b6d4' },
  { label: 'INCLUDED',       color: '#10b981' },
];

function Box({ x, y, label, count, color = '#6366f1' }) {
  return (
    <g>
      <rect x={x} y={y} width={BOX_W} height={BOX_H} rx={RX}
        fill="white" stroke={color} strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))' }}
      />
      <text x={x + BOX_W / 2} y={y + 18} textAnchor="middle"
        fontSize="11" fill="#6B7280" fontFamily="Inter,sans-serif">{label}</text>
      <text x={x + BOX_W / 2} y={y + 38} textAnchor="middle"
        fontSize="17" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">{count}</text>
    </g>
  );
}

function VArrow({ x, y1, y2 }) {
  return <line x1={x} y1={y1} x2={x} y2={y2 - 6} stroke="#D1D5DB" strokeWidth="1.5" markerEnd="url(#arr)" />;
}

function HArrow({ y, x1, x2 }) {
  return <line x1={x1} y1={y} x2={x2 - 6} y2={y} stroke="#D1D5DB" strokeWidth="1.5" markerEnd="url(#arr)" />;
}

export default function PRISMADiagram() {
  const { id: projectId } = useParams();
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${projectId}/export/prisma-counts`)
      .then(r => setCounts(r.data))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading…</p>;
  if (!counts)  return <p className="p-8 text-sm text-red-500">Failed to load diagram.</p>;

  const { identified, screened, excludedScreening, eligible, excludedFullText, included } = counts;
  const midMain = MAIN_X + BOX_W / 2;

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-800">PRISMA 2020 Diagram</h1>
          <p className="text-xs text-gray-400 mt-0.5">Live — updates as you screen papers</p>
        </div>
        <a
          href={`/api/projects/${projectId}/export/prisma.svg`}
          download="prisma.svg"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          Export SVG
        </a>
      </div>

      {/* Diagram */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div className="bg-white border border-[#E4E7EF] rounded-2xl shadow-sm p-6 inline-block">
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ maxWidth: '100%', height: 'auto' }}>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#D1D5DB" />
              </marker>
            </defs>
            <rect width={SVG_W} height={SVG_H} fill="white" />

            {PHASES.map((ph, i) => (
              <g key={ph.label}>
                <text
                  x="10" y={ROWS[i] + 30}
                  fontSize="8" fontWeight="700" fill={ph.color}
                  fontFamily="Inter,sans-serif"
                  transform={`rotate(-90,10,${ROWS[i] + 30})`}
                >
                  {ph.label}
                </text>
                <rect x="20" y={ROWS[i]} width="2" height="60" fill={ph.color} opacity="0.5" rx="1" />
              </g>
            ))}

            <Box x={MAIN_X} y={ROWS[0]} label="Records identified"  count={identified}        color="#6366f1" />
            <VArrow x={midMain} y1={ROWS[0] + BOX_H} y2={ROWS[1]} />

            <Box x={MAIN_X} y={ROWS[1]} label="Records screened"    count={screened}          color="#8b5cf6" />
            <HArrow y={ROWS[1] + BOX_H / 2} x1={MAIN_X + BOX_W} x2={EX_X} />
            <Box x={EX_X}   y={ROWS[1]} label="Records excluded"    count={excludedScreening} color="#ef4444" />
            <VArrow x={midMain} y1={ROWS[1] + BOX_H} y2={ROWS[2]} />

            <Box x={MAIN_X} y={ROWS[2]} label="Full-text assessed"  count={eligible}          color="#06b6d4" />
            <HArrow y={ROWS[2] + BOX_H / 2} x1={MAIN_X + BOX_W} x2={EX_X} />
            <Box x={EX_X}   y={ROWS[2]} label="Full-text excluded"  count={excludedFullText}  color="#ef4444" />
            <VArrow x={midMain} y1={ROWS[2] + BOX_H} y2={ROWS[3]} />

            <Box x={MAIN_X} y={ROWS[3]} label="Studies included"    count={included}          color="#10b981" />
          </svg>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-3 bg-white border-t border-[#E4E7EF] flex gap-6">
        {[
          { label: 'Identified', value: identified, color: 'text-indigo-600' },
          { label: 'Screened',   value: screened,   color: 'text-violet-600' },
          { label: 'Excluded',   value: excludedScreening, color: 'text-red-500' },
          { label: 'Eligible',   value: eligible,   color: 'text-cyan-600' },
          { label: 'Included',   value: included,   color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
