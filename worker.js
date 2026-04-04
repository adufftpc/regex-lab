/* ══════════════════════════════════════════
   RegexLab — worker.js
   Runs regex matching entirely off the main
   thread so the UI never freezes on large text.
══════════════════════════════════════════ */

/* Hard limits — prevent runaway patterns on multi-MB text */
const MAX_MATCHES  = 50_000;   // stop collecting after this many hits
const MAX_EXEC_MS  = 4_000;    // bail out if matching takes > 4 s

self.onmessage = function (e) {
  const { id, pattern, flags, text } = e.data;

  /* ── Validate / compile ── */
  let re;
  try {
    re = new RegExp(pattern, flags);
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err.message });
    return;
  }

  /* ── Run ── */
  const matches  = [];
  const deadline = Date.now() + MAX_EXEC_MS;
  let   m;
  let   truncated = false;

  try {
    while ((m = re.exec(text)) !== null) {
      matches.push({
        value:       m[0],
        index:       m.index,
        end:         m.index + m[0].length,
        groups:      Array.from(m).slice(1),       // serialisable
        namedGroups: m.groups ? { ...m.groups } : {}
      });

      if (!flags.includes('g')) break;
      if (m[0].length === 0) re.lastIndex++;       // avoid infinite loop on zero-width match

      if (matches.length >= MAX_MATCHES) { truncated = true; break; }
      if (Date.now() > deadline)         { truncated = true; break; }
    }
  } catch (err) {
    /* Some patterns (catastrophic backtracking) may throw on certain engines */
    self.postMessage({ id, type: 'error', message: 'Regex execution error: ' + err.message });
    return;
  }

  self.postMessage({ id, type: 'done', matches, truncated });
};
