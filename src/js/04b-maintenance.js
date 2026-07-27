/* Maintenance — resolve per-plant maintenance tasks from layered rules.
 *
 * Precedence, lowest to highest:
 *   1. archetype  (Category + Habit)      — broad defaults, covers every plant
 *   2. modifiers  (conditional on fields) — e.g. has a seedhead, dry site
 *   3. genus                              — where real horticultural difference lives
 *   4. plant                              — the `Maintenance, *` fields on the record
 *
 * Higher layers override lower ones for the SAME tag in the SAME season, so a
 * genus note replaces the archetype's generic note rather than duplicating it.
 * Every resolved entry keeps `origin` and `status` so a client deliverable can
 * distinguish verified, plant-specific guidance from general practice.
 *
 * Per-plant field format:  `tag: note | tag | tag: note`
 */

const MAINT_SEASONS = MAINT && MAINT.seasonFields ? Object.keys(MAINT.seasonFields) : [];

/* ── Parse a per-plant maintenance cell ──────────────────────────────────── */
function parseMaintCell(raw) {
  if (raw == null || String(raw).trim() === '') return [];
  return String(raw)
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const i = chunk.indexOf(':');
      // no colon, or colon appears after the first word-ish run → treat as free prose
      if (i < 0) {
        const t = chunk.trim();
        return MAINT.vocabulary[t] ? { tag: t, note: '' } : { tag: '', note: t };
      }
      const tag = chunk.slice(0, i).trim();
      const note = chunk.slice(i + 1).trim();
      if (!MAINT.vocabulary[tag]) return { tag: '', note: chunk.trim() };
      return { tag, note };
    });
}

/* ── Layer matching ──────────────────────────────────────────────────────── */
function archetypeFor(p) {
  const cat = (p[K.cat] || '').toLowerCase().trim(),
    habit = (p[K.habit] || '').toLowerCase().trim();
  let catOnly = null;
  for (const a of MAINT.archetypes) {
    const m = a.match || {};
    if ((m.category || '').toLowerCase() !== cat) continue;
    if (m.habit) {
      if (m.habit.toLowerCase() === habit) return a;
      continue;
    }
    if (m.habitAny) {
      if (m.habitAny.some((h) => h.toLowerCase() === habit)) return a;
      continue;
    }
    catOnly = catOnly || a; // category-level fallback
  }
  return catOnly;
}

function modifierApplies(mod, p) {
  const w = mod.when || {};
  if (w.fieldPresent) {
    const v = p[w.fieldPresent];
    return v != null && String(v).trim() !== '';
  }
  if (w.fieldContains) {
    const v = (p[w.fieldContains.field] || '').toLowerCase();
    return v.includes(String(w.fieldContains.value).toLowerCase());
  }
  return false;
}

/* ── Resolve ─────────────────────────────────────────────────────────────── */
function addEntry(bySeason, season, entry) {
  if (!season || !bySeason[season]) return;
  const list = bySeason[season];
  const existing = entry.tag ? list.findIndex((e) => e.tag && e.tag === entry.tag) : -1;
  if (existing >= 0) {
    // higher-precedence layer wins; keep a note if the new layer omitted one
    const prev = list[existing];
    list[existing] = Object.assign({}, prev, entry, {
      note: entry.note || prev.note,
      source: entry.source || prev.source,
    });
  } else {
    list.push(entry);
  }
}

