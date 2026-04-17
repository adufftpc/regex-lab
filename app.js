/* ══════════════════════════════════════════
   RegexLab — app.js
══════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
(function initTheme() {
  const html     = document.documentElement;
  const checkbox = document.getElementById('theme-checkbox');
  const label    = document.getElementById('theme-label');
  const saved    = localStorage.getItem('regexlab-theme') || 'light';
  applyTheme(saved);
  checkbox.addEventListener('change', () => applyTheme(checkbox.checked ? 'light' : 'dark'));
  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    checkbox.checked   = (t === 'light');
    label.textContent  = t;
    localStorage.setItem('regexlab-theme', t);
  }
})();


/* ════════════════════════════════════════
   RESIZE
════════════════════════════════════════ */
(function initResize() {
  const workspace    = document.querySelector('.workspace');
  const debuggerArea = document.querySelector('.debugger-area');
  const helpArea     = document.querySelector('.help-area');
  const hDivider     = document.querySelector('.h-divider');
  const vDivider     = document.querySelector('.v-divider');
  const panelText    = document.querySelector('.panel-text');
  const panelMatches = document.querySelector('.panel-matches');

  const bottomRow = () => document.querySelector('.bottom-row');
  let debugH = 0, matchW = 0;

  function applyH() {
    const h    = workspace.clientHeight;
    const divH = hDivider.offsetHeight;
    if (!debugH) debugH = Math.round(h * 0.64);
    debugH = Math.max(120, Math.min(debugH, h - divH - 60));
    debuggerArea.style.height = debugH + 'px';
    helpArea.style.height     = (h - debugH - divH) + 'px';
  }

  function applyW() {
    const w = bottomRow().clientWidth;
    if (!matchW) matchW = Math.round(w * 0.36);
    matchW = Math.max(160, Math.min(matchW, w - 200));
    panelMatches.style.width = matchW + 'px';
    panelText.style.flex     = '1';
  }

  applyH(); applyW();
  window.addEventListener('resize', () => { applyH(); applyW(); });

  function drag(divider, bodyCls, getStartSize, getNewSize) {
    divider.addEventListener('mousedown', e => {
      e.preventDefault();
      divider.classList.add('dragging');
      document.body.classList.add(bodyCls);

      const startX = e.clientX, startY = e.clientY;
      const startSize = getStartSize();

      const move = ev => getNewSize(ev, startX, startY, startSize);
      const up   = ()  => {
        divider.classList.remove('dragging');
        document.body.classList.remove(bodyCls);
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup',   up);
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup',   up);
    });
  }

  // Horizontal Divider Drag
  drag(
      hDivider,
      'dragging-row',
      () => debuggerArea.getBoundingClientRect().height, // Get initial height
      (e, _sx, sy, startH) => {
        debugH = startH + (e.clientY - sy); // Apply total delta to initial size
        applyH();
      }
  );

  // Vertical Divider Drag
  drag(
      vDivider,
      'dragging-col',
      () => panelMatches.getBoundingClientRect().width, // Get initial width
      (e, sx, _sy, startW) => {
        // NOTE: If the panel resizes in the wrong direction (e.g. expands when
        // it should shrink), change the `-` to a `+` on the next line.
        matchW = startW - (e.clientX - sx); // Apply total delta to initial size
        applyW();
      }
  );
})();


/* ════════════════════════════════════════
   HELP DATA
════════════════════════════════════════ */
const HELP = {
  anchors: {
    label: 'Anchors', color: 'var(--tok-anchor)',
    rows: [
      { token: '^',      desc: 'Start of string / line (with m flag)', example: '^Hello'    },
      { token: '$',      desc: 'End of string / line (with m flag)',   example: 'world$'    },
      { token: '\\b',    desc: 'Word boundary',                        example: '\\bword\\b' },
      { token: '\\B',    desc: 'Non-word boundary',                    example: '\\Bing'    },
      { token: '\\A',    desc: 'Absolute start of string',             example: '\\AStart'  },
      { token: '\\Z',    desc: 'Absolute end of string',               example: 'end\\Z'    },
    ]
  },
  quantifiers: {
    label: 'Quantifiers', color: 'var(--tok-quantifier)',
    rows: [
      { token: '*',      desc: '0 or more (greedy)',            example: 'ab*c'    },
      { token: '+',      desc: '1 or more (greedy)',            example: 'ab+c'    },
      { token: '?',      desc: '0 or 1 — optional (greedy)',    example: 'colou?r' },
      { token: '{n}',    desc: 'Exactly n times',               example: 'a{3}'    },
      { token: '{n,}',   desc: 'n or more times',               example: 'a{2,}'   },
      { token: '{n,m}',  desc: 'Between n and m times',         example: 'a{2,4}'  },
      { token: '*?',     desc: '0 or more (lazy)',              example: '<.*?>'   },
      { token: '+?',     desc: '1 or more (lazy)',              example: '<.+?>'   },
      { token: '??',     desc: '0 or 1 (lazy)',                 example: 'a??b'    },
      { token: '{n,m}?', desc: 'Between n and m (lazy)',        example: 'a{2,4}?' },
    ]
  },
  groups: {
    label: 'Groups', color: 'var(--tok-group)',
    rows: [
      { token: '(abc)',      desc: 'Capturing group',              example: '(foo|bar)'       },
      { token: '(?:abc)',    desc: 'Non-capturing group',          example: '(?:foo)+'        },
      { token: '(?<n>abc)',  desc: 'Named capturing group',        example: '(?<year>\\d{4})' },
      { token: '\\1',        desc: 'Backreference to group 1',     example: '(\\w+)\\s\\1'    },
      { token: '\\k<n>',     desc: 'Named backreference',          example: '\\k<year>'       },
      { token: 'a|b',        desc: 'Alternation — match a or b',   example: 'cat|dog'         },
    ]
  },
  charclass: {
    label: 'Character classes', color: 'var(--tok-charclass)',
    rows: [
      { token: '[abc]',    desc: 'Any of a, b, or c',               example: '[aeiou]'   },
      { token: '[^abc]',   desc: 'Anything except a, b, c',         example: '[^\\d]'    },
      { token: '[a-z]',    desc: 'Character range a to z',          example: '[a-zA-Z]'  },
      { token: '.',        desc: 'Any character except newline',    example: 'a.b'       },
      { token: '[\\s\\S]', desc: 'Any character incl. newline',     example: '[\\s\\S]*' },
    ]
  },
  escapes: {
    label: 'Escapes', color: 'var(--tok-escape)',
    rows: [
      { token: '\\d',  desc: 'Digit [0-9]',                      example: '\\d+'              },
      { token: '\\D',  desc: 'Non-digit [^0-9]',                 example: '\\D+'              },
      { token: '\\w',  desc: 'Word char [a-zA-Z0-9_]',           example: '\\w+'              },
      { token: '\\W',  desc: 'Non-word char',                    example: '\\W+'              },
      { token: '\\s',  desc: 'Whitespace (space, tab, newline)',  example: '\\s+'              },
      { token: '\\S',  desc: 'Non-whitespace',                   example: '\\S+'              },
      { token: '\\t',  desc: 'Tab character',                    example: '\\t'               },
      { token: '\\n',  desc: 'Newline character',                example: '\\n'               },
      { token: '\\r',  desc: 'Carriage return',                  example: '\\r\\n'            },
      { token: '\\.',  desc: 'Literal dot',                      example: 'www\\.example\\.com'},
      { token: '\\\\', desc: 'Literal backslash',                example: 'C:\\\\Users'       },
    ]
  },
  lookaround: {
    label: 'Lookaround', color: 'var(--tok-special)',
    rows: [
      { token: '(?=abc)',  desc: 'Positive lookahead',  example: '\\d(?=px)'    },
      { token: '(?!abc)',  desc: 'Negative lookahead',  example: '\\d(?!px)'    },
      { token: '(?<=abc)', desc: 'Positive lookbehind', example: '(?<=\\$)\\d+' },
      { token: '(?<!abc)', desc: 'Negative lookbehind', example: '(?<!\\$)\\d+' },
    ]
  },
  flags: {
    label: 'Flags', color: '#94a3b8',
    rows: [
      { token: 'g', desc: 'Global — find all matches',         example: '/\\d+/g'       },
      { token: 'i', desc: 'Case insensitive — A matches a',    example: '/hello/i'      },
      { token: 'm', desc: 'Multiline — ^ and $ per line',      example: '/^start/m'     },
      { token: 's', desc: 'Dot all — . matches \\n',           example: '/a.b/s'        },
      { token: 'u', desc: 'Unicode — full unicode support',    example: '/\\u{1F600}/u' },
      { token: 'd', desc: 'Indices — match.indices array',     example: '/ab/d'         },
    ]
  }
};


/* ════════════════════════════════════════
   HELP PANEL
════════════════════════════════════════ */
let activeCategory = 'all';
let searchQuery    = '';

function buildHelpGrid() {
  const grid  = document.getElementById('help-grid');
  const noRes = document.getElementById('help-no-results');
  const noQ   = document.getElementById('help-no-q');
  grid.innerHTML = '';

  const q    = searchQuery.toLowerCase().trim();
  const cats = activeCategory === 'all' ? Object.keys(HELP) : [activeCategory];
  let total  = 0;

  cats.forEach(catKey => {
    const cat  = HELP[catKey];
    const rows = cat.rows.filter(r =>
      !q || r.token.toLowerCase().includes(q) ||
            r.desc.toLowerCase().includes(q)  ||
            r.example.toLowerCase().includes(q)
    );
    if (!rows.length) return;
    total += rows.length;

    const col = document.createElement('div');
    col.className = 'help-col';

    const title = document.createElement('div');
    title.className  = 'help-col-title';
    title.style.color = cat.color;
    title.textContent = cat.label;
    col.appendChild(title);

    rows.forEach(r => {
      const row  = document.createElement('div');
      row.className = 'help-row';
      row.title     = `Click to insert: ${r.token}`;

      const tok  = document.createElement('span');
      tok.className  = 'help-token';
      tok.style.color = cat.color;
      tok.textContent = r.token;

      const desc = document.createElement('span');
      desc.className  = 'help-desc';
      desc.textContent = r.desc;

      const ex   = document.createElement('span');
      ex.className  = 'help-example';
      ex.textContent = r.example;

      row.append(tok, desc, ex);
      row.addEventListener('click', () => {
        const inp   = document.getElementById('regex-input');
        const start = inp.selectionStart, end = inp.selectionEnd;
        inp.value   = inp.value.slice(0, start) + r.token + inp.value.slice(end);
        inp.setSelectionRange(start + r.token.length, start + r.token.length);
        inp.focus();
        scheduleRun();
      });
      col.appendChild(row);
    });
    grid.appendChild(col);
  });

  const ok = total > 0;
  grid.style.display  = ok ? 'flex' : 'none';
  noRes.style.display = ok ? 'none' : 'flex';
  noQ.textContent = q;
}

document.getElementById('cat-tabs').addEventListener('click', e => {
  const btn = e.target.closest('.cat-tab');
  if (!btn) return;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.cat;
  buildHelpGrid();
});

document.getElementById('help-search').addEventListener('input', e => {
  searchQuery = e.target.value;
  if (searchQuery) {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    document.querySelector('.cat-tab[data-cat="all"]').classList.add('active');
    activeCategory = 'all';
  }
  buildHelpGrid();
});


/* ════════════════════════════════════════
   DOM REFS
════════════════════════════════════════ */
const regexInput     = document.getElementById('regex-input');
const regexHL        = document.getElementById('regex-hl');
const testInput      = document.getElementById('test-input');
const hlLayer        = document.getElementById('highlighted-layer');
const matchesPanel   = document.getElementById('matches-panel');
const emptyState     = document.getElementById('empty-state');
const noMatchesMsg   = document.getElementById('no-matches-msg');
const regexError     = document.getElementById('regex-error');
const regexStatus    = document.getElementById('regex-status');
const matchStatus    = document.getElementById('match-status');
const matchCountText = document.getElementById('match-count-text');
const flagsDisplay   = document.getElementById('flags-display');
const charCount      = document.getElementById('char-count');
const lineCount      = document.getElementById('line-count');
const truncWarning   = document.getElementById('trunc-warning');
const spinnerEl      = document.getElementById('regex-spinner');


/* ════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════ */
const COLORS = [
  '#7c6df0','#fb923c','#38bdf8','#4ade80','#f472b6','#facc15','#a78bfa'
];
const COLORS_BG = [
  'rgba(124,109,240,0.22)','rgba(251,146,60,0.22)','rgba(56,189,248,0.22)',
  'rgba(74,222,128,0.22)', 'rgba(244,114,182,0.22)','rgba(250,204,21,0.18)',
  'rgba(167,139,250,0.22)'
];

/* Characters of text above which we skip the overlay highlight layer
   (rendering millions of chars as HTML is slower than the match itself) */
const HIGHLIGHT_CHAR_LIMIT = 200_000;

/* Debounce delays */
const DEBOUNCE_FAST = 120;   // ms — pattern changes (cheap to reparse)
const DEBOUNCE_TEXT = 300;   // ms — text changes (potentially large)


/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
let currentMatches  = [];
let currentRegex    = null;
let flagState       = { g: true, m: true, i: false, s: false, u: false };
let runId           = 0;          // increments on every run; lets stale worker replies be ignored
let activeMatchIdx  = -1;
let worker          = null;
let workerBusy      = false;
let pendingRun      = null;       // queued run while worker is busy

/* Virtual-scroll state */
const CARD_HEIGHT   = 68;         // px estimate — refined after first render
const CARD_GAP      = 7;
let   vsRowHeight   = CARD_HEIGHT + CARD_GAP;
let   vsRendered    = new Map();  // idx → card element

/* Debounce timers */
let debouncePatternTimer = null;
let debounceTextTimer    = null;


/* ════════════════════════════════════════
   FLAGS
════════════════════════════════════════ */
document.querySelectorAll('.flag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    flagState[btn.dataset.flag] = !flagState[btn.dataset.flag];
    btn.classList.toggle('active', flagState[btn.dataset.flag]);
    updateFlagsDisplay();
    scheduleRun('fast');
  });
});

