export function downloadExport(projectId, type) {
  const urls = {
    bibtex:    `/api/projects/${projectId}/export/bibtex`,
    csv:       `/api/projects/${projectId}/export/csv`,
    prismaSvg: `/api/projects/${projectId}/export/prisma.svg`,
  };
  const link = document.createElement('a');
  link.href = urls[type];
  link.click();
}
