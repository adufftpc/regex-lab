# RegexLab — JavaScript Function Reference

This document explains every function in `app.js` and `worker.js` in plain terms.
It is written for programmers who are comfortable with code but may be new to
browser JavaScript and how web pages work.

---

## Background concepts

Before diving in, a few browser ideas that come up repeatedly:

**The DOM.** When a browser loads an HTML file it builds a tree of objects — one
per HTML element — called the Document Object Model. JavaScript can read and
change this tree. When you call `document.getElementById('some-id')` you get back
the JavaScript object that represents that `<div>` (or `<input>`, etc.) on screen.
Changing a property on that object instantly changes what the user sees.

**Event listeners.** Browsers fire "events" when things happen — the user types a
key, clicks a button, scrolls a panel, etc. `element.addEventListener('input', fn)`
means "call `fn` every time the user types in this element". The function `fn`
receives an event object `e` describing what happened.

**innerHTML vs textContent.** `element.innerHTML = '<b>hi</b>'` replaces the
element's contents with rendered HTML. `element.textContent = '<b>hi</b>'`
replaces it with the literal string `<b>hi</b>` — no HTML is parsed. Using
`textContent` where possible is safer because malicious input can't inject HTML.

**Web Workers.** JavaScript normally runs on one thread — the UI thread. If that
thread gets busy (e.g. running a slow regex on a huge file) the whole page freezes.
A Web Worker is a separate JavaScript thread that runs in the background.
The main thread and the worker talk only by passing messages (`postMessage`).
Neither can access the other's variables directly.

**localStorage.** A small key-value store built into the browser, persistent
across page reloads, but isolated per origin. Nothing is ever sent to a server.

---

## `app.js`

`app.js` is split into clearly labelled sections. The functions are documented
below in the order they appear in the file.

---

### Section: THEME

#### `initTheme()` _(IIFE — runs immediately on load)_

An **IIFE** (Immediately Invoked Function Expression) is a function that calls
itself the moment it is defined. Wrapping code in an IIFE keeps its variables
private — `html`, `checkbox`, and `label` are not visible to the rest of the file.

**What it does:**

1. Grabs three DOM elements: the `<html>` root element, the checkbox input in the
   header, and the text label next to it.
2. Reads `localStorage` for the key `'regexlab-theme'`. If nothing was saved
   before it defaults to `'dark'`.
3. Calls `applyTheme()` immediately so the correct theme is applied before the
   first paint (prevents a white flash on dark-preferring users).
4. Listens for the checkbox `change` event. When the user flips the toggle it
   calls `applyTheme('light')` or `applyTheme('dark')` accordingly.

#### `applyTheme(t)` _(inner function of initTheme)_

**Parameters:** `t` — the string `'light'` or `'dark'`.

1. Sets the `data-theme` attribute on `<html>`. The CSS file uses
   `[data-theme="light"] { ... }` to swap all colour variables at once.
2. Updates `checkbox.checked` so the toggle visually reflects the state.
3. Sets `label.textContent` to the theme name.
4. Saves the choice to `localStorage` so it survives a page reload.

---

### Section: RESIZE

#### `initResize()` _(IIFE)_

Sets up the two drag handles that let the user resize panels:
- The **horizontal divider** (`.h-divider`) between the debugger area and the
  help reference panel.
- The **vertical divider** (`.v-divider`) between the test-string panel and the
  match-details panel.

On load it reads the current `clientHeight`/`clientWidth` of the workspace and
sets initial sizes as percentages (64% / 36%). It also re-applies sizes whenever
the browser window is resized.

#### `applyH()` _(inner function of initResize)_

Sets the pixel heights of `debuggerArea` and `helpArea` based on the variable
`debugH`. Clamps the value so neither panel can become smaller than 60 pixels,
preventing the panels from disappearing entirely.

#### `applyW()` _(inner function of initResize)_