function getFlags()          { return Object.entries(flagState).filter(([,v])=>v).map(([k])=>k).join(''); }
function updateFlagsDisplay(){ flagsDisplay.textContent = '/' + (getFlags() || ''); }
function esc(s)              { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }


/* ════════════════════════════════════════
   PATTERN SYNTAX HIGHLIGHTER
════════════════════════════════════════ */
function highlightPattern(p) {
  if (!p) { regexHL.innerHTML = ''; return; }
  const out = []; let i = 0, inCC = false;
  while (i < p.length) {
    const c = p[i];
    if (inCC) {
      if (c === '\\' && i+1 < p.length) { out.push(`<span class="tok-charclass">${esc(c+p[i+1])}</span>`); i+=2; }
      else if (c === ']')                { out.push(`<span class="tok-charclass">${esc(c)}</span>`); inCC=false; i++; }
      else                               { out.push(`<span class="tok-charclass">${esc(c)}</span>`); i++; }
      continue;
    }
    if (c === '\\' && i+1 < p.length) {
      const n = p[i+1];
      out.push(`<span class="tok-${'bBAZzG'.includes(n)?'anchor':'escape'}">${esc(c+n)}</span>`); i+=2; continue;
    }
    if (c === '[') { out.push(`<span class="tok-charclass">${esc(c)}</span>`); inCC=true; i++; continue; }
    if (c === '(') {
      if (p[i+1]==='?') {
        let spec='';
        if      (p[i+2]===':')                    spec='?:';
        else if (p[i+2]==='=')                    spec='?=';
        else if (p[i+2]==='!')                    spec='?!';
        else if (p[i+2]==='<'&&p[i+3]==='=')     spec='?<=';
        else if (p[i+2]==='<'&&p[i+3]==='!')     spec='?<!';
        else if (p[i+2]==='<') { let j=i+3; while(j<p.length&&p[j]!=='>')j++; spec=p.slice(i+1,j+1); }
        if (spec) { out.push(`<span class="tok-special">(${esc(spec)}</span>`); i+=1+spec.length; continue; }
      }
      out.push(`<span class="tok-group">${esc(c)}</span>`); i++; continue;
    }
    if (c===')')           { out.push(`<span class="tok-group">${esc(c)}</span>`);       i++; continue; }
    if ('*+?'.includes(c)) { let q=c; if(p[i+1]==='?'){q+='?';i++;} out.push(`<span class="tok-quantifier">${esc(q)}</span>`); i++; continue; }
    if (c==='{')           { let j=i+1; while(j<p.length&&p[j]!=='}')j++; let q=p.slice(i,j+1); if(p[j+1]==='?'){q+='?';j++;} out.push(`<span class="tok-quantifier">${esc(q)}</span>`); i=j+1; continue; }
    if (c==='^'||c==='$') { out.push(`<span class="tok-anchor">${esc(c)}</span>`);      i++; continue; }
    if (c==='|')           { out.push(`<span class="tok-alternation">${esc(c)}</span>`); i++; continue; }
    if (c==='.')           { out.push(`<span class="tok-dot">${esc(c)}</span>`);         i++; continue; }
    out.push(`<span class="tok-literal">${esc(c)}</span>`); i++;
  }
  regexHL.innerHTML = out.join('');
}


