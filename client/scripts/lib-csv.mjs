// Minimal CSV reader: handles quoted fields, embedded commas and doubled quotes.
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
      continue
    }
    if (c === '"') { inQuotes = true; continue }
    if (c === ',') { row.push(field); field = ''; continue }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    if (c === '\r') continue
    field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

export function readCsvObjects(text) {
  const rows = parseCsv(text).filter((r) => r.length > 1)
  const head = rows.shift()
  return rows.map((r) => {
    const o = {}
    head.forEach((h, i) => { o[h.trim()] = (r[i] ?? '').trim() })
    return o
  })
}
