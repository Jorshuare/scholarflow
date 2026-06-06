const W = 800, H = 680;
const FONT = 'Inter,Arial,sans-serif';

// Column geometry
const LX = 90,  LW = 248;   // main (left) column
const RX = 462, RW = 240;   // exclusion (right) column
const MID_L = LX + LW / 2;
const MID_R = RX + RW / 2;

// Row top-of-box y positions
const R1 = 60, R2 = 210, R3 = 330, R4 = 450, R5 = 570;
const BOX_H_MAIN = 100; // rows 1 right + row 4 right need more height
const BH = 75;          // standard box height
const BH_MULTI = 95;    // taller box for multi-line exclusion reasons

// Section vertical spans [yStart, yEnd, label]
const SECTIONS = [
  [48,  200, 'Identification'],
  [200, 560, 'Screening'],
  [560, H,   'Included'],
];
const SECT_COLOR = '#002868';

function rect(x, y, w, h, opts = {}) {
  const { fill = 'white', stroke = '#002868', sw = 1.5, rx = 6 } = opts;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function txt(x, y, content, opts = {}) {
  const { size = 11, weight = 'normal', fill = '#111827', anchor = 'middle' } = opts;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="${FONT}">${esc(content)}</text>`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function vArrow(x, y1, y2) {
  const tip = y2 - 8;
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${tip}" stroke="#374151" stroke-width="1.5" marker-end="url(#arr)"/>`;
}

function hArrow(y, x1, x2) {
  const tip = x2 - 8;
  return `<line x1="${x1}" y1="${y}" x2="${tip}" y2="${y}" stroke="#374151" stroke-width="1.5" marker-end="url(#arr)"/>`;
}

// Standard 2-line box: label + bold count
function mainBox(x, y, label, count) {
  const mid = x + LW / 2;
  return [
    rect(x, y, LW, BH),
    txt(mid, y + 28, label, { size: 11, fill: '#374151' }),
    txt(mid, y + 54, `(n = ${count})`, { size: 18, weight: '700', fill: '#002868' }),
  ].join('');
}

// Identification box: title + sub-count line
function identBox(x, y, count) {
  const mid = x + LW / 2;
  return [
    rect(x, y, LW, BH),
    txt(mid, y + 22, 'Records identified from', { size: 11, fill: '#374151' }),
    txt(mid, y + 38, 'databases and registers', { size: 11, fill: '#374151' }),
    txt(mid, y + 62, `(n = ${count})`, { size: 18, weight: '700', fill: '#002868' }),
  ].join('');
}

// Included box: two lines of text
function includedBox(x, y, count) {
  const mid = x + LW / 2;
  return [
    rect(x, y, LW, BH),
    txt(mid, y + 24, 'Studies included in review', { size: 11, fill: '#374151' }),
    txt(mid, y + 40, 'and reports of included studies', { size: 10, fill: '#6B7280' }),
    txt(mid, y + 64, `(n = ${count})`, { size: 18, weight: '700', fill: '#002868' }),
  ].join('');
}

// Right-side removal box (row 1)
function removedBox(x, y, dup, auto) {
  const mid = x + RW / 2;
  return [
    rect(x, y, RW, BH, { stroke: '#9CA3AF' }),
    txt(mid, y + 16, 'Records removed before screening:', { size: 10, fill: '#374151' }),
    txt(mid, y + 32, `Duplicate records removed (n = ${dup})`, { size: 10, fill: '#6B7280' }),
    txt(mid, y + 46, `Marked ineligible by automation (n = ${auto})`, { size: 10, fill: '#6B7280' }),
    txt(mid, y + 60, 'Records removed for other reasons (n = 0)', { size: 10, fill: '#6B7280' }),
  ].join('');
}

// Standard right exclusion box
function exclBox(x, y, h, label, count) {
  const mid = x + RW / 2;
  return [
    rect(x, y, RW, h, { stroke: '#9CA3AF' }),
    txt(mid, y + 26, label, { size: 11, fill: '#374151' }),
    txt(mid, y + 50, `(n = ${count})`, { size: 17, weight: '700', fill: '#EF4444' }),
  ].join('');
}

// Multi-reason exclusion box (row 4 right)
function reasonsBox(x, y, h, reasons) {
  const mid = x + RW / 2;
  let out = [rect(x, y, RW, h, { stroke: '#9CA3AF' })];
  out.push(txt(mid, y + 16, 'Records excluded:', { size: 11, fill: '#374151' }));
  const lineH = Math.min(16, (h - 30) / Math.max(reasons.length, 1));
  reasons.forEach((r, i) => {
    const label = r.reason.length > 22 ? r.reason.slice(0, 21) + '…' : r.reason;
    out.push(txt(mid, y + 34 + i * lineH, `${label} (n = ${r.count})`, { size: 10, fill: '#6B7280' }));
  });
  if (reasons.length === 0) {
    out.push(txt(mid, y + 44, '(n = 0)', { size: 17, weight: '700', fill: '#EF4444' }));
  }
  return out.join('');
}

export function generatePrismaSvg(c) {
  const {
    identified, duplicatesRemoved, automationRemoved,
    screened, excludedScreening, exclusionReasons,
    soughtRetrieval, notRetrieved,
    assessedEligibility, excludedEligibility,
    included,
  } = c;

  const sectionBars = SECTIONS.map(([y1, y2, label]) => {
    const cy = (y1 + y2) / 2;
    return `
      ${rect(0, y1, 28, y2 - y1, { fill: SECT_COLOR, stroke: SECT_COLOR, rx: 0 })}
      <text x="14" y="${cy}" text-anchor="middle" font-size="9" font-weight="700"
        fill="white" font-family="${FONT}"
        transform="rotate(-90,14,${cy})">${esc(label.toUpperCase())}</text>`;
  }).join('');

  // Row 4 right box needs taller height if there are reasons
  const r4RightH = exclusionReasons.length > 0
    ? 28 + exclusionReasons.length * 17
    : BH;
  const clampedR4H = Math.max(BH, Math.min(r4RightH, 100));

  // Horizontal arrow y-midpoints
  const r1HY = R1 + BH / 2;
  const r2HY = R2 + BH / 2;
  const r3HY = R3 + BH / 2;
  const r4HY = R4 + BH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="arr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- background -->
  <rect width="${W}" height="${H}" fill="white"/>

  <!-- gold header bar -->
  <rect x="0" y="0" width="${W}" height="48" fill="#C8A951"/>
  ${txt(W / 2, 30, 'Identification of studies via databases and registers', { size: 13, weight: '700', fill: '#002868' })}

  <!-- section label bars -->
  ${sectionBars}

  <!-- ROW 1 — Identification -->
  ${identBox(LX, R1, identified)}
  ${hArrow(r1HY, LX + LW, RX)}
  ${removedBox(RX, R1, duplicatesRemoved, automationRemoved)}

  <!-- arrow R1→R2 -->
  ${vArrow(MID_L, R1 + BH, R2)}

  <!-- ROW 2 — Screened -->
  ${mainBox(LX, R2, 'Records screened', screened)}
  ${hArrow(r2HY, LX + LW, RX)}
  ${exclBox(RX, R2, BH, 'Records excluded**', excludedScreening)}

  <!-- arrow R2→R3 -->
  ${vArrow(MID_L, R2 + BH, R3)}

  <!-- ROW 3 — Retrieval -->
  ${mainBox(LX, R3, 'Reports sought for retrieval', soughtRetrieval)}
  ${hArrow(r3HY, LX + LW, RX)}
  ${exclBox(RX, R3, BH, 'Reports not retrieved', notRetrieved)}

  <!-- arrow R3→R4 -->
  ${vArrow(MID_L, R3 + BH, R4)}

  <!-- ROW 4 — Eligibility -->
  ${mainBox(LX, R4, 'Reports assessed for eligibility', assessedEligibility)}
  ${hArrow(r4HY, LX + LW, RX)}
  ${reasonsBox(RX, R4, clampedR4H, exclusionReasons)}

  <!-- arrow R4→R5 -->
  ${vArrow(MID_L, R4 + BH, R5)}

  <!-- ROW 5 — Included -->
  ${includedBox(LX, R5, included)}
</svg>`;
}
