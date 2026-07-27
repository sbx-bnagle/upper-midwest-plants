/* Render — shared row component, table apply, detail + edit mode, export */

/* ── Render ──────────────────────────────────────────────────────────────── */
/* Fixed listing order: nativity tier (Native first), then common name A–Z.
   Column sorting was removed; this ordering is no longer user-configurable. */
function cmp(a, b) {
  const ra = tierRank(a.tier_group),
    rb = tierRank(b.tier_group);
  if (ra !== rb) return ra - rb;
  const na = (a[K.com] || a[K.lat] || '').toLowerCase(),
    nb = (b[K.com] || b[K.lat] || '').toLowerCase();
  return na < nb ? -1 : na > nb ? 1 : 0;
}
function esc(s) {
  return (s == null ? '' : String(s)).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
}
function rng(a, b) {
  a = (a || '').trim();
  b = (b || '').trim();
  if (!a && !b) return '';
  if (a && b) return a === b ? a : `${a}\u2013${b}`;
  return a || b;
}

function rowEl(p) {
  const li = document.createElement('li');
  li.className = 'plant-row';
  const cm = esc(p[K.com]),
    lat = esc(p[K.lat]);
  const name = cm
    ? `<span class="common-name">${cm}</span><span class="botanical-name">${lat}</span>`
    : `<span class="common-name botanical-name" style="font-style:italic">${lat}</span>`;
  let tier = esc(p.tier_group) || '',
    cat = esc(p[K.cat]) || '';
  if (p.tier_group === 'Native') tier = '<mark>Native</mark>';
  const lv = parseSunLevel(p[K.light]),
    wv = parseWaterLevel(p[K.water]);
  const qv = inventory.get(p.__id) || '';
  li.innerHTML =
    `<div class="cell column-quantity"><input type="number" min="0" step="1" class="quantity-input${qv ? ' has-quantity' : ''}" value="${qv}" data-pid="${p.__id}"></div>` +
    `<div class="cell-group cell-group-primary">` +
    `<div class="cell column-name">${name}</div>` +
    `<div class="cell column-character">${cat ? `<span class="category-label">${cat}</span>` : ''}<span class="tier-label">${tier}</span></div>` +
    `</div>` +
    `<div class="cell-group cell-group-requirements">` +
    // `<div class="cell flag-cell column-drought">${p[K.drought] === 'TRUE' ? '<span class="mobile-label">Drought</span>&#9786;' : ''}</div>` +
    // `<div class="cell flag-cell">${p[K.lowmaint] === 'TRUE' ? '<span class="mobile-label">Low maint</span>&#9786;' : ''}</div>` +
    `<div class="cell column-requirement column-soil"><span class="mobile-label">Soil</span>${esc(p[K.soil]) || '<span class="empty-cell">&middot;</span>'}</div>` +
    `<div class="cell column-icon"><span class="mobile-label">Light</span>${lv ? levelBars(lv, 'var(--lvl-gold)', esc(p[K.light]), 4) : '<span class="empty-cell">&middot;</span>'}</div>` +
    `<div class="cell column-icon"><span class="mobile-label">Water</span>${wv ? levelBars(wv, 'var(--lvl-blue)', esc(p[K.water]), 5) : '<span class="empty-cell">&middot;</span>'}</div>` +
    `</div>` +
    `<div class="cell-group cell-group-design">` +
    `<div class="cell column-dimension column-width"><span class="mobile-label">Width</span>${esc(rng(p[K.smin], p[K.smax])) || '<span class="empty-cell">&middot;</span>'}</div>` +
    `<div class="cell column-dimension"><span class="mobile-label">Height</span>${esc(rng(p[K.hmin], p[K.hmax])) || '<span class="empty-cell">&middot;</span>'}</div>` +
    `<div class="cell column-habit"><span class="mobile-label">Habit</span>${esc(p[K.habit]) || '<span class="empty-cell">&middot;</span>'}</div>` +
    `<div class="cell column-season">${timeline(p)}</div>` +
    `</div>`;
  const qi = li.querySelector('.quantity-input');
  qi.onclick = (e) => e.stopPropagation();
  qi.oninput = (e) => {
    setQty(p.__id, e.target.value);
    e.target.classList.toggle('has-quantity', !!(+e.target.value > 0));
  };
  li.onclick = (e) => {
    if (e.target.closest('.detail-wrap')) return;
    toggle(li, p);
  };
  return li;
}

