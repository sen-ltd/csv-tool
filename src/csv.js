/**
 * csv.js — RFC 4180 CSV parser, stringifier, and utility functions
 *
 * parseCSV(text, delimiter?)  → string[][]
 * stringifyCSV(rows, delimiter?) → string
 * detectDelimiter(text) → "," | "\t" | ";" | "|"
 * detectColumnType(values) → "number" | "date" | "boolean" | "string"
 */

// ── Parser ─────────────────────────────────────────────────────────────────

/**
 * Parse CSV text (RFC 4180) into a 2D array of strings.
 * @param {string} text
 * @param {string} [delimiter=","]
 * @returns {string[][]}
 */
export function parseCSV(text, delimiter = ',') {
  if (text === '' || text === null || text === undefined) return [];

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  // Normalize line endings
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const srcLen = src.length;

  while (i < srcLen) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead for escaped quote
        if (i + 1 < srcLen && src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === delimiter) {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Push last field/row
  row.push(field);
  // Skip trailing empty row from trailing newline
  if (!(rows.length > 0 && row.length === 1 && row[0] === '')) {
    rows.push(row);
  }

  return rows;
}

// ── Stringifier ────────────────────────────────────────────────────────────

/**
 * Convert 2D array to CSV string (RFC 4180).
 * @param {string[][]} rows
 * @param {string} [delimiter=","]
 * @returns {string}
 */
export function stringifyCSV(rows, delimiter = ',') {
  if (!rows || rows.length === 0) return '';

  return rows.map((row) =>
    row.map((field) => {
      const s = String(field == null ? '' : field);
      // Quote if contains delimiter, double-quote, or newline
      if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(delimiter)
  ).join('\n');
}

// ── Delimiter detection ────────────────────────────────────────────────────

/**
 * Detect the most likely delimiter from the first few lines.
 * @param {string} text
 * @returns {"," | "\t" | ";" | "|"}
 */
export function detectDelimiter(text) {
  const candidates = [',', '\t', ';', '|'];
  const lines = text.split(/\r?\n/).slice(0, 10).filter((l) => l.trim() !== '');
  if (lines.length === 0) return ',';

  let bestDelim = ',';
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = lines.map((line) => {
      // Count unquoted occurrences
      let count = 0;
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQ = !inQ;
        } else if (!inQ && line[i] === delim) {
          count++;
        }
      }
      return count;
    });

    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const sum = counts.reduce((a, b) => a + b, 0);

    if (sum === 0) continue;

    // Score: prefer consistent counts (low variance) and high count
    const variance = max - min;
    const score = sum - variance * lines.length;

    if (score > bestScore) {
      bestScore = score;
      bestDelim = delim;
    }
  }

  return bestDelim;
}

// ── Type detection ─────────────────────────────────────────────────────────

/**
 * Detect the dominant type for an array of string values.
 * @param {string[]} values
 * @returns {"number" | "date" | "boolean" | "string"}
 */
export function detectColumnType(values) {
  const nonEmpty = values.filter((v) => v !== '' && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return 'string';

  const counts = { number: 0, date: 0, boolean: 0, string: 0 };
  for (const v of nonEmpty) {
    if (isValidNumber(v)) counts.number++;
    else if (isValidBoolean(v)) counts.boolean++;
    else if (isValidDate(v)) counts.date++;
    else counts.string++;
  }

  const total = nonEmpty.length;
  const threshold = 0.8;

  if (counts.boolean / total >= threshold) return 'boolean';
  if (counts.number / total >= threshold) return 'number';
  if (counts.date / total >= threshold) return 'date';
  return 'string';
}

/**
 * @param {string} str
 * @returns {boolean}
 */
export function isValidNumber(str) {
  if (str === '' || str === null || str === undefined) return false;
  const s = str.trim();
  if (s === '') return false;
  // Allow integers, floats, scientific notation, negatives, percentages
  return /^-?(\d{1,3}(,\d{3})*|\d+)(\.\d+)?(e[+-]?\d+)?%?$/i.test(s);
}

/**
 * @param {string} str
 * @returns {boolean}
 */
export function isValidDate(str) {
  if (str === '' || str === null || str === undefined) return false;
  const s = str.trim();
  if (s === '') return false;
  // ISO 8601: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, YYYY/MM/DD, MM/DD/YYYY, DD.MM.YYYY
  const patterns = [
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?Z?)?$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}\.\d{2}\.\d{4}$/,
  ];
  if (!patterns.some((p) => p.test(s))) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

/**
 * @param {string} str
 * @returns {boolean}
 */
export function isValidBoolean(str) {
  if (str === '' || str === null || str === undefined) return false;
  return /^(true|false|yes|no|1|0)$/i.test(str.trim());
}