function resolveMaintenance(p) {
  const bySeason = {};
  MAINT_SEASONS.forEach((s) => (bySeason[s] = []));

  /* 1. archetype */
  const arch = archetypeFor(p);
  if (arch && arch.tasks) {
    Object.keys(arch.tasks).forEach((season) => {
      arch.tasks[season].forEach((t) =>
        addEntry(bySeason, season, Object.assign({}, t, { origin: 'archetype', originId: arch.id })),
      );
    });
  }

  /* 2. modifiers */
  (MAINT.modifiers || []).forEach((mod) => {
    if (!modifierApplies(mod, p)) return;
    const a = mod.add;
    addEntry(bySeason, a.season, Object.assign({}, a, { origin: 'modifier', originId: mod.id }));
  });

  /* 3. genus
   * A genus entry is normally a single {note, tasks} object applying to every
   * plant in that genus. Some genera aren't horticulturally uniform though —
   * e.g. "Hibiscus" covers both herbaceous hardy hibiscus (cut to the base
   * every winter) and woody Rose of Sharon shrubs (never cut to the base),
   * and "Hydrangea" covers shrubs plus one true climbing vine. For those,
   * a genus entry can instead be an array of variants, each with an optional
   * `match` (same shape as an archetype match: category / habit / habitAny)
   * that scopes it to the plants it actually applies to. A variant with no
   * `match` applies to the whole genus and is processed first, so a later,
   * more specific variant can override it for just the matching plants.
   */
  const gen = (p.Genus || '').trim();
  const grule = gen && MAINT.genera ? MAINT.genera[gen] : null;
  if (grule) {
    const variants = Array.isArray(grule) ? grule : [grule];
    const cat = (p[K.cat] || '').toLowerCase().trim();
    const habit = (p[K.habit] || '').toLowerCase().trim();
    variants.forEach((gr) => {
      if (gr.match) {
        const m = gr.match;
        if (m.category && m.category.toLowerCase() !== cat) return;
        if (m.habit && m.habit.toLowerCase() !== habit) return;
        if (m.habitAny && !m.habitAny.some((h) => h.toLowerCase() === habit)) return;
      }
      if (!gr.tasks) return;
      Object.keys(gr.tasks).forEach((season) => {
        gr.tasks[season].forEach((t) =>
          addEntry(bySeason, season, Object.assign({}, t, { origin: 'genus', originId: gen })),
        );
      });
    });
  }

  /* 4. per-plant fields
   *
   * These are practitioner notes typed into the `Maintenance, *` columns.
   * There is no way to attach a {url, title, quote} to a spreadsheet cell, so
   * nothing from this layer can honestly claim `verified` — that status means
   * "checked against a cited source" and gates what goes into a client
   * deliverable. This previously read `status: e.tag ? 'verified' : 'verified'`
   * — both branches identical, so every per-plant entry was stamped verified
   * regardless. That put 17 uncited claims across 4 plants behind the label
   * that says they'd been source-checked, and the validator couldn't see it
   * because it only ever read maintenance-rules.json.
   *
   * `general` is the honest fit of the three existing statuses: defensible
   * horticultural practice, not source-checked. It understates these slightly
   * — they ARE plant-specific, which `general` doesn't convey — so if that
   * distinction matters for deliverables, the fix is a fourth status
   * (e.g. "practitioner"), not re-promoting these to verified.
   */
  MAINT_SEASONS.forEach((season) => {
    const field = MAINT.seasonFields[season];
    parseMaintCell(p[field]).forEach((e) => {
      addEntry(bySeason, season, Object.assign({}, e, { origin: 'plant', status: 'general' }));
    });
  });

  /* 5. conflict policy
   *
   * Two directives can both be correctly sourced and still contradict each
   * other once they land in the same season. The real case: MOBOT tells you
   * to cut Symphyotrichum, Eupatorium and Hosta to the ground after
   * flowering (self-seeding control, tidiness), while Xerces tells you to
   * leave stalks standing over winter for cavity-nesting bees. Both are true;
   * they just can't both be done. That's a policy question, not a data bug,
   * so it's declared in maintenance-rules.json rather than resolved by
   * deleting somebody's citation.
   *
   * The suppressed entry is dropped from the rendered season only. It stays
   * in the genus rule, still applies in its other seasons, and the preferred
   * entry's own note carries the deferred instruction ("cut back in spring").
   */
  (MAINT.conflictPolicy || []).forEach((rule) => {
    const list = bySeason[rule.season];
    if (!list || !list.length) return;
    if (!list.some((e) => e.tag === rule.prefer)) return;
    const i = list.findIndex((e) => e.tag === rule.suppress);
    if (i >= 0) list.splice(i, 1);
  });

  return bySeason;
}

/* label for a resolved entry: vocabulary label, or raw prose if untagged */
function maintLabel(entry) {
  if (!entry.tag) return '';
  const v = MAINT.vocabulary[entry.tag];
  return v ? v.label : entry.tag;
}

/* count of seasons that actually resolved to something */
function maintHasAny(bySeason) {
  return MAINT_SEASONS.some((s) => bySeason[s] && bySeason[s].length);
}
