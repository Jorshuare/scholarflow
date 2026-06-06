export function generatePrismaSvg(counts) {
  const {
    identified,
    screened,
    excludedScreening,
    eligible,
    excludedFullText,
    included,
  } = counts;

  // Box geometry
  const bw = 220, bh = 50, rx = 6;
  const mainX = 60, exX = 340;
  const y1 = 40, y2 = 140, y3 = 240, y4 = 340;
  const midMain = mainX + bw / 2;
  const midEx   = exX + bw / 2;
  const svgW = 620, svgH = 430;

  function box(x, y, label, count, accent = '#6366f1') {
    return `
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${rx}" fill="#1A1D27" stroke="${accent}" stroke-width="1.5"/>
      <text x="${x + bw / 2}" y="${y + 18}" text-anchor="middle" font-size="11" fill="#7B7F96" font-family="Inter,sans-serif">${label}</text>
      <text x="${x + bw / 2}" y="${y + 36}" text-anchor="middle" font-size="16" font-weight="600" fill="#F0F2F8" font-family="Inter,sans-serif">${count}</text>
    `;
  }

  function arrow(x1, y1a, x2, y2a) {
    return `<line x1="${x1}" y1="${y1a}" x2="${x2}" y2="${y2a}" stroke="#2A2D3A" stroke-width="1.5" marker-end="url(#arr)"/>`;
  }

  function hArrow(x1, y1a, x2) {
    return `<line x1="${x1}" y1="${y1a}" x2="${x2}" y2="${y1a}" stroke="#2A2D3A" stroke-width="1.5" marker-end="url(#arr)"/>`;
  }

  const sections = [
    { label: 'IDENTIFICATION', y: y1 - 10, fill: '#6366f1' },
    { label: 'SCREENING',      y: y2 - 10, fill: '#8b5cf6' },
    { label: 'ELIGIBILITY',    y: y3 - 10, fill: '#06b6d4' },
    { label: 'INCLUDED',       y: y4 - 10, fill: '#10b981' },
  ];

  const sectionLabels = sections.map(s =>
    `<text x="8" y="${s.y + 32}" font-size="8" font-weight="600" fill="${s.fill}" font-family="Inter,sans-serif" transform="rotate(-90,8,${s.y + 32})">${s.label}</text>
     <rect x="18" y="${s.y}" width="2" height="60" fill="${s.fill}" opacity="0.4"/>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#2A2D3A"/>
    </marker>
  </defs>
  <rect width="${svgW}" height="${svgH}" fill="#0F1117"/>
  ${sectionLabels}

  ${box(mainX, y1, 'Records identified', identified, '#6366f1')}
  ${arrow(midMain, y1 + bh, midMain, y2)}

  ${box(mainX, y2, 'Records screened', screened, '#8b5cf6')}
  ${hArrow(mainX + bw, y2 + bh / 2, exX)}
  ${box(exX, y2, 'Records excluded', excludedScreening, '#ef4444')}
  ${arrow(midMain, y2 + bh, midMain, y3)}

  ${box(mainX, y3, 'Full-text assessed', eligible, '#06b6d4')}
  ${hArrow(mainX + bw, y3 + bh / 2, exX)}
  ${box(exX, y3, 'Full-text excluded', excludedFullText, '#ef4444')}
  ${arrow(midMain, y3 + bh, midMain, y4)}

  ${box(mainX, y4, 'Studies included', included, '#10b981')}
</svg>`;
}
