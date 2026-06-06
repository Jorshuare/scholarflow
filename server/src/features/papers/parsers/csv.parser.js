import { parse } from 'csv-parse/sync';

// Maps common column name variants to our schema fields
const COLUMN_MAP = {
  title:    ['title', 'Title', 'TITLE', 'paper title', 'Paper Title'],
  authors:  ['authors', 'Authors', 'author', 'Author', 'AUTHOR'],
  year:     ['year', 'Year', 'YEAR', 'publication year', 'Publication Year'],
  venue:    ['venue', 'Venue', 'journal', 'Journal', 'conference', 'Conference', 'source', 'Source'],
  doi:      ['doi', 'DOI', 'Doi'],
  abstract: ['abstract', 'Abstract', 'ABSTRACT'],
};

export function parseCsv(buffer) {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => {
    const paper = {};
    for (const [field, variants] of Object.entries(COLUMN_MAP)) {
      const key = variants.find((v) => row[v] !== undefined);
      paper[field] = key ? (row[key] || null) : null;
    }
    paper.year = paper.year ? parseInt(paper.year, 10) || null : null;
    paper.title = paper.title || 'Untitled';
    return paper;
  });
}
