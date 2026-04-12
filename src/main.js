/**
 * main.js — DOM, events, table rendering for CSV Tool
 */

import { parseCSV, stringifyCSV, detectDelimiter, detectColumnType } from './csv.js';
import { toCSV, toTSV, toJSON, toMarkdown, toHTML } from './export.js';
import { t, setLang, getLang, toggleLang } from './i18n.js';

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  rows: [],          // string[][]
  hasHeader: true,
  delimiter: ',',
  sortCol: -1,
  sortDir: 'asc',   // "asc" | "desc"
  search: '',
  page: 0,
  pageSize: 50,
  colTypes: [],      // detected types per column
};

// ── DOM references ─────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

// ── Sample data ────────────────────────────────────────────────────────────

const SAMPLE_CSV = `name,age,city,joined,active
Alice,30,Tokyo,2022-01-15,true
Bob,25,Osaka,2021-06-01,false
Carol,35,Kyoto,2023-03-22,true
Dave,28,Tokyo,2020-11-10,true
Eve,42,Nagoya,2019-07-30,false`;

// ── Init ───────────────────────────────────────────────────────────────────

function init() {
  applyTranslations();
  bindEvents();
  renderEmptyState();
}

// ── Translations ───────────────────────────────────────────────────────────

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.documentElement.lang = getLang();
  $('btn-lang').textContent = t('langToggle');
}

// ── Event binding ──────────────────────────────────────────────────────────

function bindEvents() {
  // Parse button
  $('btn-parse').addEventListener('click', parseInput);

  // Clear button
  $('btn-clear').addEventListener('click', clearAll);

  // Sample button
  $('btn-sample').addEventListener('click', () => {
    $('csv-input').value = SAMPLE_CSV;
    parseInput();
  });

  // Language toggle
  $('btn-lang').addEventListener('click', () => {
    toggleLang();
    applyTranslations();
    if (state.rows.length > 0) renderTable();
    renderStats();
  });

  // Theme toggle
  $('btn-theme').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    $('btn-theme').textContent = isDark ? '🌙' : '☀️';
  });

  // Header row toggle
  $('chk-header').addEventListener('change', (e) => {
    state.hasHeader = e.target.checked;
    if (state.rows.length > 0) {
      renderTable();
      renderStats();
    }
  });

  // Delimiter select
  $('sel-delimiter').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== 'auto') {
      state.delimiter = val === 'tab' ? '\t' : val;
    }
    if ($('csv-input').value.trim()) parseInput();
  });

  // Search
  $('input-search').addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase();
    state.page = 0;
    renderTable();
  });

  // File drop zone
  const dropZone = $('drop-zone');
  dropZone.addEventListener('click', () => $('file-input').click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
    dropZone.querySelector('.drop-label').textContent = t('dropActive');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
    dropZone.querySelector('.drop-label').textContent = t('dropZone');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    dropZone.querySelector('.drop-label').textContent = t('dropZone');
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  });

  $('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) readFile(file);
  });

  // Export buttons
  $('btn-export-csv').addEventListener('click', () => downloadFile(toCSV(state.rows), 'data.csv', 'text/csv'));
  $('btn-export-tsv').addEventListener('click', () => downloadFile(toTSV(state.rows), 'data.tsv', 'text/tab-separated-values'));
  $('btn-export-json').addEventListener('click', () => downloadFile(toJSON(state.rows, state.hasHeader), 'data.json', 'application/json'));
  $('btn-export-md').addEventListener('click', () => copyToClipboard(toMarkdown(state.rows, state.hasHeader)));
  $('btn-export-html').addEventListener('click', () => copyToClipboard(toHTML(state.rows, state.hasHeader)));

  // Add row/col
  $('btn-add-row').addEventListener('click', addRow);
  $('btn-add-col').addEventListener('click', addCol);

  // Pagination
  $('btn-prev').addEventListener('click', () => { if (state.page > 0) { state.page--; renderTable(); } });
  $('btn-next').addEventListener('click', () => {
    const filtered = getFilteredRows();
    const maxPage = Math.ceil(filtered.length / state.pageSize) - 1;
    if (state.page < maxPage) { state.page++; renderTable(); }
  });
  $('sel-page-size').addEventListener('change', (e) => {
    state.pageSize = parseInt(e.target.value, 10);
    state.page = 0;
    renderTable();
  });
}