/* ════════════════════════════════════════
   WEB WORKER MANAGEMENT
════════════════════════════════════════ */
function getWorker() {
  if (worker) return worker;
  worker = new Worker('worker.js');
  worker.onmessage = onWorkerMessage;
  worker.onerror   = err => {
    console.error('Worker error', err);
    setStatus('error', 'Worker error: ' + err.message);
    setSpinner(false);
    workerBusy = false;
    flushPending();
  };
  return worker;
}

function onWorkerMessage(e) {
  const { id, type, matches, truncated, message } = e.data;

  /* Ignore replies from stale runs */
  if (id !== runId) return;

  setSpinner(false);
  workerBusy = false;

  if (type === 'error') {
    setStatus('error', message);
    hlLayer.innerHTML = esc(testInput.value);
    clearMatchCards();
    return;
  }

  currentMatches = matches;
  setStatus('valid');
  updateTruncWarning(truncated, matches.length);
  renderHighlights(testInput.value, -1);
  initVirtualScroll();
  flushPending();
}

function flushPending() {
  if (pendingRun) { const fn = pendingRun; pendingRun = null; fn(); }
}

function dispatchToWorker(pattern, flags, text) {
  if (workerBusy) {
    /* Queue only the latest — discard any earlier pending run */
    pendingRun = () => dispatchToWorker(pattern, flags, text);
    return;
  }
  workerBusy = true;
  runId++;
  setSpinner(true);
  getWorker().postMessage({ id: runId, pattern, flags, text });
}


