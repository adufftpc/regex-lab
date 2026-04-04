# RegexLab

A self-contained, offline-capable regex debugger that runs entirely in the browser.  
No server, no build step, no dependencies — open `index.html` and go.

---

## Features

- **Live regex matching** with per-match and per-capture-group colour highlights
- **Syntax highlighting** in the pattern field (groups, quantifiers, anchors, escapes, etc.)
- **Large-text performance** — Web Worker keeps the UI responsive; virtual scrolling handles 50 000+ matches
- **Regex reference panel** with searchable, clickable token library (inserts at cursor)
- **Resizable panels** — drag handles between all three regions
- **Light / dark theme** with preference saved to localStorage
- **Fully offline** — all fonts and assets are local; zero network requests at runtime

---

## File Structure

```
regexlab/
├── index.html       — markup only; no inline scripts or styles
├── style.css        — all styling including light/dark themes
├── app.js           — UI logic, virtual scroll, debounced scheduling
├── worker.js        — regex engine runs off the main thread
├── get-fonts.sh     — one-time font downloader (requires internet)
├── fonts/           — woff2 font files (populated by get-fonts.sh)
│   ├── JetBrainsMono-Regular.woff2
│   ├── JetBrainsMono-Medium.woff2
│   ├── JetBrainsMono-SemiBold.woff2
│   ├── Syne-Regular.woff2
│   ├── Syne-Medium.woff2
│   ├── Syne-SemiBold.woff2
│   └── Syne-Bold.woff2
├── LICENSE.txt
└── README.md
```

---

## Setup

### 1. Download fonts (one-time, requires internet)

```bash
cd regexlab/
chmod +x get-fonts.sh
./get-fonts.sh
```

This fetches the original JetBrains Mono and Syne woff2 files from Google Fonts CDN
and saves them into `fonts/`. The app then works indefinitely without a connection.

### 2. Open in browser

```bash
# Any of these work:
open index.html                        # macOS
xdg-open index.html                    # Linux
start index.html                       # Windows

# Or serve locally (required for Web Workers in some browsers):
python3 -m http.server 8080
# then visit http://localhost:8080
```

> **Note — Web Workers and `file://`**  
> Chrome and some Chromium-based browsers block Web Worker scripts when the page
> is opened via `file://`. If matching appears to freeze on large text, serve the
> folder with any local HTTP server (Python, Node, nginx, etc.).  
> Firefox loads Workers from `file://` without restriction.

---

## Performance Characteristics

| Text size       | Behaviour                                                              |
|-----------------|------------------------------------------------------------------------|
| < 200 000 chars | Full highlight overlay rendered in the test-string panel               |
| ≥ 200 000 chars | Overlay disabled ("highlights disabled for large text" notice shown)   |
| Any size        | Matching runs in a Web Worker; UI stays interactive                    |
| > 50 000 matches| Collection stops; amber warning shown; virtual scroll handles the rest |
| Pattern > 4 s   | Worker deadline fires; partial results returned with truncation notice  |

---

## Security Audit

The application was reviewed for the following risk categories.

### XSS (Cross-Site Scripting)

Every path where user-controlled data reaches the DOM was traced:

| Data source | Sink | Escaped? |
|---|---|---|
| `regexInput.value` (pattern) | `regexHL.innerHTML` (syntax highlight layer) | ✅ Every character goes through `esc()` before being wrapped in `<span>` |
| `testInput.value` (test text) | `hlLayer.innerHTML` (highlight overlay) | ✅ All literal text segments go through `esc()`; match values go through `esc()` |
| `m.value` (match content) | `card.innerHTML` | ✅ `esc(m.value)` |
| `m.groups[i]` (capture group value) | `card.innerHTML` | ✅ `esc(String(g))` |
| `m.namedGroups` keys (e.g. `(?<name>...)`) | `card.innerHTML` | ✅ `esc(namedKeys[gi])` |
| Error message from `new RegExp()` | `regexError.textContent` | ✅ `.textContent` — no HTML parsing |
| Search query in help panel | `noQ.textContent` | ✅ `.textContent` — no HTML parsing |
| Truncation count | `truncWarning.textContent` | ✅ `.textContent` — integer, formatted with `.toLocaleString()` |
| Theme preference from localStorage | `html.setAttribute('data-theme', t)` | ✅ Value is always the result of `checkbox.checked ? 'light' : 'dark'` — never the raw stored string |

**Result: no XSS vectors found.** All user-controlled strings are either passed through `esc()` (which encodes `&`, `<`, `>`) before reaching `innerHTML`, or written to `.textContent` which performs no HTML interpretation.

The colour values injected into `style=""` attributes (`col`, `gcol`) are always sourced from the hardcoded `COLORS` constant array — they are never derived from user input.

### `eval` and dynamic code execution

```
eval:            not used
new Function():  not used
setTimeout(string): not used
setInterval(string): not used
import():        not used
```

**Result: no dynamic code execution.**

### Network requests

```
fetch:           not used
XMLHttpRequest:  not used
WebSocket:       not used
<script src>:    only app.js and worker.js — both local
<link href>:     only style.css — local
```

**Result: zero network requests at runtime.** The app is fully air-gap safe once fonts are downloaded.

### localStorage

Only one key is used: `regexlab-theme`, storing the string `"light"` or `"dark"`.  
The stored value is **never** directly written to the DOM. It is read once at startup and passed through `applyTheme()`, which only ever calls `html.setAttribute('data-theme', t)` where `t` is the checked boolean result, not the raw stored value.

**Result: localStorage use is safe and minimal.**

### Web Worker boundary

Messages sent **to** the worker contain: `{ id: number, pattern: string, flags: string, text: string }`.  
The worker validates the pattern with `new RegExp()` in a try/catch and only returns serialisable plain objects — no DOM references, no functions.

Messages received **from** the worker are gated by `if (id !== runId) return;` to discard stale replies. The `type` field is checked against known values (`'done'`, `'error'`) before acting.

**Result: worker message boundary is properly validated.**

### Catastrophic backtracking (ReDoS)

The worker enforces a **4-second wall-clock deadline** (`MAX_EXEC_MS = 4000`). If a pattern causes catastrophic backtracking on the provided text the worker will bail out, return whatever matches it collected, and display a truncation warning. The main thread remains interactive throughout.

**Result: ReDoS is mitigated.** A sufficiently adversarial pattern on large text can consume up to 4 seconds of CPU in the worker thread, but cannot hang the browser.

### Content Security Policy

No CSP header is set because the app is file-served without a configurable HTTP layer.  
If deploying behind a web server, the following CSP is appropriate:

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self';
  font-src 'self';
  worker-src 'self';
```

This allows no inline scripts, no `eval`, no external resources — consistent with how the app is written.

---

## Browser Compatibility

| Browser | Version | Notes |
|---|---|---|
| Chrome / Edge | 80+ | Full support; serve via HTTP for Workers |
| Firefox | 79+ | Full support including `file://` Workers |
| Safari | 15+ | Full support |

---

## License

MIT — see [LICENSE.txt](LICENSE.txt).
