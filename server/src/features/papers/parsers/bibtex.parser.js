import Cite from 'citation-js';

export function parseBibtex(raw) {
  const cite = new Cite(raw, { forceType: '@bibtex/text' });
  const entries = cite.get({ format: 'real', type: 'json', style: 'csl' });

  return entries.map((e) => ({
    title:  e.title                          || 'Untitled',
    authors: formatAuthors(e.author)         || null,
    year:   e.issued?.['date-parts']?.[0]?.[0] ? Number(e.issued['date-parts'][0][0]) : null,
    venue:  e['container-title'] || e.publisher || null,
    doi:    e.DOI                            || null,
    abstract: e.abstract                     || null,
  }));
}

function formatAuthors(authorList) {
  if (!authorList?.length) return null;
  return authorList
    .map((a) => [a.family, a.given].filter(Boolean).join(', '))
    .join('; ');
}
