/* Filters — state, match(), pill/month/slider UI builders, sync */
/* ── State ───────────────────────────────────────────────────────────────── */
const H_MAX = 25,
  S_MAX = 20;
const state = {
  q: '',
  tier: '',
  src: '',
  minc: 0,
  haspoll: false,
  lowmaint: false,
  drought: false,
  cats: new Set(),
  attrs: new Set(),
  colors: new Set(),
  habits: new Set(),
  leaves: new Set(),
  flowers: new Set(),
  lights: new Set(),
  waters: new Set(),
  soils: new Set(),
  bloomSel: new Set(),
  foliageSel: new Set(),
  seedheadSel: new Set(),
  hmin: 0,
  hmax: H_MAX,
  smin: 0,
  smax: S_MAX,
};
const sliderResets = []; /* filled by buildDualSlider */

const CHUNK = 60;
let view = [],
  shown = 0;
const $ = (id) => document.getElementById(id);
function srcOf(p) {
  return p[K.src] || p['Source'] || '';
}

/* ── Filter ──────────────────────────────────────────────────────────────── */
function match(p) {
  /* text search */
  if (state.q) {
    const h = ((p[K.com] || '') + ' ' + (p[K.lat] || '')).toLowerCase();
    if (!fuzzyMatch(state.q, h)) return false;
  }
  /* tier / source / C-value / poll */
  if (state.tier && p.tier_group !== state.tier) return false;
  /* boolean */
  if (state.lowmaint && p[K.lowmaint] !== 'TRUE') return false;
  if (state.drought && p[K.drought] !== 'TRUE') return false;
  /* category OR */
  if (state.cats.size > 0 && !state.cats.has(p[K.cat])) return false;
  /* garden attributes OR */
  if (state.attrs.size > 0) {
    const def = GARDEN_ATTRS.filter((a) => state.attrs.has(a.l));
    if (!def.some((a) => a.t(p))) return false;
  }
  /* bloom color OR */
  if (state.colors.size > 0) {
    const bc = (p[K.bloomcolor] || '').toLowerCase();
    const defs = COLOR_GROUPS.filter((c) => state.colors.has(c.l));
    if (!defs.some((c) => c.m(bc))) return false;
  }
  /* habit OR */
  if (state.habits.size > 0 && !state.habits.has(p[K.habit])) return false;
  /* leaf OR */
  if (state.leaves.size > 0) {
    const lf = (p['Leaf'] || '').toLowerCase();
    const defs = LEAF_ATTRS.filter((a) => state.leaves.has(a.l));
    if (!defs.some((a) => a.m.test(lf))) return false;
  }
  /* flower shape OR */
  if (state.flowers.size > 0 && !state.flowers.has(p['Flower Shape'])) return false;
  /* light OR */
  if (state.lights.size > 0) {
    const lo = (p[K.light] || '').toLowerCase();
    const defs = LIGHTS.filter((a) => state.lights.has(a.l));
    if (!defs.some((a) => lo.includes(a.m))) return false;
  }
  /* water OR */
  if (state.waters.size > 0) {
    const wo = (p[K.water] || '').toLowerCase();
    const defs = WATERS.filter((a) => state.waters.has(a.l));
    if (!defs.some((a) => wo.includes(a.m))) return false;
  }
  /* soil OR */
  if (state.soils.size > 0) {
    const so = (p[K.soil] || '').toLowerCase();
    const defs = SOIL_ATTRS.filter((a) => state.soils.has(a.l));
    if (!defs.some((a) => so.includes(a.m))) return false;
  }
  /* bloom months OR */
  if (state.bloomSel.size > 0) {
    const mo = new Set(bloomMonths(p[K.bloomtime]));
    if (![...state.bloomSel].some((m) => mo.has(m))) return false;
  }
  /* fall foliage months OR */
  if (state.foliageSel.size > 0) {
    const mo = new Set(bloomMonths(p['Fall Color Time']));
    if (![...state.foliageSel].some((m) => mo.has(m))) return false;
  }
  /* seedhead months OR */
  if (state.seedheadSel.size > 0) {
    const mo = new Set(bloomMonths(p['Attractive Seedhead Time']));
    if (![...state.seedheadSel].some((m) => mo.has(m))) return false;
  }
  /* height range */
  if (state.hmin > 0 || state.hmax < H_MAX) {
    const lo = parseFloat(p[K.hmin] || p[K.hmax] || 0);
    const hi = parseFloat(p[K.hmax] || p[K.hmin] || 0);
    if (hi < state.hmin || lo > state.hmax) return false;
  }
  /* spread range */
  if (state.smin > 0 || state.smax < S_MAX) {
    const lo = parseFloat(p[K.smin] || p[K.smax] || 0);
    const hi = parseFloat(p[K.smax] || p[K.smin] || 0);
    if (hi < state.smin || lo > state.smax) return false;
  }
  return true;
}

