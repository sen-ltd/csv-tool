/**
 * i18n.js — Japanese / English translations
 */

export const translations = {
  ja: {
    title: 'CSV ツール',
    subtitle: 'CSV 読み込み・編集・変換ツール',
    pasteLabel: 'CSV を貼り付け',
    pastePlaceholder: 'ここに CSV テキストを貼り付け...',
    parseBtn: '解析する',
    clearBtn: 'クリア',
    sampleBtn: 'サンプル',
    dropZone: 'CSV ファイルをドロップ、またはクリックして選択',
    dropActive: 'ドロップしてください',
    delimiterLabel: '区切り文字',
    delimAuto: '自動検出',
    delimComma: 'カンマ (,)',
    delimTab: 'タブ (\\t)',
    delimSemicolon: 'セミコロン (;)',
    delimPipe: 'パイプ (|)',
    headerRow: 'ヘッダー行として扱う',
    exportBtn: 'エクスポート',
    exportCSV: 'CSV としてダウンロード',
    exportTSV: 'TSV としてダウンロード',
    exportJSON: 'JSON としてダウンロード',
    exportMarkdown: 'Markdown テーブルをコピー',
    exportHTML: 'HTML テーブルをコピー',
    copiedMsg: 'コピーしました！',
    statsRows: '行',
    statsCols: '列',
    statsLabel: '統計',
    typeNumber: '数値',
    typeDate: '日付',
    typeBoolean: '真偽値',
    typeString: '文字列',
    addRow: '行を追加',
    addCol: '列を追加',
    deleteRow: '行を削除',
    deleteCol: '列を削除',
    searchPlaceholder: '検索...',
    noResults: '該当なし',
    sortAsc: '昇順',
    sortDesc: '降順',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    langToggle: 'English',
    emptyState: 'CSV を貼り付けるかファイルをドロップしてください',
    errorParse: '解析エラー: ',
    colHeader: '列',
    pageInfo: '{start}〜{end} / {total} 行',
    prevPage: '前へ',
    nextPage: '次へ',
    pageSizeLabel: '行/ページ',
  },
  en: {
    title: 'CSV Tool',
    subtitle: 'CSV viewer, editor, and converter',
    pasteLabel: 'Paste CSV',
    pastePlaceholder: 'Paste CSV text here...',
    parseBtn: 'Parse',
    clearBtn: 'Clear',
    sampleBtn: 'Sample',
    dropZone: 'Drop CSV file here, or click to select',
    dropActive: 'Drop it!',
    delimiterLabel: 'Delimiter',
    delimAuto: 'Auto detect',
    delimComma: 'Comma (,)',
    delimTab: 'Tab (\\t)',
    delimSemicolon: 'Semicolon (;)',
    delimPipe: 'Pipe (|)',
    headerRow: 'First row is header',
    exportBtn: 'Export',
    exportCSV: 'Download as CSV',
    exportTSV: 'Download as TSV',
    exportJSON: 'Download as JSON',
    exportMarkdown: 'Copy Markdown table',
    exportHTML: 'Copy HTML table',
    copiedMsg: 'Copied!',
    statsRows: 'rows',
    statsCols: 'columns',
    statsLabel: 'Stats',
    typeNumber: 'Number',
    typeDate: 'Date',
    typeBoolean: 'Boolean',
    typeString: 'String',
    addRow: 'Add row',
    addCol: 'Add column',
    deleteRow: 'Delete row',
    deleteCol: 'Delete column',
    searchPlaceholder: 'Search...',
    noResults: 'No results',
    sortAsc: 'Sort ascending',
    sortDesc: 'Sort descending',
    themeLight: 'Light',
    themeDark: 'Dark',
    langToggle: '日本語',
    emptyState: 'Paste CSV or drop a file to get started',
    errorParse: 'Parse error: ',
    colHeader: 'Column',
    pageInfo: '{start}–{end} of {total} rows',
    prevPage: 'Prev',
    nextPage: 'Next',
    pageSizeLabel: 'Rows/page',
  },
};

let currentLang = 'ja';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) currentLang = lang;
}

export function t(key, vars = {}) {
  const str =
    (translations[currentLang] && translations[currentLang][key]) ||
    translations['en'][key] ||
    key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function toggleLang() {
  currentLang = currentLang === 'ja' ? 'en' : 'ja';
  return currentLang;
}