/* ════════════════════════════════════════
   DEBOUNCED SCHEDULE
════════════════════════════════════════ */
function scheduleRun(speed) {
  const delay = speed === 'fast' ? DEBOUNCE_FAST : DEBOUNCE_TEXT;
  clearTimeout(debouncePatternTimer);
  clearTimeout(debounceTextTimer);
  const timer = setTimeout(run, delay);
  if (speed === 'fast') debouncePatternTimer = timer;
  else                  debounceTextTimer    = timer;
}


/* ════════════════════════════════════════
   MAIN RUN
════════════════════════════════════════ */
function run() {
  const pattern = regexInput.value;
  const text    = testInput.value;

  charCount.textContent = text.length.toLocaleString();
  lineCount.textContent = text.split('\n').length.toLocaleString();

  highlightPattern(pattern);
  updateTruncWarning(false, 0);

  if (!pattern) {
    setStatus('idle');
    setSpinner(false);
    hlLayer.innerHTML = text.length <= HIGHLIGHT_CHAR_LIMIT ? esc(text) : '';
    clearMatchCards();
    currentMatches = [];
    return;
  }

  /* Validate pattern on main thread first (cheap) */
  let flags = getFlags();
  if (!flags.includes('g')) flags += 'g';
  try {
    currentRegex = new RegExp(pattern, flags);
  } catch(e) {
    setStatus('error', e.message);
    hlLayer.innerHTML = text.length <= HIGHLIGHT_CHAR_LIMIT ? esc(text) : '';
    clearMatchCards();
    currentMatches = [];
    return;
  }

  /* Hand heavy work off to worker */
  dispatchToWorker(pattern, flags, text);
}


