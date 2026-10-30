/** Minimal CSV reader supporting quoted fields, escaped quotes and embedded commas. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const input = String(text).replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value !== '')) rows.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    if (row.some((value) => value !== '')) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

export async function loadCandidatesForState(stateId, { fetchImpl = globalThis.fetch, basePath = '/data/', candidateIndex = [] } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required to load candidates');
  const entry = candidateIndex.find((item) => item.state === stateId || item.state_id === stateId);
  if (!entry?.file) throw new Error(`No candidate partition found for state ${stateId}`);
  const response = await fetchImpl(`${basePath}${entry.file}`);
  if (!response.ok) throw new Error(`Candidate load failed for ${stateId}: HTTP ${response.status}`);
  const text = await response.text();
  const candidates = parseCsv(text);
  return { stateId, candidates, loadedAt: new Date().toISOString(), sourceFile: entry.file };
}
