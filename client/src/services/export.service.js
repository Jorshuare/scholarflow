import api from './api';

async function download(url, filename, mime) {
  const res  = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: mime });
  const href = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export const downloadExport = (projectId, type) => {
  const map = {
    bibtex:    [`/projects/${projectId}/export/bibtex`,     'included_papers.bib', 'application/x-bibtex'],
    csv:       [`/projects/${projectId}/export/csv`,        'papers.csv',          'text/csv'],
    prismaSvg: [`/projects/${projectId}/export/prisma.svg`, 'prisma.svg',          'image/svg+xml'],
  };
  const [url, filename, mime] = map[type];
  return download(url, filename, mime);
};