/* ════════════════════════════════════════
   HIGHLIGHT LAYER
   For large text (> HIGHLIGHT_CHAR_LIMIT chars) we skip the
   overlay completely — it's too expensive to build/parse that
   much HTML. Instead we show a notice in the summary bar.
════════════════════════════════════════ */
function renderHighlights(text, activeIdx) {
  const noteEl = document.getElementById('hl-disabled-note');
  if (text.length > HIGHLIGHT_CHAR_LIMIT) {
    hlLayer.innerHTML = '';
    if (noteEl) noteEl.style.display = 'inline';
    return;
  }
  if (noteEl) noteEl.style.display = 'none';

  if (!currentMatches.length) { hlLayer.innerHTML = esc(text); return; }

  /* Build HTML in one pass — avoid repeated string concatenation on huge
     intermediate strings by using an array and joining once at the end. */
  const parts = [];
  let last = 0;

  for (let mi = 0; mi < currentMatches.length; mi++) {
    const m   = currentMatches[mi];
    const mc  = mi % COLORS.length;
    const mbg = COLORS_BG[mc], mbc = COLORS[mc];
    const aStyle = mi === activeIdx
      ? `outline:1px solid ${mbc};outline-offset:1px;filter:brightness(1.5);` : '';
    const baseStyle = `background:${mbg};border-radius:2px;color:transparent;border-bottom:2px solid ${mbc};`;

    parts.push(esc(text.slice(last, m.index)));

    if (!m.groups.length) {
      parts.push(`<mark style="${baseStyle}${aStyle}">${esc(m.value||'\u200b')}</mark>`);
    } else {
      const ft = m.value;
      let inner = [], il = 0;
      for (let gi = 0; gi < m.groups.length; gi++) {
        const g = m.groups[gi];
        if (g == null) continue;
        const pos = ft.indexOf(g, il);
        if (pos === -1) continue;
        inner.push(esc(ft.slice(il, pos)));
        const gc = (gi+1) % COLORS.length;
        inner.push(`<mark style="background:${COLORS_BG[gc]};border-radius:2px;color:transparent;border-bottom:2px solid ${COLORS[gc]};">${esc(g)}</mark>`);
        il = pos + g.length;
      }
      inner.push(esc(ft.slice(il)));
      parts.push(`<mark style="${baseStyle}${aStyle}">${inner.join('')}</mark>`);
    }
    last = m.end;
  }

  parts.push(esc(text.slice(last)));
  hlLayer.innerHTML = parts.join('');
}


