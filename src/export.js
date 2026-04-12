/**
 * export.js — Export CSV data to various formats
 *
 * toCSV(rows) → string
 * toTSV(rows) → string
 * toJSON(rows, hasHeader) → string
 * toMarkdown(rows, hasHeader) → string
 * toHTML(rows, hasHeader) → string
 */

import { stringifyCSV } from './csv.js';

// ── CSV / TSV ──────────────────────────────────────────────────────────────

/**
 * @param {string[][]} rows
 * @returns {string}
 */
export function toCSV(rows) {
  return stringifyCSV(rows, ',');
}

/**
 * @param {string[][]} rows
 * @returns {string}
 */
export function toTSV(rows) {
  return stringifyCSV(rows, '\t');
}

// ── JSON ───────────────────────────────────────────────────────────────────

/**
 * Convert rows to JSON.
 * If hasHeader: array of objects using first row as keys.
 * Otherwise: array of arrays.
 * @param {string[][]} rows
 * @param {boolean} [hasHeader=true]
 * @returns {string}
 */
export function toJSON(rows, hasHeader = true) {
  if (!rows || rows.length === 0) return '[]';

  if (hasHeader && rows.length >= 1) {
    const headers = rows[0];
    const dataRows = rows.slice(1);
    if (dataRows.length === 0) {
      // Only headers — return empty array
      return '[]';
    }
    const objects = dataRows.map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = h || `col${i}`;
        obj[key] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
    return JSON.stringify(objects, null, 2);
  }

  return JSON.stringify(rows, null, 2);
}

// ── Markdown ───────────────────────────────────────────────────────────────

/**
 * Convert rows to a Markdown table.
 * @param {string[][]} rows
 * @param {boolean} [hasHeader=true]
 * @returns {string}
 */
export function toMarkdown(rows, hasHeader = true) {
  if (!rows || rows.length === 0) return '';

  // Escape pipe characters in cell content
  const escape = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');

  let tableRows = rows;
  let headerRow;
  let dataRows;

  if (hasHeader && rows.length >= 1) {
    headerRow = rows[0];
    dataRows = rows.slice(1);
  } else {
    // No header: auto-generate column names
    const colCount = Math.max(...rows.map((r) => r.length));
    headerRow = Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);
    dataRows = rows;
  }

  const colCount = Math.max(headerRow.length, ...dataRows.map((r) => r.length));

  // Calculate column widths
  const widths = Array.from({ length: colCount }, (_, i) => {
    const headerLen = escape(headerRow[i] || '').length;
    const dataLens = dataRows.map((r) => escape(r[i] || '').length);
    return Math.max(3, headerLen, ...dataLens);
  });

  const padCell = (s, width) => {
    const str = escape(s || '');
    return ' ' + str + ' '.repeat(Math.max(0, width - str.length)) + ' ';
  };

  const separator = widths.map((w) => '-'.repeat(w + 2)).join('|');

  const headerLine = '|' + headerRow.slice(0, colCount).map((h, i) => padCell(h, widths[i])).join('|') +
    (headerRow.length < colCount ? '|' + widths.slice(headerRow.length).map((w) => padCell('', w)).join('|') : '') + '|';

  const sepLine = '|' + separator + '|';

  const dataLines = dataRows.map((row) => {
    const cells = Array.from({ length: colCount }, (_, i) => padCell(row[i], widths[i]));
    return '|' + cells.join('|') + '|';
  });

  return [headerLine, sepLine, ...dataLines].join('\n');
}

// ── HTML ───────────────────────────────────────────────────────────────────

/**
 * Convert rows to an HTML table.
 * @param {string[][]} rows
 * @param {boolean} [hasHeader=true]
 * @returns {string}
 */
export function toHTML(rows, hasHeader = true) {
  if (!rows || rows.length === 0) return '<table></table>';

  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const lines = ['<table>'];

  if (hasHeader && rows.length >= 1) {
    lines.push('  <thead>');
    lines.push('    <tr>');
    for (const cell of rows[0]) {
      lines.push(`      <th>${esc(cell)}</th>`);
    }
    lines.push('    </tr>');
    lines.push('  </thead>');
    lines.push('  <tbody>');
    for (const row of rows.slice(1)) {
      lines.push('    <tr>');
      for (const cell of row) {
        lines.push(`      <td>${esc(cell)}</td>`);
      }
      lines.push('    </tr>');
    }
    lines.push('  </tbody>');
  } else {
    lines.push('  <tbody>');
    for (const row of rows) {
      lines.push('    <tr>');
      for (const cell of row) {
        lines.push(`      <td>${esc(cell)}</td>`);
      }
      lines.push('    </tr>');
    }
    lines.push('  </tbody>');
  }

  lines.push('</table>');
  return lines.join('\n');
}
