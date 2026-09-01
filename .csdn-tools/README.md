# CSDN publishing tooling

Derived artifacts for republishing `mcp-guide-zh/` as a CSDN serial. **Nothing here is a
source document** — `articles/*.md` are generated; edit `mcp-guide-zh/` and rebuild:

```bash
python3 .csdn-tools/build.py
```

`build.py` does three things the source pages must not have done to them: applies the serial
title prefix (`MCP 模型上下文协议：…`), rewrites relative links to absolute GitHub URLs (CSDN
pages are standalone), and drops the inter-page nav footers.

- `articles/00-index.md` — the column's index/TOC article. Entries become links as parts publish.
- `articles/NN-*.md` — the 12 serial parts, in reading order.
- `articles/_url_map.json` — local file → published CSDN URL. Source of truth for link rewrites.
- `articles/_manifest.json` — generated part/title listing.

Published with the `csdn-publish` skill. Column: `MCP | 模型上下文协议`.
