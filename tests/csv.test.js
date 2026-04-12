/**
 * csv.test.js — Tests for csv.js and export.js
 * Run: node --test tests/csv.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCSV,
  stringifyCSV,
  detectDelimiter,
  detectColumnType,
  isValidNumber,
  isValidDate,
  isValidBoolean,
} from '../src/csv.js';

import {
  toCSV,
  toTSV,
  toJSON,
  toMarkdown,
  toHTML,
} from '../src/export.js';

// ── parseCSV ───────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses a simple single row', () => {
    const result = parseCSV('a,b,c');
    assert.deepEqual(result, [['a', 'b', 'c']]);
  });

  it('parses multiple rows', () => {
    const result = parseCSV('a,b\n1,2\n3,4');
    assert.deepEqual(result, [['a', 'b'], ['1', '2'], ['3', '4']]);
  });

  it('handles quoted fields', () => {
    const result = parseCSV('"hello","world"');
    assert.deepEqual(result, [['hello', 'world']]);
  });

  it('handles escaped double quotes inside quoted fields', () => {
    const result = parseCSV('"say ""hi""",world');
    assert.deepEqual(result, [['say "hi"', 'world']]);
  });

  it('handles embedded newlines inside quoted fields', () => {
    const result = parseCSV('"line1\nline2",end');
    assert.deepEqual(result, [['line1\nline2', 'end']]);
  });

  it('handles empty fields', () => {
    const result = parseCSV('a,,c');
    assert.deepEqual(result, [['a', '', 'c']]);
  });

  it('handles trailing newline (should not produce extra empty row)', () => {
    const result = parseCSV('a,b\nc,d\n');
    assert.deepEqual(result, [['a', 'b'], ['c', 'd']]);
  });

  it('returns empty array for empty string', () => {
    const result = parseCSV('');
    assert.deepEqual(result, []);
  });

  it('handles CRLF line endings', () => {
    const result = parseCSV('a,b\r\nc,d');
    assert.deepEqual(result, [['a', 'b'], ['c', 'd']]);
  });

  it('handles tab delimiter', () => {
    const result = parseCSV('a\tb\tc', '\t');
    assert.deepEqual(result, [['a', 'b', 'c']]);
  });

  it('handles semicolon delimiter', () => {
    const result = parseCSV('a;b;c', ';');
    assert.deepEqual(result, [['a', 'b', 'c']]);
  });

  it('handles pipe delimiter', () => {
    const result = parseCSV('a|b|c', '|');
    assert.deepEqual(result, [['a', 'b', 'c']]);
  });

  it('handles single column', () => {
    const result = parseCSV('one\ntwo\nthree');
    assert.deepEqual(result, [['one'], ['two'], ['three']]);
  });

  it('handles single row single column', () => {
    const result = parseCSV('hello');
    assert.deepEqual(result, [['hello']]);
  });

  it('handles unicode characters', () => {
    const result = parseCSV('名前,年齢\n東京,30');
    assert.deepEqual(result, [['名前', '年齢'], ['東京', '30']]);
  });

  it('handles quoted field containing delimiter', () => {
    const result = parseCSV('"a,b",c');
    assert.deepEqual(result, [['a,b', 'c']]);
  });

  it('parses field that starts with quote but has no closing quote gracefully', () => {
    // Edge: treat as quoted until end
    const result = parseCSV('"unclosed');
    assert.ok(Array.isArray(result));
  });

  it('handles empty CSV with only newlines', () => {
    const result = parseCSV('\n\n');
    // Should produce some empty rows or return empty
    assert.ok(Array.isArray(result));
  });
});

// ── stringifyCSV ───────────────────────────────────────────────────────────

describe('stringifyCSV', () => {
  it('round-trips simple data', () => {
    const rows = [['a', 'b', 'c'], ['1', '2', '3']];
    const csv = stringifyCSV(rows);
    assert.deepEqual(parseCSV(csv), rows);
  });

  it('quotes fields containing commas', () => {
    const csv = stringifyCSV([['a,b', 'c']]);
    assert.ok(csv.includes('"a,b"'));
  });

  it('quotes fields containing double quotes and escapes them', () => {
    const csv = stringifyCSV([['say "hi"']]);
    assert.ok(csv.includes('""hi""'));
  });

  it('quotes fields containing newlines', () => {
    const csv = stringifyCSV([['line1\nline2']]);
    assert.ok(csv.includes('"line1\nline2"'));
  });

  it('returns empty string for empty input', () => {
    assert.equal(stringifyCSV([]), '');
  });

  it('handles null/undefined values as empty string', () => {
    const csv = stringifyCSV([[null, undefined, '']]);
    assert.equal(csv, ',,');
  });

  it('round-trips with tab delimiter', () => {
    const rows = [['a', 'b'], ['1', '2']];
    const tsv = stringifyCSV(rows, '\t');
    assert.deepEqual(parseCSV(tsv, '\t'), rows);
  });
});

// ── detectDelimiter ────────────────────────────────────────────────────────

describe('detectDelimiter', () => {
  it('detects comma', () => {
    assert.equal(detectDelimiter('a,b,c\n1,2,3\n4,5,6'), ',');
  });

  it('detects tab', () => {
    assert.equal(detectDelimiter('a\tb\tc\n1\t2\t3\n4\t5\t6'), '\t');
  });

  it('detects semicolon', () => {
    assert.equal(detectDelimiter('a;b;c\n1;2;3\n4;5;6'), ';');
  });

  it('detects pipe', () => {
    assert.equal(detectDelimiter('a|b|c\n1|2|3\n4|5|6'), '|');
  });

  it('returns comma for empty string', () => {
    assert.equal(detectDelimiter(''), ',');
  });

  it('returns comma for single field', () => {
    assert.equal(detectDelimiter('hello'), ',');
  });

  it('prefers most consistent delimiter', () => {
    // Tab is consistent; comma appears less
    const result = detectDelimiter('a\tb\tc\n1\t2\t3\n4\t5\t6');
    assert.equal(result, '\t');
  });
});

// ── detectColumnType ───────────────────────────────────────────────────────

describe('detectColumnType', () => {
  it('detects number type', () => {
    assert.equal(detectColumnType(['1', '2', '3', '4.5']), 'number');
  });

  it('detects date type', () => {
    assert.equal(detectColumnType(['2022-01-01', '2023-06-15', '2024-12-31']), 'date');
  });

  it('detects boolean type', () => {
    assert.equal(detectColumnType(['true', 'false', 'true', 'false']), 'boolean');
  });

  it('detects string type for mixed values', () => {
    assert.equal(detectColumnType(['hello', 'world', '123']), 'string');
  });

  it('returns string for empty array', () => {
    assert.equal(detectColumnType([]), 'string');
  });

  it('returns string for all-empty values', () => {
    assert.equal(detectColumnType(['', '', '']), 'string');
  });

  it('detects yes/no as boolean', () => {
    assert.equal(detectColumnType(['yes', 'no', 'yes']), 'boolean');
  });
});

// ── isValidNumber ──────────────────────────────────────────────────────────

describe('isValidNumber', () => {
  it('returns true for integer string', () => assert.ok(isValidNumber('42')));
  it('returns true for float', () => assert.ok(isValidNumber('3.14')));
  it('returns true for negative', () => assert.ok(isValidNumber('-5')));
  it('returns false for empty string', () => assert.ok(!isValidNumber('')));
  it('returns false for word', () => assert.ok(!isValidNumber('hello')));
  it('returns true for zero', () => assert.ok(isValidNumber('0')));
});

// ── isValidDate ────────────────────────────────────────────────────────────

describe('isValidDate', () => {
  it('returns true for YYYY-MM-DD', () => assert.ok(isValidDate('2024-03-15')));
  it('returns true for ISO datetime', () => assert.ok(isValidDate('2024-03-15T12:00:00')));
  it('returns false for empty string', () => assert.ok(!isValidDate('')));
  it('returns false for random string', () => assert.ok(!isValidDate('hello')));
  it('returns true for YYYY/MM/DD', () => assert.ok(isValidDate('2024/03/15')));
});

// ── isValidBoolean ─────────────────────────────────────────────────────────

describe('isValidBoolean', () => {
  it('returns true for true/false', () => {
    assert.ok(isValidBoolean('true'));
    assert.ok(isValidBoolean('false'));
  });
  it('returns true for yes/no', () => {
    assert.ok(isValidBoolean('yes'));
    assert.ok(isValidBoolean('no'));
  });
  it('returns true for 1/0', () => {
    assert.ok(isValidBoolean('1'));
    assert.ok(isValidBoolean('0'));
  });
  it('returns false for empty', () => assert.ok(!isValidBoolean('')));
  it('returns false for other string', () => assert.ok(!isValidBoolean('maybe')));
  it('is case insensitive', () => {
    assert.ok(isValidBoolean('TRUE'));
    assert.ok(isValidBoolean('False'));
  });
});

// ── toCSV ──────────────────────────────────────────────────────────────────

describe('toCSV', () => {
  it('produces comma-separated output', () => {
    const result = toCSV([['a', 'b'], ['1', '2']]);
    assert.ok(result.includes('a,b'));
  });

  it('round-trips data', () => {
    const rows = [['name', 'age'], ['Alice', '30'], ['Bob', '25']];
    assert.deepEqual(parseCSV(toCSV(rows)), rows);
  });
});

// ── toTSV ──────────────────────────────────────────────────────────────────

describe('toTSV', () => {
  it('produces tab-separated output', () => {
    const result = toTSV([['a', 'b'], ['1', '2']]);
    assert.ok(result.includes('a\tb'));
  });

  it('round-trips data', () => {
    const rows = [['x', 'y'], ['1', '2']];
    assert.deepEqual(parseCSV(toTSV(rows), '\t'), rows);
  });
});

// ── toJSON ─────────────────────────────────────────────────────────────────

describe('toJSON', () => {
  it('produces array of objects with header', () => {
    const json = toJSON([['name', 'age'], ['Alice', '30']]);
    const parsed = JSON.parse(json);
    assert.deepEqual(parsed, [{ name: 'Alice', age: '30' }]);
  });

  it('produces array of arrays without header', () => {
    const json = toJSON([['a', 'b'], ['1', '2']], false);
    const parsed = JSON.parse(json);
    assert.deepEqual(parsed, [['a', 'b'], ['1', '2']]);
  });

  it('returns empty array for empty input', () => {
    const json = toJSON([]);
    assert.equal(json, '[]');
  });

  it('handles header-only (no data rows)', () => {
    const json = toJSON([['name', 'age']]);
    const parsed = JSON.parse(json);
    assert.deepEqual(parsed, []);
  });
});

// ── toMarkdown ─────────────────────────────────────────────────────────────

describe('toMarkdown', () => {
  it('produces markdown table with header', () => {
    const md = toMarkdown([['Name', 'Age'], ['Alice', '30']]);
    assert.ok(md.includes('| Name'));
    assert.ok(md.includes('|---'));
    assert.ok(md.includes('| Alice'));
  });

  it('aligns separator row to column count', () => {
    const md = toMarkdown([['A', 'B', 'C'], ['1', '2', '3']]);
    const lines = md.split('\n');
    assert.equal(lines.length, 3);
    assert.ok(lines[1].includes('---'));
  });

  it('escapes pipe characters in content', () => {
    const md = toMarkdown([['Name'], ['a|b']]);
    assert.ok(md.includes('\\|'));
  });

  it('returns empty string for empty input', () => {
    assert.equal(toMarkdown([]), '');
  });

  it('works without header row', () => {
    const md = toMarkdown([['1', '2'], ['3', '4']], false);
    assert.ok(md.includes('Col 1'));
    assert.ok(md.includes('---'));
  });

  it('handles single column', () => {
    const md = toMarkdown([['Value'], ['hello']]);
    assert.ok(md.includes('Value'));
    assert.ok(md.includes('hello'));
  });

  it('handles unicode content', () => {
    const md = toMarkdown([['名前'], ['東京']]);
    assert.ok(md.includes('名前'));
    assert.ok(md.includes('東京'));
  });
});

// ── toHTML ─────────────────────────────────────────────────────────────────

describe('toHTML', () => {
  it('produces HTML table with thead and tbody', () => {
    const html = toHTML([['Name', 'Age'], ['Alice', '30']]);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<thead>'));
    assert.ok(html.includes('<tbody>'));
    assert.ok(html.includes('<th>Name</th>'));
    assert.ok(html.includes('<td>Alice</td>'));
  });

  it('escapes HTML special characters', () => {
    const html = toHTML([['Col'], ['<script>alert(1)</script>']]);
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('escapes ampersands', () => {
    const html = toHTML([['Col'], ['a & b']]);
    assert.ok(html.includes('a &amp; b'));
  });

  it('returns empty table for empty input', () => {
    assert.equal(toHTML([]), '<table></table>');
  });

  it('produces tbody only when no header', () => {
    const html = toHTML([['a', 'b']], false);
    assert.ok(!html.includes('<thead>'));
    assert.ok(html.includes('<tbody>'));
  });
});
