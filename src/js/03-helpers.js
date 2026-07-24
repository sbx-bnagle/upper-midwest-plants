/* Helpers — parsing, glyph + timeline SVG, fuzzy search, footprint math */
/* ── Pollinator support estimate ─────────────────────────────────────────── */
const POLL_TAXA_KEY = '[DOC] Pollinator Taxa Count (documented floor, not a census)';
function pollCount(p) {
  const doc = p[POLL_TAXA_KEY];
  if (doc != null && doc !== '') {
    const n = parseInt(doc, 10);
    if (!isNaN(n)) return n;
  }
  /* estimate when undocumented: pollinator-friendly plants support ~3 taxa as a floor */
  const ga = (p['Garden Attributes'] || '').toLowerCase();
  if (/attracts (pollinator|butterfl|bee|hummingbird)|pollinator friendly|nectar/.test(ga))
    return 3;
  return 0;
}
function pollIsEst(p) {
  const doc = p[POLL_TAXA_KEY];
  return !(doc != null && doc !== '' && !isNaN(parseInt(doc, 10)));
}

/* ── Footprint (sq ft) from spread; area of circle using mid-spread radius ── */
function footprint(p) {
  const lo = parseFloat(p[K.smin] || p[K.smax] || 0),
    hi = parseFloat(p[K.smax] || p[K.smin] || 0);
  const dia = (lo + hi) / 2 || 0;
  if (!dia) return 0;
  const r = dia / 2;
  return Math.PI * r * r;
}

/* ── Bloom timeline (display) ────────────────────────────────────────────── */
const COLORMAP = [
  ['silver-green', '#9aa890'],
  ['light blue', '#8fb0d0'],
  ['blue-green', '#6f9b8a'],
  ['white', '#dcd6c4'],
  ['cream', '#ddd2b4'],
  ['ivory', '#ddd2b4'],
  ['yellow', '#e0bd34'],
  ['gold', '#d2a024'],
  ['orange', '#d9772b'],
  ['scarlet', '#b23a2e'],
  ['red', '#b23a2e'],
  ['burgundy', '#6e2f3a'],
  ['pink', '#d98aa6'],
  ['rose', '#d07a96'],
  ['magenta', '#b14a82'],
  ['purple', '#7c5a96'],
  ['violet', '#7c5a96'],
  ['lavender', '#a594c0'],
  ['indigo', '#46587f'],
  ['blue', '#5b7fb0'],
  ['mauve', '#9a7d8c'],
  ['maroon', '#6e3140'],
  ['rust', '#9a4a2c'],
  ['copper', '#b06a3a'],
  ['bronze', '#8a6a3a'],
  ['tan', '#b9a06a'],
  ['salmon', '#e08a6a'],
  ['coral', '#e0795a'],
  ['silver', '#b9c0b0'],
  ['green', '#5d7a4e'],
];
function pickColor(s) {
  if (!s) return null;
  s = s.toLowerCase();
  for (const [w, h] of COLORMAP) if (s.includes(w)) return h;
  return null;
}
const MONTHS = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};
function monthIdx(w) {
  w = w.slice(0, 3);
  return w in MONTHS ? MONTHS[w] : null;
}
const PHASE = {
  'early spring': 2,
  'mid spring': 3,
  'late spring': 4,
  'early summer': 5,
  'mid summer': 6,
  'late summer': 7,
  'early fall': 8,
  'mid fall': 9,
  'late fall': 10,
  'early winter': 11,
  'mid winter': 0,
  'late winter': 1,
};
function bloomMonths(bt) {
  if (!bt) return [];
  bt = bt.toLowerCase();
  const set = new Set();
  for (const ph in PHASE) if (bt.includes(ph)) set.add(PHASE[ph]);
  const mns = Object.keys(MONTHS).join('|');
  let mr;
  const re1 = new RegExp('(' + mns + ')[a-z]*\\s*(?:to|-|\\u2013)\\s*(' + mns + ')[a-z]*', 'g');
  while ((mr = re1.exec(bt))) {
    let a = monthIdx(mr[1]),
      b = monthIdx(mr[2]);
    if (a != null && b != null) {
      let i = a;
      for (let n = 0; n < 12; n++) {
        set.add(i);
        if (i === b) break;
        i = (i + 1) % 12;
      }
    }
  }
  const re2 = new RegExp('\\b(' + mns + ')[a-z]*\\b', 'g');
  while ((mr = re2.exec(bt))) {
    const mi = monthIdx(mr[1]);
    if (mi != null) set.add(mi);
  }
  if (!set.size) {
    if (bt.includes('spring')) [2, 3, 4].forEach((x) => set.add(x));
    if (bt.includes('summer')) [5, 6, 7].forEach((x) => set.add(x));
    if (/(fall|autumn)/.test(bt)) [8, 9, 10].forEach((x) => set.add(x));
    if (bt.includes('winter')) [11, 0, 1].forEach((x) => set.add(x));
  }
  return [...set];
}
const TLW = 176,
  SEG = TLW / 12,
  TLH = 26;
