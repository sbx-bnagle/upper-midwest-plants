/* Inventory — selection map, slide-out pane, stats, pies, md download */
const inventory = new Map(); /* __id -> qty */
/* ── Seasonal color pies ─────────────────────────────────────────────────── */
const SEASONS = [
  { l: 'Spring', m: [2, 3, 4] },
  { l: 'Summer', m: [5, 6, 7] },
  { l: 'Fall', m: [8, 9, 10] },
  { l: 'Winter', m: [11, 0, 1] },
];
const FOLIAGE_CSS = '#7d9b6a';
/* fraction of a blooming plant's footprint that reads as flower color at peak */
const BLOOM_FRACTION = 0.45;
function colorGroupOf(bc) {
  if (!bc) return null;
  bc = bc.toLowerCase();
  for (const c of COLOR_GROUPS) if (c.m(bc)) return c;
  return null;
}
function svgPie(slices, size) {
  const total = slices.reduce((a, s) => a + s.value, 0),
    r = size / 2,
    cx = r,
    cy = r;
  if (total <= 0)
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="var(--lvl-off)"/></svg>`;
  if (slices.filter((s) => s.value > 0).length === 1) {
    const only = slices.find((s) => s.value > 0);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="${only.css}"/></svg>`;
  }
  let ang = -Math.PI / 2,
    paths = '';
  slices.forEach((sl) => {
    if (sl.value <= 0) return;
    const frac = sl.value / total,
      a2 = ang + frac * 2 * Math.PI;
    const x1 = cx + (r - 1) * Math.cos(ang),
      y1 = cy + (r - 1) * Math.sin(ang);
    const x2 = cx + (r - 1) * Math.cos(a2),
      y2 = cy + (r - 1) * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    paths += `<path d="M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r - 1} ${r - 1} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${sl.css}"/>`;
    ang = a2;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

function renderColorPies(items) {
  const el = $('inv-colors');
  if (!items.length) {
    el.innerHTML = '';
    return;
  }
  const legendUsed = new Map(); /* label -> css */
  let cells = '';
  SEASONS.forEach((se) => {
    const seSet = new Set(se.m);
    const colorMass = new Map();
    /* css -> value */ let green = 0;
    items.forEach((p) => {
      const mass = footprint(p) * inventory.get(p.__id);
      if (!mass) return;
      const blooming = bloomMonths(p[K.bloomtime]).some((m) => seSet.has(m));
      const cg = blooming ? colorGroupOf(p[K.bloomcolor]) : null;
      if (cg) {
        colorMass.set(cg.css, (colorMass.get(cg.css) || 0) + mass * BLOOM_FRACTION);
        green += mass * (1 - BLOOM_FRACTION);
        legendUsed.set(cg.l, cg.css);
      } else green += mass;
    });
    const slices = [...colorMass.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([css, v]) => ({ css, value: v }));
    slices.push({ css: FOLIAGE_CSS, value: green });
    const total = slices.reduce((a, s) => a + s.value, 0);
    const colorPct = total > 0 ? Math.round(((total - green) / total) * 100) : 0;
    const sub = colorPct > 0 ? `${colorPct}% color` : 'all foliage';
    cells += `<div class="pie-cell">${svgPie(slices, 76)}<span class="pie-name">${se.l}</span><span class="pie-color-note">${sub}</span></div>`;
  });
  let legend =
    '<span class="legend-item"><span class="legend-swatch" style="background:' +
    FOLIAGE_CSS +
    '"></span>Foliage</span>';
  [...legendUsed.entries()].forEach(([l, css]) => {
    legend += `<span class="legend-item"><span class="legend-swatch" style="background:${css}"></span>${l}</span>`;
  });
  el.innerHTML = `<span class="query-label">Seasonal Color</span><div class="pie-row">${cells}</div><div class="pie-legend">${legend}</div>`;
}

/* ── Inventory engine ────────────────────────────────────────────────────── */
function setQty(id, val) {
  const n = Math.max(0, parseInt(val, 10) || 0);
  if (n > 0) inventory.set(id, n);
  else inventory.delete(id);
  /* keep any duplicate qty inputs (row + pane) in sync */
  document.querySelectorAll(`.quantity-input[data-pid="${id}"]`).forEach((inp) => {
    if (inp.value != String(n || '')) inp.value = n || '';
    inp.classList.toggle('has-quantity', n > 0);
  });
  updateSpineCount();
  renderInventory();
}

function updateSpineCount() {
  let species = inventory.size;
  $('spine-count').textContent = species;
  const dl = $('inv-download');
  if (dl) dl.disabled = species === 0;
}

const MNAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function renderInventory() {
  const ids = [...inventory.keys()];
  const items = ids.map((id) => PLANTS[id]);
  /* ---- stats ---- */
  let totalPlants = 0,
    sqft = 0,
    pollSet = new Set(),
    pollEstimated = false,
    pollNum = 0;
  const bloomCover = new Array(12).fill(0);
  items.forEach((p) => {
    const q = inventory.get(p.__id);
    totalPlants += q;
    sqft += footprint(p) * q;
    const pc = pollCount(p);
    pollNum += pc;
    if (pollIsEst(p) && pc > 0) pollEstimated = true;
    /* distinct pollinator taxa names where documented */
    const pd = p['[DOC] Pollinators Supported (documented, partial)'];
    if (pd)
      pd.split(/[;,]/).forEach((t) => {
        t = t
          .trim()
          .toLowerCase()
          .replace(/\(.*?\)/g, '')
          .trim();
        if (t && t.length > 2) pollSet.add(t);
      });
    bloomMonths(p[K.bloomtime]).forEach((m) => bloomCover[m]++);
  });
  const taxaShown = pollSet.size > 0 ? pollSet.size : pollNum;
  const statsEl = $('inv-stats');
  if (!items.length) {
    statsEl.innerHTML = '';
    $('inv-season').innerHTML = '';
    $('inv-colors').innerHTML = '';
    $('inv-list').innerHTML =
      '<div class="inventory-empty">No plants selected yet. Use the Qty field at the left of any row to add plants to your garden inventory.</div>';
    return;
  }
  statsEl.innerHTML =
    `<div class="stat"><span class="stat-number">${inventory.size}</span><span class="stat-label">Species</span><span class="stat-subtext">${totalPlants} plant${totalPlants === 1 ? '' : 's'} total</span></div>` +
    `<div class="stat"><span class="stat-number">${Math.round(sqft)}</span><span class="stat-label">Sq ft covered</span><span class="stat-subtext">at mature spread</span></div>` +
    `<div class="stat"><span class="stat-number">${taxaShown}${pollEstimated ? '+' : ''}</span><span class="stat-label">Pollinator taxa</span><span class="stat-subtext">${pollEstimated ? 'documented + estimated' : 'documented floor'}</span></div>`;
  /* ---- seasonal gap strip (Mar–Feb visual order) ---- */
  let cells = '',
    gaps = [];
  for (let vis = 0; vis < 12; vis++) {
    const cal = VIS_CAL[vis],
      on = bloomCover[cal] > 0;
    if (!on) gaps.push(MNAMES[cal]);
    cells += `<div class="gap-cell${on ? ' has-bloom' : ''}" title="${bloomCover[cal]} in bloom">${VIS_MONTHS[vis]}</div>`;
  }
  let note;
  if (!gaps.length) note = '<span>Year-round bloom coverage. No seasonal gaps.</span>';
  else
    note = `<span><b>Bloom gaps:</b> ${gaps.join(', ')}. Consider adding plants that bloom then.</span>`;
  $('inv-season').innerHTML =
    `<span class="query-label">Seasonal Bloom Coverage</span><div class="gap-row">${cells}</div><div class="gap-note">${note}</div>`;
  /* ---- seasonal color pies ---- */
  renderColorPies(items);
  /* ---- shared-display item table ---- */
  const sorted = items.slice().sort((a, b) => {
    const ra = tierRank(a.tier_group),
      rb = tierRank(b.tier_group);
    if (ra !== rb) return ra - rb;
    const na = (a[K.com] || a[K.lat] || '').toLowerCase(),
      nb = (b[K.com] || b[K.lat] || '').toLowerCase();
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
  const wrap = $('inv-list');
  const ul = document.createElement('ul');
  ul.className = 'plant-list inventory-plant-list';
  const head = $('cols-head').cloneNode(true);
  head.removeAttribute('id');
  ul.appendChild(head);
  const fr = document.createDocumentFragment();
  sorted.forEach((p) => fr.appendChild(rowEl(p)));
  ul.appendChild(fr);
  wrap.innerHTML = '';
  wrap.appendChild(ul);
}

function openInv() {
  $('inv-pane').classList.add('open');
  $('inv-overlay').classList.add('show');
}
function closeInv() {
  $('inv-pane').classList.remove('open');
  $('inv-overlay').classList.remove('show');
}

function downloadInventoryMd() {
  const ids = [...inventory.keys()];
  if (!ids.length) return;
  const items = ids
    .map((id) => PLANTS[id])
    .sort((a, b) => {
      const ra = tierRank(a.tier_group),
        rb = tierRank(b.tier_group);
      if (ra !== rb) return ra - rb;
      const na = (a[K.com] || a[K.lat] || '').toLowerCase(),
        nb = (b[K.com] || b[K.lat] || '').toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
  let md = '# Garden Inventory\n\n';
  items.forEach((p) => {
    const slug =
      p['Slug'] ||
      (p[K.lat] || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') ||
      p.__id;
    const qty = inventory.get(p.__id);
    md += `- ${slug}${qty > 1 ? ` (x${qty})` : ''}\n`;
  });
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'garden-inventory.md';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 100);
}