Sets the pixel width of `panelMatches` based on the variable `matchW`. Clamps
between 160 px and (total width − 200 px) so there is always room for the
test-string panel alongside it.

#### `drag(divider, bodyCls, getNewSize)` _(inner function of initResize)_

**Parameters:**
- `divider` — the DOM element acting as the drag handle.
- `bodyCls` — a CSS class name added to `<body>` while dragging (`'dragging-row'`
  or `'dragging-col'`). The CSS uses this to change the cursor globally and to
  disable pointer events on everything except the active handle — otherwise the
  mouse could stray into the `<textarea>` and confuse the drag.
- `getNewSize` — a callback that receives the current mouse event and the start
  coordinates, and updates the relevant size variable (`debugH` or `matchW`).

**How dragging works in a browser:**
A `mousedown` on the divider starts the drag. We then listen for `mousemove`
and `mouseup` on `document` — not on the divider itself — because the mouse can
move faster than the element. If we listened only on the divider we would lose
the drag the moment the mouse moved even one pixel outside it. On `mouseup` we
remove both listeners and clean up the class.

---

### Section: HELP DATA

The `HELP` constant is a plain JavaScript object (not a function). It holds the
entire reference table — categories like `anchors`, `quantifiers`, `groups`, etc.
— each containing a label, a colour string, and an array of rows. Each row has a
`token` (the regex syntax), a `desc` (plain-English explanation), and an
`example`. This is purely data; no logic.

---

### Section: HELP PANEL

#### `buildHelpGrid()`

Rebuilds the entire help reference panel from scratch every time the user
switches a category tab or types in the search box.

**Step by step:**

1. Clears the grid container by setting `innerHTML = ''`, removing all previously
   rendered columns.
2. Computes which categories to show: all of them if `activeCategory === 'all'`,
   or just the selected one.
3. For each category, filters the rows against the search query — a row is
   included if `q` appears in the token, description, or example string.
4. For each matching category, creates a column `<div>` with a coloured title,
   then for each row creates a row `<div>` containing three `<span>` elements
   (token, description, example).
5. Attaches a `click` listener to every row. When clicked, the token string is
   **inserted into the regex input at the current cursor position** (see below).
6. Shows the "no results" message if nothing matched; hides it otherwise.

**How cursor-position insertion works:**
Every text `<input>` tracks `selectionStart` and `selectionEnd` — the character
indices of the current cursor or selection. We splice the token into the value
string at those positions, then call `setSelectionRange` to move the cursor to
just after the inserted text, then call `focus()` to keep the input active.

#### Category tab click listener _(anonymous, attached to `#cat-tabs`)_

`e.target.closest('.cat-tab')` walks up the DOM from the clicked element until
it finds an ancestor (or the element itself) that has the class `cat-tab`. This
is needed because the user might click on the border of the button rather than
exactly on the button element.

Removes the `active` class from all tabs, adds it to the clicked one, updates
`activeCategory`, and calls `buildHelpGrid()`.

#### Help search input listener _(anonymous, attached to `#help-search`)_

Updates `searchQuery` on every keystroke. If the user starts typing it forces the
"all" tab to be active (searching makes no sense while a single category is
selected). Then calls `buildHelpGrid()` to re-filter.

---

### Section: FLAGS

#### Flag button click listener _(anonymous, attached to each `.flag-btn`)_

Each flag button (`g`, `m`, `i`, `s`, `u`) has a `data-flag` attribute containing
the flag letter. The listener:
1. Flips the boolean in `flagState` for that letter.
2. Toggles the `active` CSS class on the button so it lights up.
3. Updates the flag display (the `/gm` text to the right of the pattern input).
4. Schedules a fast re-run.

#### `getFlags()`

Reads `flagState` and returns a compact string like `"gmi"` from whichever flags
are currently `true`. Uses `Object.entries()` to iterate the object as `[key,
value]` pairs, filters to those where the value is `true`, maps to just the keys,
and joins them.

#### `updateFlagsDisplay()`