/* ════════════════════════════════════════
   VIRTUAL SCROLL — match cards
   Only renders cards visible in the viewport
   + a small overscan buffer. Handles 50 k+
   matches without freezing.
════════════════════════════════════════ */
const VS_OVERSCAN = 5;   // extra cards above/below viewport

function clearMatchCards() {
  /* Remove only rendered cards, keep sentinel/empty-state nodes */
  matchesPanel.querySelectorAll('.match-card').forEach(el => el.remove());
  const spacer = matchesPanel.querySelector('.vs-spacer');
  if (spacer) spacer.remove();
  vsRendered.clear();
  matchesPanel.scrollTop = 0;

  noMatchesMsg.style.display = 'none';
  emptyState.style.display   = regexInput.value ? 'none' : 'flex';
  matchStatus.style.display  = 'none';
}

function initVirtualScroll() {
  clearMatchCards();

  if (!regexInput.value) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  if (!currentMatches.length) {
    noMatchesMsg.style.display = 'block';
    matchCountText.textContent = '0 matches';
    matchStatus.style.display  = 'flex';
    matchStatus.className      = 'status-pill';
    return;
  }

  const total = currentMatches.length;
  matchCountText.textContent = total.toLocaleString() + ' match' + (total !== 1 ? 'es' : '');
  matchStatus.style.display  = 'flex';
  matchStatus.className      = 'status-pill match';

  /* Spacer div gives the scrollbar its full height */
  const spacer = document.createElement('div');
  spacer.className = 'vs-spacer';
  spacer.style.cssText = `height:${total * vsRowHeight}px;position:relative;`;
  matchesPanel.appendChild(spacer);

  renderVisibleCards();
  matchesPanel.addEventListener('scroll', onMatchesPanelScroll, { passive: true });
}

function onMatchesPanelScroll() {
  renderVisibleCards();
}

function renderVisibleCards() {
  const panelH    = matchesPanel.clientHeight;
  const scrollTop = matchesPanel.scrollTop;
  const firstIdx  = Math.max(0, Math.floor(scrollTop / vsRowHeight) - VS_OVERSCAN);
  const lastIdx   = Math.min(
    currentMatches.length - 1,
    Math.ceil((scrollTop + panelH) / vsRowHeight) + VS_OVERSCAN
  );

  /* Remove cards that scrolled out of view */
  for (const [idx, el] of vsRendered) {
    if (idx < firstIdx || idx > lastIdx) {
      el.remove();
      vsRendered.delete(idx);
    }
  }

  /* Add cards that scrolled into view */
  const spacer = matchesPanel.querySelector('.vs-spacer');
  for (let i = firstIdx; i <= lastIdx; i++) {
    if (vsRendered.has(i)) continue;
    const card = buildMatchCard(i);
    card.style.cssText += `position:absolute;top:${i * vsRowHeight}px;left:10px;right:10px;`;
    spacer.appendChild(card);
    vsRendered.set(i, card);

    /* Calibrate row height after first real render */
    if (i === 0) {
      const realHeight = card.getBoundingClientRect().height;
      if (realHeight > 0) vsRowHeight = realHeight + CARD_GAP;
    }
  }
}