// ── File reading ───────────────────────────────────────────────────────────

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    $('csv-input').value = e.target.result;
    parseInput();
  };
  reader.readAsText(file);
}

// ── Parse ──────────────────────────────────────────────────────────────────

function parseInput() {
  const text = $('csv-input').value;
  if (!text.trim()) {
    clearAll();
    return;
  }

  try {
    const delimSel = $('sel-delimiter').value;
    if (delimSel === 'auto' || delimSel === '') {
      state.delimiter = detectDelimiter(text);
    } else if (delimSel === 'tab') {
      state.delimiter = '\t';
    } else {
      state.delimiter = delimSel;
    }

    state.rows = parseCSV(text, state.delimiter);
    state.sortCol = -1;
    state.sortDir = 'asc';
    state.search = '';
    state.page = 0;
    $('input-search').value = '';

    // Detect column types from data rows
    const dataRows = state.hasHeader ? state.rows.slice(1) : state.rows;
    const colCount = state.rows[0]?.length || 0;
    state.colTypes = Array.from({ length: colCount }, (_, i) =>
      detectColumnType(dataRows.map((r) => r[i] || ''))
    );

    renderTable();
    renderStats();
    $('section-table').classList.remove('hidden');
    $('empty-state').classList.add('hidden');
  } catch (err) {
    showError(t('errorParse') + err.message);
  }
}

// ── Rendering ──────────────────────────────────────────────────────────────

function getFilteredRows() {
  const data = state.hasHeader ? state.rows.slice(1) : state.rows;
  if (!state.search) return data;
  return data.filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(state.search))
  );
}

function getSortedRows(rows) {
  if (state.sortCol < 0) return rows;
  const col = state.sortCol;
  const dir = state.sortDir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[col] || '';
    const bv = b[col] || '';
    const an = parseFloat(av);
    const bn = parseFloat(bv);
    if (!isNaN(an) && !isNaN(bn)) return dir * (an - bn);
    return dir * av.localeCompare(bv, undefined, { numeric: true });
  });
}

function renderTable() {
  const thead = $('tbl-head');
  const tbody = $('tbl-body');

  if (!state.rows.length) {
    thead.innerHTML = '';
    tbody.innerHTML = '';
    return;
  }

  const headers = state.hasHeader ? state.rows[0] : [];
  const colCount = state.rows[0]?.length || 0;

  // Header
  let headHtml = '<tr>';
  headHtml += '<th class="row-num">#</th>';
  for (let i = 0; i < colCount; i++) {
    const label = state.hasHeader ? (headers[i] || '') : `${t('colHeader')} ${i + 1}`;
    const sortIcon = state.sortCol === i ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    const typeTag = state.colTypes[i] ? `<span class="type-tag type-${state.colTypes[i]}">${t('type' + capitalize(state.colTypes[i]))}</span>` : '';
    headHtml += `<th class="sortable" data-col="${i}">${escapeHtml(label)}${sortIcon}${typeTag}<button class="btn-del-col icon-btn" data-col="${i}" title="${t('deleteCol')}">✕</button></th>`;
  }
  headHtml += '<th class="col-actions"></th>';
  headHtml += '</tr>';
  thead.innerHTML = headHtml;

  // Sort click
  thead.querySelectorAll('th.sortable').forEach((th) => {
    th.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-del-col')) return;
      const col = parseInt(th.getAttribute('data-col'), 10);
      if (state.sortCol === col) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortCol = col;
        state.sortDir = 'asc';
      }
      renderTable();
    });
  });

  // Delete col buttons
  thead.querySelectorAll('.btn-del-col').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCol(parseInt(btn.getAttribute('data-col'), 10));
    });
  });

  // Filtered + sorted data rows
  const filtered = getFilteredRows();
  const sorted = getSortedRows(filtered);
  const total = sorted.length;
  const start = state.page * state.pageSize;
  const end = Math.min(start + state.pageSize, total);
  const pageRows = sorted.slice(start, end);

  let bodyHtml = '';
  if (pageRows.length === 0) {
    bodyHtml = `<tr><td colspan="${colCount + 2}" class="no-results">${t('noResults')}</td></tr>`;
  } else {
    pageRows.forEach((row, idx) => {
      const globalIdx = start + idx + (state.hasHeader ? 1 : 0);
      bodyHtml += `<tr data-row="${globalIdx}">`;
      bodyHtml += `<td class="row-num">${start + idx + 1}</td>`;
      for (let c = 0; c < colCount; c++) {
        const val = row[c] !== undefined ? row[c] : '';
        bodyHtml += `<td class="editable" data-row="${globalIdx}" data-col="${c}" contenteditable="true">${escapeHtml(val)}</td>`;
      }
      bodyHtml += `<td class="row-actions"><button class="btn-del-row icon-btn" data-row="${globalIdx}" title="${t('deleteRow')}">✕</button></td>`;
      bodyHtml += '</tr>';
    });
  }
  tbody.innerHTML = bodyHtml;

  // Editable cells
  tbody.querySelectorAll('.editable').forEach((cell) => {
    cell.addEventListener('blur', (e) => {
      const r = parseInt(cell.getAttribute('data-row'), 10);
      const c = parseInt(cell.getAttribute('data-col'), 10);
      state.rows[r][c] = cell.textContent;
    });
  });

  // Delete row buttons
  tbody.querySelectorAll('.btn-del-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteRow(parseInt(btn.getAttribute('data-row'), 10));
    });
  });

  // Pagination info
  renderPagination(total, start, end);
}