Puts the current flags string into the `<div id="flags-display">` element that
shows `/gm` (or whatever is active) to the right of the regex input. This is
purely cosmetic.

#### `esc(s)`

**Parameters:** `s` — any value.

Converts `s` to a string and replaces the three characters that have special
meaning in HTML:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`

This is used everywhere user-supplied text is placed inside `innerHTML`. Without
this step a user could type `<script>alert(1)</script>` in the test box and have
it execute as JavaScript — a classic XSS attack. After escaping it renders as the
literal characters, not as a script tag.

---

### Section: PATTERN SYNTAX HIGHLIGHTER

#### `highlightPattern(p)`

**Parameters:** `p` — the regex pattern string from the input field.

This function colours each part of the pattern differently — groups are purple,
quantifiers orange, anchors green, and so on. It works by walking through the
pattern one character at a time and wrapping each recognised token in a `<span>`
with a CSS class.

**Why the overlay technique?**
The `<input>` field itself cannot display coloured text — it only shows plain text.
The trick is to render the pattern text into a `<div>` positioned exactly over
the input, with identical font and size. The input is made transparent (`color:
transparent`) so only the coloured spans in the div are visible. The input itself
still receives keyboard focus and captures the caret — it just isn't visually
rendered.

**The tokeniser logic:**

The function maintains a single cursor `i` that steps through the string, and a
boolean `inCC` (inside character class) because inside `[...]` most special
characters lose their meaning and should all be coloured the same way.

- If `inCC` is true: treat backslash sequences (`\d`, `\\`, etc.) and `]` as
  character-class tokens; everything else is also a character-class token.
- `\\x` (backslash + any char): if the second char is one of `bBAZzG` it is an
  **anchor** (`\b`, `\B`, etc.); otherwise an **escape** (`\d`, `\w`, etc.).
- `[` — starts a character class; sets `inCC = true`.
- `(` — opening group. Peeks ahead for `?:`, `?=`, `?!`, `?<=`, `?<!`, or
  `?<name>` to detect non-capturing and lookaround groups. If found, emits a
  `tok-special` span. Otherwise emits a `tok-group` span.
- `)` — closing group, `tok-group`.
- `*`, `+`, `?` — quantifiers. Checks if the next char is `?` (making it lazy).
- `{` — scans ahead for the closing `}` to capture the full `{n,m}` quantifier.
- `^`, `$` — anchors.
- `|` — alternation.
- `.` — wildcard.
- Anything else — literal character.

All character content is run through `esc()` before being placed in HTML so
`<script>` in the pattern doesn't become an actual tag.

---

### Section: WEB WORKER MANAGEMENT

#### `getWorker()`

A lazy initialiser — it creates the Web Worker only on the first call and returns
the same instance on every subsequent call (this pattern is called a singleton).

`new Worker('worker.js')` tells the browser to load `worker.js` in a background
thread. We set `worker.onmessage` to our `onWorkerMessage` handler and
`worker.onerror` to a handler that surfaces the error in the UI and unblocks any
queued run.

#### `onWorkerMessage(e)`

**Parameters:** `e` — the message event from the worker; `e.data` contains the
payload the worker sent.

This is the central handler for everything the worker sends back.

1. **Stale-reply guard:** Each run is assigned an incrementing `runId`. If the
   incoming `id` doesn't match the current `runId` it means this reply is from an
   earlier run that has been superseded — we discard it silently. This prevents old
   results from overwriting newer ones when the user types quickly.
2. Hides the spinner.
3. Marks the worker as no longer busy.
4. If the worker reported an error (bad regex): shows the error message in the UI
   and clears the match panel.
5. If the worker succeeded: stores the matches, updates the status badge, shows the
   truncation warning if needed, renders the highlight overlay, and initialises
   virtual scrolling.
6. Calls `flushPending()` to dispatch any queued run.

#### `flushPending()`

If a run was queued while the worker was busy (stored in `pendingRun`), this
function claims the pending function, clears the slot, and calls it. Clearing
before calling prevents infinite loops if the called function itself queues
another run.

#### `dispatchToWorker(pattern, flags, text)`

**Parameters:** the three pieces of data the worker needs to do its job.

1. If the worker is already busy: stores a closure (a function that will call
   `dispatchToWorker` with these same arguments) in `pendingRun`, overwriting any
   previous pending run. This means only the most recent typing state is ever
   queued — intermediate states are dropped.
2. If the worker is free: marks it as busy, increments `runId`, shows the spinner,
   and sends a message to the worker via `postMessage`. The message is a plain
   object — the browser automatically copies it to the worker thread (this is
   called structured cloning).

---

### Section: DEBOUNCED SCHEDULE

#### `scheduleRun(speed)`

**Parameters:** `speed` — `'fast'` (120 ms delay, used for pattern changes) or
anything else (300 ms delay, used for text changes).

**What is debouncing?**
Without debouncing, every single keystroke would fire `run()` immediately. If the
user types a 20-character pattern that means 20 regex runs — many of which are
partial, invalid patterns. Debouncing means "wait until the user stops typing for
N milliseconds, then run once". `setTimeout` schedules the call; `clearTimeout`
cancels any previously scheduled one. Net result: only the final state fires.

The function keeps two separate timers — one for pattern changes and one for text
changes — so they can be cancelled independently.

---

### Section: MAIN RUN

#### `run()`

The top-level coordinator. Called after debounce, not directly from event listeners.

1. Reads the current pattern and test text.
2. Updates the character and line counts in the summary bar.
3. Calls `highlightPattern()` to recolour the pattern input overlay.
4. Clears any truncation warning (it will be re-applied if needed).
5. If the pattern is empty: sets status to idle, shows the plain (uncoloured) test
   text, clears match cards, and returns early.
6. Tries to compile the pattern on the main thread first — this is cheap and
   immediate. If the pattern is syntactically invalid the browser's `RegExp`
   constructor throws an error; we catch it, show the message, and return early
   without involving the worker at all.
7. Ensures the `g` (global) flag is always present so `exec()` iterates over all
   matches rather than stopping at the first.
8. Hands everything off to `dispatchToWorker()`.

---

### Section: HIGHLIGHT LAYER

#### `renderHighlights(text, activeIdx)`

**Parameters:**
- `text` — the full test-string content.
- `activeIdx` — the index of the match the user has clicked in the match panel
  (`-1` means no match is selected).

Renders coloured `<mark>` elements over the test text to show where matches are.
The technique is the same overlay used for the pattern: an absolutely positioned
`<div>` sits on top of the `<textarea>`, with identical font/size/padding. The
`<textarea>` text is transparent so only the coloured marks show. Scroll events on
the `<textarea>` are mirrored to the div so they stay in sync.

**Large-text shortcut:** If the text exceeds 200 000 characters the overlay is
cleared and a notice is shown instead. Building and parsing hundreds of thousands
of HTML characters is slower than the regex match itself, so for very large files
this trade-off is worth it.

**The rendering algorithm:**

The function walks through the matches in order. Between matches it emits the
plain (escaped) text before the next match. For each match it emits a `<mark>`
element styled with a background colour and an underline — each match index cycles
through 7 colours so adjacent matches are visually distinct.

If the match has capture groups, the function re-scans the match value to find
where each group sits within it and nests additional `<mark>` elements inside the
outer match mark, each with its own colour. This is done with a simple
`String.prototype.indexOf()` scan from left to right — not another regex.

The `activeIdx` match gets an extra `outline` and `brightness` style so the
selected match is visually prominent.

**Why build an array then join?**
String concatenation in a loop (`s += '...'`) forces the engine to allocate a new
string on every iteration. For 10 000 matches that is 10 000 intermediate strings.
Pushing into an array and calling `.join('')` once at the end allocates only one
final string — significantly faster.

---

### Section: VIRTUAL SCROLL — MATCH CARDS

The match panel can contain up to 50 000 results. Creating 50 000 DOM nodes at
once would freeze the browser and consume hundreds of megabytes of memory. Virtual
scrolling solves this: only the cards currently visible in the scroll viewport (plus
a small buffer) exist in the DOM. As the user scrolls, cards that leave the view are
removed and cards that enter are created.

#### `clearMatchCards()`

Resets the match panel to its empty state:
1. Removes all `.match-card` elements from the DOM.
2. Removes the `.vs-spacer` element (explained below).
3. Clears the `vsRendered` map which tracks which card indices are currently rendered.
4. Scrolls the panel back to the top.
5. Resets the empty-state and no-matches visibility.

#### `initVirtualScroll()`

Called after the worker delivers results. Sets up the virtual scroll container:

1. Calls `clearMatchCards()` to start clean.
2. Handles edge cases: no pattern → show empty state; no matches → show "no
   matches" message.
3. Updates the match count in the status bar.
4. Creates a **spacer `<div>`** whose height equals `total matches × vsRowHeight`
   pixels. This spacer has no visual content but gives the scroll container its
   full scrollable height, so the scrollbar looks correct and behaves as if all
   cards were present.
5. Calls `renderVisibleCards()` to populate the first screenful.
6. Attaches a `scroll` listener with `{ passive: true }`. The `passive` flag is a
   browser performance hint meaning "this listener will never call
   `preventDefault()`" — the browser can then scroll immediately without waiting
   for the listener to finish.

#### `onMatchesPanelScroll()`

Called on every scroll event. Simply delegates to `renderVisibleCards()`.

#### `renderVisibleCards()`

The core virtual-scroll engine. Runs on every scroll event.

1. Calculates `firstIdx` and `lastIdx` — the range of match indices that should
   be visible given the current `scrollTop` and panel height, expanded by
   `VS_OVERSCAN = 5` cards in each direction as a buffer so cards are ready before
   they scroll into view.
2. Iterates the `vsRendered` map (currently rendered cards) and removes any whose
   index is outside the visible range.
3. Iterates the visible range and creates cards for indices not yet in `vsRendered`,
   positioning them absolutely within the spacer at `top: index × vsRowHeight`.
4. **Height calibration:** The initial `vsRowHeight` is an estimate (68 px + 7 px
   gap). After the first batch of cards is rendered, we measure the actual height of
   one card using `getBoundingClientRect()` and update `vsRowHeight`. Cards with
   capture groups are taller than plain matches, so this calibration step ensures
   the spacer height and card positions remain accurate.

#### `buildMatchCard(i)`

**Parameters:** `i` — the zero-based index of the match.

Creates and returns a single match card DOM element. Does not insert it into the
DOM — that is done by `renderVisibleCards()`.

The card contains:
- A header row with the match number (coloured), index range, and length.
- The matched value (HTML-escaped), with a coloured left border.
- If the match has capture groups: one row per group showing the group label (with
  its colour dot) and the captured value (HTML-escaped, coloured).

A `click` listener updates `activeMatchIdx`, toggles the `active` class on the
visible rendered cards, and calls `renderHighlights()` to highlight the selected
match in the test panel.

---

### Section: STATUS / SPINNER / TRUNCATION

#### `setStatus(state, msg)`

**Parameters:**
- `state` — one of `'idle'`, `'valid'`, or `'error'`.
- `msg` — error message string (only used when state is `'error'`).

Updates the status pill in the header (the badge that says "no pattern", "valid",
or "error"). Changes the CSS class to apply the correct colour, updates the text,
and optionally shows the error message bar with the text from the browser's
`RegExp` exception.

#### `setSpinner(on)`

**Parameters:** `on` — boolean.

Shows or hides the spinning loader in the header. The spinner is visible while the
worker thread is busy so the user knows a match is in progress.

#### `updateTruncWarning(truncated, count)`

**Parameters:**
- `truncated` — boolean; true if the worker stopped early.
- `count` — how many matches were collected before stopping.

Shows or hides the amber warning bar above the match panel. If results were
truncated it displays a message like "Showing first 50,000 matches — limit
reached."

---

### Section: EVENT LISTENERS

These are the wiring between user actions and the app's logic.

**`regexInput` `input` event:**  
Fires on every keystroke in the pattern field. Calls `scheduleRun('fast')` — a
120 ms debounce. Pattern edits are cheap enough that we can react quickly.

**`testInput` `input` event:**  
Fires on every change to the test-string textarea. Calls `scheduleRun('slow')` —
a 300 ms debounce. Text changes may involve large amounts of data being copied in,
so we give more breathing room.

**`testInput` `scroll` event:**  
The highlight overlay `<div>` is a separate element from the `<textarea>`. When the
user scrolls the textarea, this listener copies `scrollTop` and `scrollLeft` to the
overlay so they stay in perfect alignment. Without this, scrolling the text would
leave the colour marks stuck at the top.

---

## `worker.js`

The worker file is intentionally minimal. It receives one message, does one job,
and sends one reply. It has no access to the DOM, `document`, `window`, or any
browser UI.

---

### Constants

**`MAX_MATCHES = 50_000`** — maximum number of matches to collect. After this
limit is reached the worker stops, sets `truncated = true`, and returns what it
has. This prevents the worker from allocating unbounded memory on patterns that
match every single character.

**`MAX_EXEC_MS = 4_000`** — wall-clock deadline in milliseconds. Before each
iteration the worker checks `Date.now()` against a deadline computed at the start.
If 4 seconds have elapsed it bails out. This is the defence against catastrophic
backtracking — a regex like `(a+)+b` on a string of `a`s can take exponential
time. The main thread stays interactive regardless because the worker is a
separate thread.

---

### `self.onmessage(e)`

`self` inside a Web Worker refers to the worker's global scope (analogous to
`window` in the main thread). `self.onmessage` is a built-in property — the
browser calls it whenever the main thread sends a `postMessage`.

**Parameters:** `e.data` — the message payload: `{ id, pattern, flags, text }`.

**Step by step:**

1. **Compile the regex.** `new RegExp(pattern, flags)` in a `try/catch`. If the
   pattern is invalid (malformed syntax) we send back an error reply and return.
   Note that the main thread already validated the pattern before sending — this
   check is a second line of defence in case of any discrepancy.

2. **Run the match loop.** Standard JavaScript `exec()` loop: `exec()` advances
   an internal cursor (`lastIndex`) each call when the `g` flag is set, returning
   the next match object or `null` when exhausted.

3. **Collect each match** as a plain, serialisable object. Raw `RegExpExecArray`
   objects cannot be transferred to the main thread directly because they have
   special prototype properties. We extract `value`, `index`, `end`, `groups`
   (as a plain array via `Array.from(m).slice(1)`), and `namedGroups` (as a plain
   object via spread `{ ...m.groups }`).

4. **Zero-width match guard.** If a match has zero length (e.g. the pattern `a*`
   matches the empty string between every character) `exec()` would return the same
   position forever — an infinite loop. When `m[0].length === 0` we manually
   advance `lastIndex` by 1 to move past the current position.

5. **Check limits** after each iteration: stop if `MAX_MATCHES` is reached or
   `Date.now()` exceeds the deadline.

6. **Outer `try/catch`** around the entire loop. Some patterns can cause the
   JavaScript engine itself to throw during matching (e.g. stack overflow from
   deep recursion in certain lookbehind implementations). We catch those and send
   an error reply.

7. **Send the reply.** `self.postMessage({ id, type: 'done', matches, truncated })`
   sends the collected matches back to the main thread. The browser performs
   structured cloning — it serialises the object and deserialises it in the main
   thread. For large match arrays this copy has a small cost, but it is dwarfed by
   the match time itself.