function buildMatchCard(i) {
  const m   = currentMatches[i];
  const col = COLORS[i % COLORS.length];
  const card = document.createElement('div');
  card.className = 'match-card';
  if (i === activeMatchIdx) card.classList.add('active');

  const namedKeys = Object.keys(m.namedGroups || {});
  const groupRows = m.groups.map((g, gi) => {
    const gcol  = COLORS[(gi+1) % COLORS.length];
    const label = namedKeys[gi]
      ? `?&lt;${esc(namedKeys[gi])}&gt; · group ${gi+1}` : `group ${gi+1}`;
    const val = g == null
      ? `<span style="color:var(--text3)">undefined</span>`
      : `<span style="color:${gcol}">${esc(String(g))}</span>`;
    return `<div class="group-row">
      <div class="group-label"><span class="group-dot" style="background:${gcol}"></span>${label}</div>
      <div class="group-value">${val}</div>
    </div>`;
  }).join('');

  card.innerHTML = `
    <div class="match-card-header">
      <div class="match-index" style="color:${col}">
        <span class="match-swatch" style="background:${col}"></span>Match ${(i+1).toLocaleString()}
      </div>
      <div class="match-pos">index ${m.index.toLocaleString()}–${m.end.toLocaleString()} · len ${m.value.length}</div>
    </div>
    <div class="match-value" style="border-left:3px solid ${col}">
      ${m.value === '' ? `<span style="color:var(--text3)">(empty match)</span>` : esc(m.value)}
    </div>
    ${groupRows ? `<div class="match-groups">${groupRows}</div>` : ''}
  `;

  card.addEventListener('click', () => {
    activeMatchIdx = i;
    /* Update active state on rendered cards only */
    vsRendered.forEach((el, idx) => el.classList.toggle('active', idx === i));
    renderHighlights(testInput.value, i);
  });

  return card;
}


/* ════════════════════════════════════════
   STATUS / SPINNER / TRUNCATION
════════════════════════════════════════ */
function setStatus(state, msg = '') {
  regexError.style.display = 'none';
  if (state === 'idle') {
    regexStatus.className = 'status-pill';
    regexStatus.querySelector('span').textContent = 'no pattern';
    matchStatus.style.display = 'none';
  } else if (state === 'valid') {
    regexStatus.className = 'status-pill valid';
    regexStatus.querySelector('span').textContent = 'valid';
  } else if (state === 'error') {
    regexStatus.className = 'status-pill error';
    regexStatus.querySelector('span').textContent = 'error';
    regexError.textContent = msg;
    regexError.style.display = 'block';
    matchStatus.style.display = 'none';
    currentRegex = null;
  }
}

function setSpinner(on) {
  spinnerEl.style.display = on ? 'inline-block' : 'none';
}

function updateTruncWarning(truncated, count) {
  if (!truncWarning) return;
  if (truncated) {
    truncWarning.textContent =
      `Showing first ${count.toLocaleString()} matches — limit reached. Narrow your pattern or text.`;
    truncWarning.style.display = 'block';
  } else {
    truncWarning.style.display = 'none';
  }
}


/* ════════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════ */
regexInput.addEventListener('input', () => scheduleRun('fast'));
testInput.addEventListener('input',  () => scheduleRun('slow'));
testInput.addEventListener('scroll', () => {
  hlLayer.scrollTop  = testInput.scrollTop;
  hlLayer.scrollLeft = testInput.scrollLeft;
});


/* ════════════════════════════════════════
   SEED DEMO
════════════════════════════════════════ */
// testInput.value = `The quick brown fox jumps over the lazy dog.
// Email me at hello@example.com or support@regexlab.io
// Phone: +1 (555) 867-5309 or 0031-20-555-1234
// Dates: 2024-03-15, 01/22/2025, March 5th 2024
// URLs: https://www.example.com/path?q=test&page=2
// Hex colors: #FF5733, #abc, #00ff88
// IP addresses: 192.168.1.1 and 10.0.0.255`;
//
// regexInput.value = `([a-zA-Z0-9._%+\\-]+)@([a-zA-Z0-9.\\-]+)\\.([a-zA-Z]{2,})`;

updateFlagsDisplay();
buildHelpGrid();
run();
