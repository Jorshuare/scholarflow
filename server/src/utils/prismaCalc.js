export function calcPrismaNumbers(papers) {
  const excluded = papers.filter(p => p.status === 'EXCLUDED');
  const included = papers.filter(p => p.status === 'INCLUDED');

  // Exclusion reason breakdown (top 3 reasons)
  const reasonMap = {};
  excluded.forEach(p => {
    const r = (p.exclusionReason?.trim()) || 'Not specified';
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  });
  const exclusionReasons = Object.entries(reasonMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ reason, count }));

  const includedWithPdf    = included.filter(p => p.pdfProcessed).length;
  const includedWithoutPdf = included.length - includedWithPdf;

  return {
    identified:          papers.length,
    duplicatesRemoved:   0,
    automationRemoved:   0,
    screened:            papers.length,
    excludedScreening:   excluded.length,
    exclusionReasons,
    soughtRetrieval:     included.length,
    notRetrieved:        includedWithoutPdf,
    assessedEligibility: includedWithPdf,
    excludedEligibility: 0,
    included:            included.length,
  };
}
