export function papersToBibtex(papers) {
  return papers.map((p, i) => {
    const key = `ref${i + 1}`;
    const fields = [];
    if (p.title)   fields.push(`  title     = {${p.title}}`);
    if (p.authors) fields.push(`  author    = {${p.authors}}`);
    if (p.year)    fields.push(`  year      = {${p.year}}`);
    if (p.venue)   fields.push(`  journal   = {${p.venue}}`);
    if (p.doi)     fields.push(`  doi       = {${p.doi}}`);
    if (p.abstract) fields.push(`  abstract  = {${p.abstract}}`);
    return `@article{${key},\n${fields.join(',\n')}\n}`;
  }).join('\n\n');
}
