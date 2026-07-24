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
    `<div class="cell column-icon"><span class="mobile-label">Light</span>${lv ? levelBars(lv, 'var(--lvl-gold)', esc(p[K.light])) : '<span class="empty-cell">&middot;</span>'}</div>` +
    `<div class="cell column-icon"><span class="mobile-label">Water</span>${wv ? levelBars(wv, 'var(--lvl-blue)', esc(p[K.water])) : '<span class="empty-cell">&middot;</span>'}</div>` +
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

function renderDetail(el, p, editing) {
  const hide = new Set([K.com, K.lat, 'tier_group', 'C', 'W', '__id']);
  const skip = (k) => k.startsWith('Image -') || k === 'Drive Image ID';
  let items = '';
  Object.keys(p).forEach((k) => {
    if (hide.has(k) || skip(k)) return;
    const v = p[k];
    let cls = 'detail-key';
    if (k.startsWith('[EST]')) cls += ' estimated';
    else if (k.startsWith('[REC]')) cls += ' recommendation';
    else if (k.startsWith('[DOC]')) cls += ' documented';
    if (editing) {
      items += `<div class="detail-item"><span class="${cls}">${esc(k)}</span><input class="edit-field" data-field="${esc(k)}" value="${esc(v == null ? '' : v)}"></div>`;
    } else {
      if (v == null || v === '') return;
      items += `<div class="detail-item"><span class="${cls}">${esc(k)}</span><span class="detail-value">${esc(v)}</span></div>`;
    }
  });
  const cw = `<div class="detail-item"><span class="detail-key">C / Wetness W [Chicago FQA]</span><span class="detail-value">${p.C != null ? p.C : '\u2014'} / ${p.W != null ? p.W : '\u2014'}</span></div>`;
  const bar = editing
    ? `<div class="edit-bar"><button class="edit-button primary" data-act="save">Save changes</button><button class="edit-button" data-act="cancel">Cancel</button></div>`
    : `<div class="edit-bar"><button class="edit-button" data-act="edit">Edit data</button></div>`;
  el.innerHTML = `<div class="detail">${bar}<div class="flag-note"><span><b style="color:var(--ochre)">[EST]</b> estimated</span><span><b style="color:var(--green-2)">[REC]</b> recommendation</span><span><b style="color:var(--olive)">[DOC]</b> documented</span></div><div class="detail-grid">${editing ? '' : cw}${items}</div></div>`;
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
