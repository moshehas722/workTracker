const CSV_HEADERS = ['start_time', 'end_time', 'duration_seconds', 'amount', 'currency', 'note', 'type'];

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function entriesToCsv(entries, project) {
  const lines = [CSV_HEADERS.join(',')];
  for (const entry of entries) {
    const row = [
      entry.start_time || '',
      entry.end_time || '',
      entry.duration_seconds ?? '',
      entry.amount ?? '',
      entry.currency || project.currency,
      entry.note || '',
      entry.is_manual ? 'manual' : 'tracked',
    ];
    lines.push(row.map(escapeCsvField).join(','));
  }
  return lines.join('\r\n');
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  const dataRows = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  if (dataRows.length === 0) return [];

  const headers = dataRows[0].map((h) => h.trim());
  return dataRows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? r[idx].trim() : ''; });
    return obj;
  });
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