function apply() {
  view = PLANTS.filter(match).sort(cmp);
  shown = 0;
  $('plant-list')
    .querySelectorAll('li.plant-row')
    .forEach((li) => li.remove());
  more();
}
function more() {
  const fr = document.createDocumentFragment();
  view.slice(shown, shown + CHUNK).forEach((p) => fr.appendChild(rowEl(p)));
  $('plant-list').appendChild(fr);
  shown += Math.min(CHUNK, view.length - shown);
}

function toggle(li, p) {
  const existing = li.querySelector(':scope > .detail-wrap');
  if (existing) {
    existing.remove();
    return;
  }
  const dw = document.createElement('div');
  dw.className = 'detail-wrap';
  renderDetail(dw, p, false);
  li.appendChild(dw);
}

/* Grouped drawer layout. Each field: k = data key; label overrides the shown
   name; range = [minKey,maxKey] shown as a span; bool = TRUE\u2192check / else \u2717;
   full = span the whole grid row. Fields absent here are not displayed;
   Source, Slug, C/W, and the CSR fields are intentionally omitted. */
const DETAIL_TIERS = [
  {
    // untitled: the intro group sits directly under the name + blurb
    title: '',
    fields: [
      { k: 'Category' },
      { k: 'Genus' },
      { k: 'Growth Rate/Lifespan' },
      { k: 'Zone' },
      // shown under the name when reading; still editable in edit mode
      { k: 'Summary Blurb', full: true, editOnly: true },
    ],
  },
  {
    title: 'Native status',
    fields: [
      { k: 'Native Status Tier' },
      { k: 'Cultivar (Y/N)', label: 'Cultivar' },
      { k: 'Native Status - Basis' },
      { k: 'Native to (Level II Ecoregion)' },
    ],
  },
  {
    title: 'Properties',
    fields: [
      { k: 'Habit' },
      { k: 'Leaf' },
      { k: 'Flower' },
      { k: 'Flower Shape' },
      { label: 'Height', range: ['Height, Min (ft)', 'Height, Max (ft)'] },
      { label: 'Spread', range: ['Spread, Min (ft)', 'Spread, Max (ft)'] },
      {
        label: 'Bloom',
        calc: (p) => joinParts(p[K.bloomcolor], p[K.bloomtime]),
        editKeys: [K.bloomcolor, K.bloomtime],
      },
      { k: 'Attractive Seedhead Time' },
      {
        label: 'Fall Color',
        calc: (p) => joinParts(p['Fall Leaf Color'], p['Fall Color Time']),
        editKeys: ['Fall Leaf Color', 'Fall Color Time'],
      },
      { k: 'Drought Resistant', bool: true },
      { k: 'Low Maintenance', bool: true },
      {
        label: 'Pollinators Supported',
        full: true,
        // count first, then the documented names
        calc: (p) => {
          const n = p[POLL_TAXA_KEY],
            names = p['[DOC] Pollinators Supported (documented, partial)'];
          const cnt = n != null && String(n).trim() !== '' ? String(n).trim() : '';
          const list = names != null && String(names).trim() !== '' ? String(names).trim() : '';
          if (!cnt && !list) return '';
          if (cnt && list) return `${cnt} — ${list}`;
          return cnt || list;
        },
        editKeys: [POLL_TAXA_KEY, '[DOC] Pollinators Supported (documented, partial)'],
      },
      { k: 'Garden Attributes', label: 'Additional Attributes', full: true },
    ],
  },
  {
    title: 'Requirements',
    fields: [
      { k: 'Water Req', label: 'Water' },
      { k: 'Soil Req', label: 'Soil' },
      { k: 'Light Req', label: 'Light' },
    ],
  },
  {
    title: 'Detailed description',
    fields: [{ k: 'Detailed Description', label: 'Detailed Description', full: true }],
  },
  {
    title: 'Maintenance',
    // read mode renders resolved tasks (archetype + genus + plant); edit mode
    // exposes the raw per-plant fields below
    custom: 'maintenance',
    fields: [
      { k: 'Maintenance, General', label: 'General', full: true },
      { k: 'Maintenance, Early Spring', label: 'Early spring' },
      { k: 'Maintenance, Late Spring', label: 'Late spring' },
      { k: 'Maintenance, Early Summer', label: 'Early summer' },
      { k: 'Maintenance, Mid Summer', label: 'Mid summer' },
      { k: 'Maintenance, Late Summer', label: 'Late summer' },
      { k: 'Maintenance, Early Fall', label: 'Early fall' },
      { k: 'Maintenance, Mid Fall', label: 'Mid fall' },
      { k: 'Maintenance, Late Fall', label: 'Late fall' },
    ],
  },
  {
    title: 'Companions',
    cls: 'detail-tier-companions',
    fields: [
      { k: '[REC] Companion - CSR-Matched', label: 'CSR-matched' },
      { k: '[REC] Companion - Site-Matched (Soil/Water/Light)', label: 'Site-matched' },
      { k: '[REC] Companion - Complementary Seasonal Interest', label: 'Complementary seasonal interest' },
    ],
  },
];
const EMPTY_VAL = '<span class="detail-empty">\u2014</span>';
/* join two related values into one line, tolerating either being blank */
function joinParts(a, b) {
  const x = a == null ? '' : String(a).trim(),
    y = b == null ? '' : String(b).trim();
  if (x && y) return `${x} \u2014 ${y}`;
  return x || y;
}
function fieldLabel(f) {
  return (f.label || f.k || '').replace(/^\[(EST|REC|DOC)\]\s*/, '');
}
function fieldValueHtml(p, f) {
  if (f.bool) {
    return p[f.k] === 'TRUE'
      ? '<span class="bool-yes" title="Yes">\u2713</span>'
      : '<span class="bool-no" title="No">\u2717</span>';
  }
  if (f.calc) {
    const v = f.calc(p);
    return v ? esc(v) : EMPTY_VAL;
  }
  if (f.range) {
    const v = rng(p[f.range[0]], p[f.range[1]]);
    return v ? esc(v) : EMPTY_VAL;
  }
  const v = p[f.k];
  return v == null || String(v).trim() === '' ? EMPTY_VAL : esc(v);
}

