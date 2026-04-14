# CSV Tool

CSV viewer, editor, and converter. Zero dependencies, no build step, runs in any browser.

**Live demo**: https://sen.ltd/portfolio/csv-tool/

## Features

- **Upload or paste** CSV data
- **Auto-detect delimiter**: comma, tab, semicolon, pipe
- **RFC 4180 compliant parser**: quoted fields, escaped quotes, embedded newlines
- **Editable table**: click any cell to edit inline
- **Sort** columns by clicking headers
- **Search** to filter rows
- **Add / remove** rows and columns
- **Column type detection**: number, date, boolean, string
- **Export**: CSV, TSV, JSON, Markdown table, HTML table
- **Pagination** for large files (1000+ rows)
- **Header row toggle**
- Japanese / English UI
- Dark / light theme

## Usage

```bash
# Serve locally
npm run serve
# → http://localhost:8080
```

No install step required. Open `index.html` directly or serve with any static server.

## Tests

```bash
node --test tests/csv.test.js
```

Requires Node.js 18+.

## File structure

```
csv-tool/
├── index.html        # App shell
├── style.css         # Styles (CSS custom properties, dark/light)
├── src/
│   ├── csv.js        # RFC 4180 parser, stringifier, delimiter/type detection
│   ├── export.js     # CSV, TSV, JSON, Markdown, HTML export
│   ├── i18n.js       # ja/en translations
│   └── main.js       # DOM, events, table rendering
└── tests/
    └── csv.test.js   # 76 tests using Node built-in test runner
```

## License

MIT — Copyright (c) 2026 SEN LLC (SEN 合同会社)

<!-- sen-publish:links -->
## Links

- 🌐 Demo: https://sen.ltd/portfolio/csv-tool/
- 📝 dev.to: https://dev.to/sendotltd/a-csv-editor-with-rfc-4180-parsing-auto-delimiter-detection-and-markdown-export-2fcg
<!-- /sen-publish:links -->
