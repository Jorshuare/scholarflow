function escape(val) {
  if (val == null) return '';
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function papersToCsv(papers) {
  const headers = ['title', 'authors', 'year', 'venue', 'doi', 'abstract', 'status', 'exclusionReason', 'notes'];
  const rows = papers.map(p =>
    headers.map(h => escape(p[h])).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
