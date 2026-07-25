/* Init — wire everything and start */
/* ── App init ────────────────────────────────────────────────────────────── */
function fill(id, arr) {
  const s = $(id);
  arr.forEach((v) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    s.appendChild(o);
  });
}
function init() {
  /* existing selects */
  fill('f-tier', [...new Set(PLANTS.map((p) => p.tier_group))].sort());
  /* build all pill groups */
  buildPills('pills-cat', CATS, 'cats');
  buildPills('pills-attr', GARDEN_ATTRS, 'attrs');
  buildPills('pills-color', COLOR_GROUPS, 'colors');
  buildPills('pills-habit', HABITS, 'habits');
  buildPills('pills-leaf', LEAF_ATTRS, 'leaves');
  buildPills('pills-flower', FLOWER_SHAPES, 'flowers');
  buildPills('pills-light', LIGHTS, 'lights');
  buildPills('pills-water', WATERS, 'waters');
  buildPills('pills-soil', SOIL_ATTRS, 'soils');
  /* month selectors */
  buildMonthSel('sel-bloom', 'bloomSel');
  buildMonthSel('sel-foliage', 'foliageSel');
  buildMonthSel('sel-seedhead', 'seedheadSel');
  /* dual sliders */
  buildDualSlider('ds-height', 'hmin', 'hmax', 0, H_MAX, 0.5);
  buildDualSlider('ds-spread', 'smin', 'smax', 0, S_MAX, 0.5);
  /* existing controls */
  $('q').oninput = (e) => {
    state.q = e.target.value.toLowerCase().trim();
    apply();
    syncReset();
  };
  /* expanding name search: circle → pill */
  const sw = $('search-wrap');
  $('search-toggle').onclick = () => {
    sw.classList.add('open');
    $('q').focus();
  };
  $('q').addEventListener('focus', () => {
    sw.classList.add('open');
    updateCtrlH();
  });
  $('q').addEventListener('blur', () => {
    if (!$('q').value.trim()) {
      sw.classList.remove('open');
      updateCtrlH();
    }
  });
  $('f-tier').onchange = (e) => {
    state.tier = e.target.value;
    apply();
    syncReset();
  };
  // $('f-lowmaint').onchange = (e) => {
  //   state.lowmaint = e.target.checked;
  //   apply();
  //   syncReset();
  // };
  // $('f-drought').onchange = (e) => {
  //   state.drought = e.target.checked;
  //   apply();
  //   syncReset();
  // };
  /* reset */
  $('reset').onclick = () => {
    Object.assign(state, {
      q: '',
      tier: '',
      // lowmaint: false,
      // drought: false,
      hmin: 0,
      hmax: H_MAX,
      smin: 0,
      smax: S_MAX,
    });
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
    ].forEach((s) => s.clear());
    $('q').value = '';
    $('search-wrap').classList.remove('open');
    $('f-tier').value = '';
    // $('f-lowmaint').checked = false;
    // $('f-drought').checked = false;
    document.querySelectorAll('.pill.active').forEach((b) => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = '';
      b.style.borderColor = '';
    });
    document.querySelectorAll('.month-segment.active').forEach((b) => b.classList.remove('active'));
    sliderResets.forEach((fn) => fn());
    apply();
    syncReset();
  };
  /* query pane toggle */
  $('query-toggle').onclick = () => {
    const open = $('query-pane').classList.toggle('open');
    const queryArrow = $('qt-arrow');
    if (queryArrow) queryArrow.innerHTML = open ? '&#9652;' : '&#9662;';
    $('query-toggle').classList.toggle('active', open);
  };
  $('query-close').onclick = closePane;
  /* close on outside click */
  document.addEventListener('mousedown', (e) => {
    const pane = $('query-pane'),
      btn = $('query-toggle');
    if (pane.classList.contains('open') && !pane.contains(e.target) && !btn.contains(e.target))
      closePane();
  });
  /* scroll / resize */
  new IntersectionObserver(
    (es) => {
      if (es[0].isIntersecting) more();
    },
    { rootMargin: '400px' },
  ).observe($('sentinel'));
  window.addEventListener('scroll', () => {
    $('totop').classList.toggle('visible', scrollY > 500);
    updateCtrlH(); // keep the query pane glued to the bar's bottom rule
  });
  window.addEventListener('resize', updateCtrlH);
  $('inv-pane').onclick = (e) => {
    if (!$('inv-pane').classList.contains('open')) {
      openInv();
    }
  };
  $('inv-close').onclick = (e) => {
    e.stopPropagation();
    closeInv();
  };
  $('inv-overlay').onclick = closeInv;
  $('export-btn').onclick = exportData;
  $('inv-download').onclick = (e) => {
    e.stopPropagation();
    downloadInventoryMd();
  };
  updateEditsBadge();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('inv-pane').classList.contains('open')) closeInv();
  });
  updateSpineCount();
  renderInventory();
  updateCtrlH();
  apply();
}

init();
