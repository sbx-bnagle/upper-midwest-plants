#!/usr/bin/env node
/*
 * normalize-habits.js — fold free-text Habit values into the canonical list.
 *
 *   node tools/normalize-habits.js            # dry run, prints a diff report
 *   node tools/normalize-habits.js --write    # applies changes to data/plants.json
 *
 * Dry run is the default and writes nothing. Review the report first.
 *
 * Why this matters: Habit drives archetype selection in the maintenance rules,
 * so an off-vocabulary value silently falls through to a category-level default
 * instead of the specific archetype it should get.
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'plants.json');
const WRITE = process.argv.includes('--write');

/* Canonical habits — must match HABITS in src/js/02-constants.js */
const CANONICAL = [
  'upright clump',
  'mound',
  'rounded shrub',
  'upright shrub',
  'spreading mat',
  'spreading clump',
  'spreading mound',
  'climbing vine',
  'rounded mound',
  'fountain clump',
  'arching clump',
  'arching shrub',
  'thicket-forming shrub',
  'vertical spike',
  'architectural rosette',
  'vase',
];

/*
 * Mapping table. Edit this, not the data.
 * `null` means "leave alone, needs a human" — blanks can't be inferred safely.
 *
 * Judgment calls are commented. Change any you disagree with and re-run.
 */
const MAP = {
  'vertical/architectural': 'vertical spike',
  upright: 'upright shrub', // all 3 are category=shrub
  clump: 'upright clump',
  'mound (ephemeral)': 'mound', // NOTE: "ephemeral" is lifecycle, not habit —
  // consider recording it in Growth Rate/Lifespan before this runs
  'shrub-like mound': 'mound',
  arching: 'arching clump', // category=flower, so clump not shrub
  'mounding sprawl': 'spreading mound',
  'spreading shrub': 'spreading mound', // judgment: could be spreading mat
  // 'vase' is a real fern habit (e.g. ostrich fern) — added to CANONICAL
  // rather than forced into a wrong bucket.
};

const plants = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const canon = new Set(CANONICAL);

const changes = [];
const blanks = [];
const unmapped = new Map();

plants.forEach((p, i) => {
  const raw = p.Habit == null ? '' : String(p.Habit);
  const v = raw.trim();
  if (v === '') {
    blanks.push({ i, name: p['Common Name'] || p['Latin Name'], cat: p.Category });
    return;
  }
  if (canon.has(v)) {
    if (v !== raw) changes.push({ i, name: p['Common Name'], from: raw, to: v, why: 'whitespace' });
    return;
  }
  if (MAP[v]) {
    changes.push({ i, name: p['Common Name'] || p['Latin Name'], from: v, to: MAP[v], why: 'mapped' });
    return;
  }
  unmapped.set(v, (unmapped.get(v) || 0) + 1);
});

/* ── report ──────────────────────────────────────────────────────────────── */
const byMapping = {};
changes.forEach((c) => {
  const k = `${c.from}  ->  ${c.to}`;
  (byMapping[k] = byMapping[k] || []).push(c.name);
});

console.log(`\nnormalize-habits  (${WRITE ? 'WRITE' : 'DRY RUN'})`);
console.log(`  ${plants.length} plants scanned\n`);

console.log(`CHANGES (${changes.length} plants)`);
if (!changes.length) console.log('  none');
Object.entries(byMapping).forEach(([k, names]) => {
  console.log(`  ${k}   (${names.length})`);
  names.forEach((n) => console.log(`      - ${n}`));
});

console.log(`\nBLANK Habit (${blanks.length}) — not inferable, fill manually`);
const blanksByCat = {};
blanks.forEach((b) => (blanksByCat[b.cat || '?'] = (blanksByCat[b.cat || '?'] || 0) + 1));
Object.entries(blanksByCat).forEach(([c, n]) => console.log(`  ${String(n).padStart(3)}  category=${c}`));
blanks.slice(0, 10).forEach((b) => console.log(`      - ${b.name} (${b.cat})`));
if (blanks.length > 10) console.log(`      … and ${blanks.length - 10} more`);

if (unmapped.size) {
  console.log(`\nUNMAPPED non-canonical values (${unmapped.size}) — add to MAP and re-run`);
  [...unmapped.entries()].sort((a, b) => b[1] - a[1]).forEach(([v, n]) => console.log(`  ${String(n).padStart(3)}  ${JSON.stringify(v)}`));
}

/* ── write ───────────────────────────────────────────────────────────────── */
if (!WRITE) {
  console.log(`\nNothing written. Re-run with --write to apply.\n`);
  process.exit(0);
}
if (!changes.length) {
  console.log(`\nNo changes to write.\n`);
  process.exit(0);
}
fs.copyFileSync(DATA, DATA + '.bak');
changes.forEach((c) => (plants[c.i].Habit = c.to));
fs.writeFileSync(DATA, JSON.stringify(plants, null, 2));
console.log(`\nWrote ${changes.length} changes to data/plants.json`);
console.log(`Backup saved to data/plants.json.bak\n`);
