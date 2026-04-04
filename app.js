/* ══════════════════════════════════════════
   RegexLab — app.js
══════════════════════════════════════════ */

/* ────────────────────────────────────────
   THEME
──────────────────────────────────────── */
(function initTheme() {
  const html     = document.documentElement;
  const checkbox = document.getElementById('theme-checkbox');
  const label    = document.getElementById('theme-label');

  const saved = localStorage.getItem('regexlab-theme') || 'dark';
  applyTheme(saved);

  checkbox.addEventListener('change', () => {
    applyTheme(checkbox.checked ? 'light' : 'dark');
  });

  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    checkbox.checked = (t === 'light');
    label.textContent = t;
    localStorage.setItem('regexlab-theme', t);
  }
})();

/* ────────────────────────────────────────
   RESIZE SYSTEM
   Three drag handles:
   1. .h-divider  — vertical split between debugger-area and help-area
   2. .v-divider  — horizontal split between panel-text and panel-matches
──────────────────────────────────────── */
(function initResize() {
  const workspace     = document.querySelector('.workspace');
  const debuggerArea  = document.querySelector('.debugger-area');
  const helpArea      = document.querySelector('.help-area');
  const hDivider      = document.querySelector('.h-divider');
  const vDivider      = document.querySelector('.v-divider');
  const panelText     = document.querySelector('.panel-text');
  const panelMatches  = document.querySelector('.panel-matches');

  /* ── Initial sizes (px) from percentage defaults ── */
  function totalH()  { return workspace.clientHeight; }
  function totalW()  { return document.querySelector('.bottom-row').clientWidth; }

  let debugH = Math.round(totalH() * 0.64);
  let matchW = Math.round(totalW() * 0.36);

  function applyH() {
    const h = totalH();
    const divH = hDivider.offsetHeight;
    debugH = Math.max(120, Math.min(debugH, h - divH - 60));
    debuggerArea.style.height = debugH + 'px';
    helpArea.style.height     = (h - debugH - divH) + 'px';
  }

  function applyW() {
    const w = totalW();
    matchW = Math.max(160, Math.min(matchW, w - 200));
    panelMatches.style.width = matchW + 'px';
    panelText.style.flex     = '1';
  }

  applyH();
  applyW();
  window.addEventListener('resize', () => { applyH(); applyW(); });

  /* ── horizontal divider drag ── */
  hDivider.addEventListener('mousedown', e => {
    e.preventDefault();
    hDivider.classList.add('dragging');
    document.body.classList.add('dragging-row');
    const startY   = e.clientY;
    const startH   = debuggerArea.offsetHeight;

    function onMove(e) {
      debugH = startH + (e.clientY - startY);
      applyH();
    }
    function onUp() {
      hDivider.classList.remove('dragging');
      document.body.classList.remove('dragging-row');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  /* ── vertical divider drag ── */
  vDivider.addEventListener('mousedown', e => {
    e.preventDefault();
    vDivider.classList.add('dragging');
    document.body.classList.add('dragging-col');
    const startX   = e.clientX;
    const startW   = panelMatches.offsetWidth;

    function onMove(e) {
      matchW = startW - (e.clientX - startX);
      applyW();
    }
    function onUp() {
      vDivider.classList.remove('dragging');
      document.body.classList.remove('dragging-col');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
})();


/* ════════════════════════════════════════
   HELP REFERENCE DATA
════════════════════════════════════════ */
const HELP = {
  anchors: {
    label: 'Anchors',
    color: 'var(--tok-anchor)',
    rows: [
      { token: '^',       desc: 'Start of string / line (with m flag)', example: '^Hello' },
      { token: '$',       desc: 'End of string / line (with m flag)',   example: 'world$' },
      { token: '\\b',     desc: 'Word boundary',                        example: '\\bword\\b' },
      { token: '\\B',     desc: 'Non-word boundary',                    example: '\\Bing' },
      { token: '\\A',     desc: 'Absolute start of string',             example: '\\AStart' },
      { token: '\\Z',     desc: 'Absolute end of string',               example: 'end\\Z' },
    ]
  },
  quantifiers: {
    label: 'Quantifiers',
    color: 'var(--tok-quantifier)',
    rows: [
      { token: '*',       desc: '0 or more (greedy)',             example: 'ab*c' },
      { token: '+',       desc: '1 or more (greedy)',             example: 'ab+c' },
      { token: '?',       desc: '0 or 1 — optional (greedy)',     example: 'colou?r' },
      { token: '{n}',     desc: 'Exactly n times',                example: 'a{3}' },
      { token: '{n,}',    desc: 'n or more times',                example: 'a{2,}' },
      { token: '{n,m}',   desc: 'Between n and m times',          example: 'a{2,4}' },
      { token: '*?',      desc: '0 or more (lazy)',               example: '<.*?>' },
      { token: '+?',      desc: '1 or more (lazy)',               example: '<.+?>' },
      { token: '??',      desc: '0 or 1 (lazy)',                  example: 'a??b' },
      { token: '{n,m}?',  desc: 'Between n and m (lazy)',         example: 'a{2,4}?' },
    ]
  },
  groups: {
    label: 'Groups',
    color: 'var(--tok-group)',
    rows: [
      { token: '(abc)',     desc: 'Capturing group',                  example: '(foo|bar)' },
      { token: '(?:abc)',   desc: 'Non-capturing group',              example: '(?:foo)+' },
      { token: '(?<n>abc)', desc: 'Named capturing group',            example: '(?<year>\\d{4})' },
      { token: '\\1',       desc: 'Backreference to group 1',         example: '(\\w+)\\s\\1' },
      { token: '\\k<n>',    desc: 'Named backreference',              example: '\\k<year>' },
      { token: 'a|b',       desc: 'Alternation — match a or b',       example: 'cat|dog' },
    ]
  },
  charclass: {
    label: 'Character classes',
    color: 'var(--tok-charclass)',
    rows: [
      { token: '[abc]',    desc: 'Any of a, b, or c',              example: '[aeiou]' },
      { token: '[^abc]',   desc: 'Anything except a, b, c',        example: '[^\\d]' },
      { token: '[a-z]',    desc: 'Character range a to z',         example: '[a-zA-Z]' },
      { token: '.',        desc: 'Any character except newline',   example: 'a.b' },
      { token: '[\\s\\S]', desc: 'Any character including newline',example: '[\\s\\S]*' },
    ]
  },
  escapes: {
    label: 'Escapes',
    color: 'var(--tok-escape)',
    rows: [
      { token: '\\d',   desc: 'Digit [0-9]',                     example: '\\d+' },
      { token: '\\D',   desc: 'Non-digit [^0-9]',                example: '\\D+' },
      { token: '\\w',   desc: 'Word char [a-zA-Z0-9_]',          example: '\\w+' },
      { token: '\\W',   desc: 'Non-word char',                   example: '\\W+' },
      { token: '\\s',   desc: 'Whitespace (space, tab, newline)', example: '\\s+' },
      { token: '\\S',   desc: 'Non-whitespace',                  example: '\\S+' },
      { token: '\\t',   desc: 'Tab character',                   example: '\\t' },
      { token: '\\n',   desc: 'Newline character',               example: '\\n' },
      { token: '\\r',   desc: 'Carriage return',                 example: '\\r\\n' },
      { token: '\\.',   desc: 'Literal dot (escaped)',            example: 'www\\.example\\.com' },
      { token: '\\\\',  desc: 'Literal backslash',               example: 'C:\\\\Users' },
    ]
  },
  lookaround: {
    label: 'Lookaround',
    color: 'var(--tok-special)',
    rows: [
      { token: '(?=abc)',   desc: 'Positive lookahead — followed by abc',     example: '\\d(?=px)' },
      { token: '(?!abc)',   desc: 'Negative lookahead — not followed by abc', example: '\\d(?!px)' },
      { token: '(?<=abc)',  desc: 'Positive lookbehind — preceded by abc',    example: '(?<=\\$)\\d+' },
      { token: '(?<!abc)',  desc: 'Negative lookbehind — not preceded by abc',example: '(?<!\\$)\\d+' },
    ]
  },
  flags: {
    label: 'Flags',
    color: '#94a3b8',
    rows: [
      { token: 'g', desc: 'Global — find all matches, not just first', example: '/\\d+/g' },
      { token: 'i', desc: 'Case insensitive — A matches a',            example: '/hello/i' },
      { token: 'm', desc: 'Multiline — ^ and $ match per line',        example: '/^start/m' },
      { token: 's', desc: 'Dot all — . also matches \\n',              example: '/a.b/s' },
      { token: 'u', desc: 'Unicode — full unicode support',            example: '/\\u{1F600}/u' },
      { token: 'd', desc: 'Indices — populate match.indices array',    example: '/ab/d' },
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
      !q ||
      r.token.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q)  ||
      r.example.toLowerCase().includes(q)
    );
    if (!rows.length) return;
    total += rows.length;

    const col = document.createElement('div');
    col.className = 'help-col';

    const title = document.createElement('div');
    title.className = 'help-col-title';
    title.style.color = cat.color;
    title.textContent = cat.label;
    col.appendChild(title);

    rows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'help-row';
      row.title = `Click to insert: ${r.token}`;

      const tok = document.createElement('span');
      tok.className = 'help-token';
      tok.style.color = cat.color;
      tok.textContent = r.token;

      const desc = document.createElement('span');
      desc.className = 'help-desc';
      desc.textContent = r.desc;

      const ex = document.createElement('span');
      ex.className = 'help-example';
      ex.textContent = r.example;

      row.append(tok, desc, ex);

      row.addEventListener('click', () => {
        const inp   = document.getElementById('regex-input');
        const start = inp.selectionStart;
        const end   = inp.selectionEnd;
        inp.value   = inp.value.slice(0, start) + r.token + inp.value.slice(end);
        const pos   = start + r.token.length;
        inp.setSelectionRange(pos, pos);
        inp.focus();
        run();
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
   REGEX ENGINE
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

let currentMatches = [];
let currentRegex   = null;
let flagState = { g: true, m: true, i: false, s: false, u: false };

const COLORS = [
  '#7c6df0','#fb923c','#38bdf8','#4ade80','#f472b6','#facc15','#a78bfa'
];
const COLORS_BG = [
  'rgba(124,109,240,0.22)','rgba(251,146,60,0.22)','rgba(56,189,248,0.22)',
  'rgba(74,222,128,0.22)','rgba(244,114,182,0.22)','rgba(250,204,21,0.18)',
  'rgba(167,139,250,0.22)'
];

document.querySelectorAll('.flag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    flagState[btn.dataset.flag] = !flagState[btn.dataset.flag];
    btn.classList.toggle('active', flagState[btn.dataset.flag]);
    updateFlagsDisplay();
    run();
  });
});

function getFlags()         { return Object.entries(flagState).filter(([,v])=>v).map(([k])=>k).join(''); }
function updateFlagsDisplay(){ flagsDisplay.textContent = '/' + (getFlags() || ''); }
function esc(s)             { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── Pattern syntax highlighter ── */
function highlightPattern(p) {
  if (!p) { regexHL.innerHTML = ''; return; }
  const out = []; let i = 0, inCC = false;

  while (i < p.length) {
    const c = p[i];

    if (inCC) {
      if (c === '\\' && i+1 < p.length) {
        out.push(`<span class="tok-charclass">${esc(c+p[i+1])}</span>`); i += 2;
      } else if (c === ']') {
        out.push(`<span class="tok-charclass">${esc(c)}</span>`); inCC = false; i++;
      } else {
        out.push(`<span class="tok-charclass">${esc(c)}</span>`); i++;
      }
      continue;
    }

    if (c === '\\' && i+1 < p.length) {
      const n = p[i+1];
      const t = ('bBAZzG'.includes(n)) ? 'anchor' : 'escape';
      out.push(`<span class="tok-${t}">${esc(c+n)}</span>`); i += 2; continue;
    }
    if (c === '[') { out.push(`<span class="tok-charclass">${esc(c)}</span>`); inCC = true; i++; continue; }
    if (c === '(') {
      if (p[i+1] === '?') {
        let spec = '';
        if      (p[i+2] === ':')                       spec = '?:';
        else if (p[i+2] === '=')                       spec = '?=';
        else if (p[i+2] === '!')                       spec = '?!';
        else if (p[i+2] === '<' && p[i+3] === '=')    spec = '?<=';
        else if (p[i+2] === '<' && p[i+3] === '!')    spec = '?<!';
        else if (p[i+2] === '<') {
          let j = i+3; while (j < p.length && p[j] !== '>') j++;
          spec = p.slice(i+1, j+1);
        }
        if (spec) { out.push(`<span class="tok-special">(${esc(spec)}</span>`); i += 1 + spec.length; continue; }
      }
      out.push(`<span class="tok-group">${esc(c)}</span>`); i++; continue;
    }
    if (c === ')')            { out.push(`<span class="tok-group">${esc(c)}</span>`);       i++; continue; }
    if ('*+?'.includes(c))   { let q = c; if (p[i+1]==='?'){q+='?';i++;} out.push(`<span class="tok-quantifier">${esc(q)}</span>`); i++; continue; }
    if (c === '{')            { let j=i+1; while(j<p.length&&p[j]!=='}')j++; let q=p.slice(i,j+1); if(p[j+1]==='?'){q+='?';j++;} out.push(`<span class="tok-quantifier">${esc(q)}</span>`); i=j+1; continue; }
    if (c === '^' || c === '$'){ out.push(`<span class="tok-anchor">${esc(c)}</span>`);     i++; continue; }
    if (c === '|')             { out.push(`<span class="tok-alternation">${esc(c)}</span>`); i++; continue; }
    if (c === '.')             { out.push(`<span class="tok-dot">${esc(c)}</span>`);          i++; continue; }
    out.push(`<span class="tok-literal">${esc(c)}</span>`); i++;
  }
  regexHL.innerHTML = out.join('');
}

/* ── Main run ── */
function run() {
  const pattern = regexInput.value;
  const text    = testInput.value;

  charCount.textContent = text.length;
  lineCount.textContent = text.split('\n').length;
  currentMatches = [];

  highlightPattern(pattern);

  if (!pattern) {
    setStatus('idle');
    hlLayer.innerHTML = esc(text);
    renderMatches();
    return;
  }

  let flags = getFlags();
  if (!flags.includes('g')) flags += 'g';

  try {
    currentRegex = new RegExp(pattern, flags);
  } catch(e) {
    setStatus('error', e.message);
    hlLayer.innerHTML = esc(text);
    renderMatches();
    return;
  }

  setStatus('valid');

  const re = new RegExp(pattern, flags);
  let m, iter = 0;
  while ((m = re.exec(text)) !== null && iter < 500) {
    iter++;
    currentMatches.push({
      value:       m[0],
      index:       m.index,
      end:         m.index + m[0].length,
      groups:      m.slice(1),
      namedGroups: m.groups || {}
    });
    if (!flags.includes('g')) break;
    if (m[0].length === 0) re.lastIndex++;
  }

  renderHighlights(text, -1);
  renderMatches();
}

/* ── Highlight test string ── */
function renderHighlights(text, activeIdx) {
  if (!currentMatches.length) { hlLayer.innerHTML = esc(text); return; }

  let html = '', last = 0;

  currentMatches.forEach((m, mi) => {
    html += esc(text.slice(last, m.index));
    const mc  = mi % COLORS.length;
    const mbg = COLORS_BG[mc], mbc = COLORS[mc];
    const aStyle = mi === activeIdx
      ? `outline:1px solid ${mbc};outline-offset:1px;filter:brightness(1.5);` : '';

    if (!m.groups.length) {
      html += `<mark style="background:${mbg};border-radius:2px;color:transparent;border-bottom:2px solid ${mbc};${aStyle}">${esc(m.value||'\u200b')}</mark>`;
    } else {
      const ft = m.value; let inner = '', il = 0;
      m.groups.forEach((g, gi) => {
        if (g == null) return;
        const pos = ft.indexOf(g, il); if (pos === -1) return;
        inner += esc(ft.slice(il, pos));
        const gc = (gi+1) % COLORS.length;
        inner += `<mark style="background:${COLORS_BG[gc]};border-radius:2px;color:transparent;border-bottom:2px solid ${COLORS[gc]};">${esc(g)}</mark>`;
        il = pos + g.length;
      });
      inner += esc(ft.slice(il));
      html += `<mark style="background:${mbg};border-radius:2px;color:transparent;border-bottom:2px solid ${mbc};${aStyle}">${inner}</mark>`;
    }
    last = m.end;
  });

  html += esc(text.slice(last));
  hlLayer.innerHTML = html;
}

/* ── Render match cards ── */
function renderMatches() {
  matchesPanel.querySelectorAll('.match-card').forEach(el => el.remove());
  noMatchesMsg.style.display = 'none';

  if (!regexInput.value) {
    emptyState.style.display = 'flex';
    matchStatus.style.display = 'none';
    return;
  }
  emptyState.style.display = 'none';
  if (!currentRegex) { matchStatus.style.display = 'none'; return; }

  if (!currentMatches.length) {
    noMatchesMsg.style.display = 'block';
    matchCountText.textContent = '0 matches';
    matchStatus.style.display = 'flex';
    matchStatus.className = 'status-pill';
    return;
  }

  matchCountText.textContent = `${currentMatches.length} match${currentMatches.length !== 1 ? 'es' : ''}`;
  matchStatus.style.display = 'flex';
  matchStatus.className = 'status-pill match';

  currentMatches.forEach((m, i) => {
    const col  = COLORS[i % COLORS.length];
    const card = document.createElement('div');
    card.className = 'match-card';

    const namedKeys = Object.keys(m.namedGroups || {});
    const groupRows = m.groups.map((g, gi) => {
      const gcol  = COLORS[(gi+1) % COLORS.length];
      const label = namedKeys[gi] ? `?&lt;${esc(namedKeys[gi])}&gt; · group ${gi+1}` : `group ${gi+1}`;
      const val   = g == null
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
          <span class="match-swatch" style="background:${col}"></span>Match ${i+1}
        </div>
        <div class="match-pos">index ${m.index}–${m.end} · len ${m.value.length}</div>
      </div>
      <div class="match-value" style="border-left:3px solid ${col}">
        ${m.value === '' ? `<span style="color:var(--text3)">(empty match)</span>` : esc(m.value)}
      </div>
      ${groupRows ? `<div class="match-groups">${groupRows}</div>` : ''}
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.match-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      renderHighlights(testInput.value, i);
    });

    matchesPanel.appendChild(card);
  });
}

/* ── Status badge ── */
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

/* ── Event listeners ── */
testInput.addEventListener('input', run);
testInput.addEventListener('scroll', () => {
  hlLayer.scrollTop  = testInput.scrollTop;
  hlLayer.scrollLeft = testInput.scrollLeft;
});
regexInput.addEventListener('input', run);

updateFlagsDisplay();
buildHelpGrid();
run();