/* Maintenance block: resolved tasks grouped by season, each carrying its
   provenance so a client deliverable can tell verified from general practice. */
function maintenanceHtml(p) {
  const res = resolveMaintenance(p);
  if (!maintHasAny(res)) {
    return `<div class="detail-item detail-item-full"><span class="detail-value">${EMPTY_VAL}</span></div>`;
  }
  const seasonLabels = {
    general: 'General',
    earlySpring: 'Early spring',
    lateSpring: 'Late spring',
    earlySummer: 'Early summer',
    midSummer: 'Mid summer',
    lateSummer: 'Late summer',
    earlyFall: 'Early fall',
    midFall: 'Mid fall',
    lateFall: 'Late fall',
  };
  let out = '';
  MAINT_SEASONS.forEach((s) => {
    const list = res[s];
    if (!list || !list.length) return;
    let rows = '';
    list.forEach((e) => {
      const label = maintLabel(e);
      const st = e.status || 'general';
      const title = e.source ? ` title="${esc(e.source)}"` : '';
      rows +=
        `<li class="maint-task maint-${esc(e.origin || 'archetype')}"${title}>` +
        (label ? `<span class="maint-tag">${esc(label)}</span>` : '') +
        (e.note ? `<span class="maint-note">${esc(e.note)}</span>` : '') +
        `<span class="maint-status maint-status-${esc(st)}">${esc(st)}</span>` +
        `</li>`;
    });
    out += `<div class="maint-season"><span class="maint-season-label">${esc(seasonLabels[s] || s)}</span><ul class="maint-list">${rows}</ul></div>`;
  });
  return `<div class="detail-item-full maint-block">${out}</div>`;
}