function timeline(p) {
  const mo = bloomMonths(p[K.bloomtime]);
  let g = '';
  for (let i = 0; i <= 12; i++) {
    const x = (i * SEG).toFixed(1),
      q = [0, 3, 6, 9, 12].includes(i);
    g += `<line x1="${x}" y1="${q ? 1 : 5}" x2="${x}" y2="21" stroke="${q ? 'var(--tick-q)' : 'var(--tick)'}" stroke-width="1"/>`;
  }
  if (mo.length) {
    const col = pickColor(p[K.bloomcolor]) || 'rgba(35,33,27,.22)';
    mo.forEach((i) => {
      const vis = (i - 2 + 12) % 12;
      g += `<rect x="${(vis * SEG + 1.5).toFixed(1)}" y="6" width="${(SEG - 3).toFixed(1)}" height="11" rx="1.5" fill="${col}"/>`;
    });
  }
  return `<svg class="timeline-svg" viewBox="0 0 ${TLW} ${TLH}" width="${TLW}" height="${TLH}">${g}</svg>`;
}

/* ── Level bars ──────────────────────────────────────────────────────────── */
/* number + 5 stacked bars; the bottom `level` bars take the passed color
   (gold = light, blue = water), the rest stay grey (--lvl-off). Always 5 bars
   so the meters line up; the number states the level. */
function levelBars(level, color, title) {
  const MAX = 5;
  let bars = '';
  for (let i = 0; i < MAX; i++) {
    const on = i >= MAX - level; // fill from the bottom up
    bars += `<i class="lvl-bar${on ? ' on' : ''}"></i>`;
  }
  return `<span class="lvl" title="${title}" style="--lvl-c:${color}"><span class="lvl-num">${level}</span><span class="lvl-bars">${bars}</span></span>`;
}

/* ── Level parsers ───────────────────────────────────────────────────────── */
function parseSunLevel(s) {
  if (!s) return 0;
  const lo = s.toLowerCase();
  let sc = 0;
  if (lo.includes('full sun')) sc += 2;
  if (lo.includes('part sun')) sc += 1;
  if (lo.includes('part shade')) sc -= 1;
  if (lo.includes('full shade')) sc -= 2;
  if (!lo.includes('sun') && !lo.includes('shade')) return 0;
  return sc >= 2 ? 4 : sc === 1 ? 3 : sc === 0 ? 3 : sc === -1 ? 2 : 1;
}
function parseWaterLevel(s) {
  if (!s) return 0;
  const lo = s.toLowerCase().replace(/\//g, ' ');
  if ((lo.includes('wet') || lo.includes('aquatic')) && lo.includes('medium')) return 4;
  if (
    (lo.includes('wet') || lo.includes('aquatic')) &&
    !lo.includes('dry') &&
    !lo.includes('medium') &&
    !lo.includes('average')
  )
    return 5;
  if (lo.includes('medium') && lo.includes('dry')) return 2;
  if (lo.includes('average') && lo.includes('dry')) return 2;
  if (lo.includes('moist') && !lo.includes('well') && !lo.includes('dry')) return 4;
  if (lo.includes('medium') || lo.includes('average') || lo.includes('moist')) return 3;
  if (lo.includes('dry')) return 1;
  return 0;
}

/* ── Fuzzy search ────────────────────────────────────────────────────────── */
function editDist1(a, b) {
  if (a === b) return true;
  const la = a.length,
    lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let d = 0,
    i = 0,
    j = 0;
  while (i < la && j < lb) {
    if (a[i] !== b[j]) {
      if (++d > 1) return false;
      if (la > lb) i++;
      else if (la < lb) j++;
      else {
        i++;
        j++;
      }
    } else {
      i++;
      j++;
    }
  }
  return d + (la - i) + (lb - j) <= 1;
}
function fuzzyMatch(query, target) {
  if (!query) return true;
  if (target.includes(query)) return true;
  const qToks = query.split(/[\s\-\/]+/).filter(Boolean);
  const tToks = target.split(/[\s\-\/\,\.\'\"]+/).filter(Boolean);
  return qToks.every((qt) => {
    if (tToks.some((tt) => tt.startsWith(qt))) return true;
    if (qt.length >= 3)
      return tToks.some(
        (tt) => editDist1(qt, tt.slice(0, qt.length)) || editDist1(qt, tt.slice(0, qt.length + 1)),
      );
    return false;
  });
}
