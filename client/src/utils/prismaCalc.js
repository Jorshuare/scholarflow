export function calcPrismaNumbers(papers) {
  const total    = papers.length;
  const excluded = papers.filter(p => p.status === 'EXCLUDED').length;
  const included = papers.filter(p => p.status === 'INCLUDED').length;
  const pending  = papers.filter(p => p.status === 'PENDING').length;

  return {
    identified:        total,
    screened:          total,
    excludedScreening: excluded,
    eligible:          included + pending,
    excludedFullText:  0,
    included,
  };
}