function renderDetail(el, p, editing) {
  const cm = esc(p[K.com]),
    lat = esc(p[K.lat]);
  const blurb = p['Summary Blurb'];
  const blurbHtml =
    blurb != null && String(blurb).trim() !== ''
      ? `<p class="detail-blurb">${esc(String(blurb).trim())}</p>`
      : '';
  const nameHtml = `<div class="detail-name">${cm ? `<span class="detail-common">${cm}</span>` : ''}<span class="detail-latin">${lat}</span></div>${blurbHtml}`;
  let tiersHtml = '';
  DETAIL_TIERS.forEach((tier) => {
    let rows = '';
    if (tier.custom === 'maintenance' && !editing) {
      const head = `<h4 class="detail-tier-title">${esc(tier.title)}</h4>`;
      tiersHtml += `<div class="detail-tier">${head}${maintenanceHtml(p)}</div>`;
      return;
    }
    tier.fields.forEach((f) => {
      if (f.editOnly && !editing) return;
      const label = esc(fieldLabel(f));
      const full = f.full ? ' detail-item-full' : '';
      const keyCls = f.k && f.k.startsWith('[EST]') ? 'detail-key estimated' : 'detail-key';
      if (editing) {
        const keys = f.editKeys || (f.range ? f.range : [f.k]);
        keys.forEach((rk, i) => {
          if (!rk) return;
          const lab = f.range ? `${label} ${i === 0 ? 'min' : 'max'}` : f.editKeys ? fieldLabel({ k: rk }) : label;
          const val = p[rk] == null ? '' : p[rk];
          rows += `<div class="detail-item${full}"><span class="detail-key">${esc(lab)}</span><input class="edit-field" data-field="${esc(rk)}" value="${esc(val)}"></div>`;
        });
      } else {
        rows += `<div class="detail-item${full}"><span class="${keyCls}">${label}</span><span class="detail-value">${fieldValueHtml(p, f)}</span></div>`;
      }
    });
    const head = tier.title ? `<h4 class="detail-tier-title">${esc(tier.title)}</h4>` : '';
    let cls = tier.title ? 'detail-tier' : 'detail-tier detail-tier-untitled';
    if (tier.cls) cls += ' ' + tier.cls;
    tiersHtml += `<div class="${cls}">${head}<div class="detail-grid">${rows}</div></div>`;
  });
  const bar = editing
    ? `<div class="edit-bar"><button class="edit-button primary" data-act="save">Save changes</button><button class="edit-button" data-act="cancel">Cancel</button></div>`
    : `<div class="edit-bar"><button class="edit-button" data-act="edit">Edit data</button></div>`;
  el.innerHTML = `<div class="detail">${nameHtml}${tiersHtml}${bar}</div>`;
  el.querySelector('[data-act="edit"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    renderDetail(el, p, true);
  });
  el.querySelector('[data-act="cancel"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    renderDetail(el, p, false);
  });
  el.querySelector('[data-act="save"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const fields = el.querySelectorAll('.edit-field');
    EDITS[p.__id] = EDITS[p.__id] || {};
    fields.forEach((f) => {
      const k = f.dataset.field;
      const nv = f.value;
      if (String(p[k] == null ? '' : p[k]) !== nv) {
        p[k] = nv;
        EDITS[p.__id][k] = nv;
      }
    });
    if (Object.keys(EDITS[p.__id]).length === 0) delete EDITS[p.__id];
    persistEdits();
    updateEditsBadge();
    renderDetail(el, p, false);
    apply();
    renderInventory();
  });
  /* keep clicks inside the editor from collapsing the row */
  el.querySelectorAll('.edit-field').forEach((f) =>
    f.addEventListener('click', (e) => e.stopPropagation()),
  );
}

function updateEditsBadge() {
  const n = editCount();
  $('edits-badge').textContent = n ? `(${n} edited)` : '';
}

function exportData() {
  const out = PLANTS.map((p) => {
    const c = {};
    for (const k in p) if (k !== '__id') c[k] = p[k];
    return c;
  });
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'plants.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 100);
}