function renderPagination(total, start, end) {
  const info = $('page-info');
  const btnPrev = $('btn-prev');
  const btnNext = $('btn-next');
  const maxPage = Math.ceil(total / state.pageSize) - 1;

  info.textContent = total > 0
    ? t('pageInfo', { start: start + 1, end, total })
    : '';
  btnPrev.disabled = state.page <= 0;
  btnNext.disabled = state.page >= maxPage || total === 0;

  $('section-pagination').classList.toggle('hidden', total <= state.pageSize);
}

function renderStats() {
  const statsEl = $('stats-bar');
  if (!state.rows.length) {
    statsEl.innerHTML = '';
    return;
  }
  const totalRows = state.hasHeader ? state.rows.length - 1 : state.rows.length;
  const colCount = state.rows[0]?.length || 0;
  statsEl.innerHTML = `
    <span class="stat-item"><strong>${totalRows}</strong> ${t('statsRows')}</span>
    <span class="stat-sep">·</span>
    <span class="stat-item"><strong>${colCount}</strong> ${t('statsCols')}</span>
  `;
}

function renderEmptyState() {
  $('empty-state').classList.remove('hidden');
  $('section-table').classList.add('hidden');
}

// ── Mutations ──────────────────────────────────────────────────────────────

function addRow() {
  if (!state.rows.length) return;
  const colCount = state.rows[0].length;
  state.rows.push(Array(colCount).fill(''));
  renderTable();
  renderStats();
}

function addCol() {
  if (!state.rows.length) return;
  state.rows = state.rows.map((row) => [...row, '']);
  if (state.hasHeader) {
    state.rows[0][state.rows[0].length - 1] = `Col ${state.rows[0].length}`;
  }
  state.colTypes.push('string');
  renderTable();
  renderStats();
}

function deleteRow(rowIdx) {
  state.rows.splice(rowIdx, 1);
  if (state.page > 0) {
    const filtered = getFilteredRows();
    const maxPage = Math.ceil(filtered.length / state.pageSize) - 1;
    if (state.page > maxPage) state.page = Math.max(0, maxPage);
  }
  renderTable();
  renderStats();
  if (state.rows.length === 0) renderEmptyState();
}

function deleteCol(colIdx) {
  state.rows = state.rows.map((row) => row.filter((_, i) => i !== colIdx));
  state.colTypes.splice(colIdx, 1);
  if (state.sortCol === colIdx) state.sortCol = -1;
  renderTable();
  renderStats();
}

// ── Utilities ──────────────────────────────────────────────────────────────

function clearAll() {
  $('csv-input').value = '';
  $('input-search').value = '';
  state.rows = [];
  state.colTypes = [];
  state.sortCol = -1;
  state.search = '';
  state.page = 0;
  $('tbl-head').innerHTML = '';
  $('tbl-body').innerHTML = '';
  $('stats-bar').innerHTML = '';
  $('section-table').classList.add('hidden');
  $('empty-state').classList.remove('hidden');
  $('section-pagination').classList.add('hidden');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const msg = $('copied-msg');
    msg.textContent = t('copiedMsg');
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2000);
  });
}

function showError(msg) {
  const errEl = $('error-msg');
  errEl.textContent = msg;
  errEl.classList.add('show');
  setTimeout(() => errEl.classList.remove('show'), 4000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Start ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