/* ── UI builders ─────────────────────────────────────────────────────────── */
function buildPills(cid, items, stateKey) {
  const el = $(cid);
  items.forEach((item) => {
    const lbl = typeof item === 'string' ? item : item.l;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.val = lbl;
    btn.textContent = lbl.charAt(0).toUpperCase() + lbl.slice(1);
    if (item.css) {
      btn.dataset.bg = item.css;
      btn.dataset.fg = item.txt || '#23211b';
    }
    el.appendChild(btn);
  });
  el.onclick = (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    const val = btn.dataset.val;
    if (state[stateKey].has(val)) {
      state[stateKey].delete(val);
      btn.classList.remove('active');
      if (btn.dataset.bg) {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
      }
    } else {
      state[stateKey].add(val);
      btn.classList.add('active');
      if (btn.dataset.bg) {
        btn.style.background = btn.dataset.bg;
        btn.style.color = btn.dataset.fg;
        btn.style.borderColor = btn.dataset.bg;
      }
    }
    apply();
    syncReset();
  };
}

function buildMonthSel(cid, stateKey) {
  const el = $(cid);
  VIS_MONTHS.forEach((m, vis) => {
    const btn = document.createElement('button');
    btn.className = 'month-segment';
    btn.textContent = m;
    btn.dataset.cal = VIS_CAL[vis];
    el.appendChild(btn);
  });
  el.onclick = (e) => {
    const btn = e.target.closest('.month-segment');
    if (!btn) return;
    const cal = +btn.dataset.cal;
    if (state[stateKey].has(cal)) {
      state[stateKey].delete(cal);
      btn.classList.remove('active');
    } else {
      state[stateKey].add(cal);
      btn.classList.add('active');
    }
    apply();
    syncReset();
  };
}

function buildDualSlider(cid, sMinKey, sMaxKey, lo, hi, step) {
  const wrap = $(cid);
  wrap.innerHTML =
    `<input type="number" class="dual-slider-number" min="${lo}" max="${hi}" value="${lo}" step="${step}">` +
    `<div class="dual-slider-track"><div class="dual-slider-background"></div><div class="dual-slider-fill" id="${cid}-f"></div>` +
    `<input type="range" class="dual-slider-input" id="${cid}-lo" min="${lo}" max="${hi}" value="${lo}" step="${step}">` +
    `<input type="range" class="dual-slider-input" id="${cid}-hi" min="${lo}" max="${hi}" value="${hi}" step="${step}">` +
    `</div><input type="number" class="dual-slider-number" min="${lo}" max="${hi}" value="${hi}" step="${step}">`;
  const [numLo, numHi] = wrap.querySelectorAll('.dual-slider-number');
  const fill = $(`${cid}-f`),
    rLo = $(`${cid}-lo`),
    rHi = $(`${cid}-hi`);
  function upd(doApply) {
    const l = +rLo.value,
      h = +rHi.value,
      range = hi - lo;
    fill.style.left = ((l - lo) / range) * 100 + '%';
    fill.style.width = ((h - l) / range) * 100 + '%';
    numLo.value = l;
    numHi.value = h;
    state[sMinKey] = l;
    state[sMaxKey] = h;
    if (doApply !== false) {
      apply();
      syncReset();
    }
  }
  rLo.oninput = () => {
    if (+rLo.value > +rHi.value) rLo.value = rHi.value;
    upd();
  };
  rHi.oninput = () => {
    if (+rHi.value < +rLo.value) rHi.value = rLo.value;
    upd();
  };
  numLo.onchange = () => {
    rLo.value = Math.max(lo, Math.min(+numLo.value, +rHi.value));
    upd();
  };
  numHi.onchange = () => {
    rHi.value = Math.min(hi, Math.max(+numHi.value, +rLo.value));
    upd();
  };
  sliderResets.push(() => {
    rLo.value = lo;
    rHi.value = hi;
    upd(false);
  });
  upd(false);
}

/* ── Sync / reset ────────────────────────────────────────────────────────── */
function updateCtrlH() {
  document.documentElement.style.setProperty('--ctrl-h', $('controls').offsetHeight + 'px');
}
function syncReset() {
  const any =
    state.lowmaint ||
    state.drought ||
    state.hmin > 0 ||
    state.hmax < H_MAX ||
    state.smin > 0 ||
    state.smax < S_MAX ||
    [
      state.cats,
      state.attrs,
      state.colors,
      state.habits,
      state.leaves,
      state.flowers,
      state.lights,
      state.waters,
      state.soils,
      state.bloomSel,
      state.foliageSel,
      state.seedheadSel,
    ].some((s) => s.size > 0);
  $('reset').classList.toggle('visible', !!(state.q || state.tier || any));
}

function closePane() {
  $('query-pane').classList.remove('open');
  const queryArrow = $('qt-arrow');
  if (queryArrow) queryArrow.innerHTML = '&#9662;';
  $('query-toggle').classList.remove('active');
}
