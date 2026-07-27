#!/usr/bin/env node
/*
 * validate-sources.js — enforce that "verified" actually means verified.
 *
 *   node tools/validate-sources.js              # offline structural checks
 *   node tools/validate-sources.js --network    # also fetch each URL and
 *                                               # confirm the quote appears
 *   node tools/validate-sources.js --strict     # exit 1 on warnings too
 *   node tools/validate-sources.js --network --only=Genus1,Genus2
 *                                               # network-check just these
 *                                               # genera (e.g. the genera
 *                                               # added in the latest batch)
 *                                               # instead of every verified
 *                                               # source in the file. Offline
 *                                               # structural checks still run
 *                                               # over the whole file either
 *                                               # way — that pass is free and
 *                                               # catches schema mistakes
 *                                               # anywhere, not just --only.
 *
 * The point: any entry marked `verified` goes into client deliverables, so it
 * must carry a resolvable URL and a short verbatim quote from that page. The
 * --network pass then confirms the page exists and actually contains the quote.
 * That turns "trust whoever wrote this" into "check the artifact" — a model or
 * a person who fabricates a citation gets caught here rather than by a client.
 *
 * Expected source shape for verified entries:
 *   "source": { "url": "https://…", "title": "…", "quote": "verbatim snippet" }
 * A bare string source is allowed but flagged: it is not independently checkable.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.join(__dirname, '..', 'data', 'maintenance-rules.json');
const PLANTS_FILE = path.join(__dirname, '..', 'data', 'plants.json');
const RESOLVER_FILE = path.join(__dirname, '..', 'src', 'js', '04b-maintenance.js');
const NETWORK = process.argv.includes('--network');
const STRICT = process.argv.includes('--strict');
const ONLY_ARG = process.argv.find((a) => a.startsWith('--only='));
const ONLY = ONLY_ARG
  ? new Set(
      ONLY_ARG.slice('--only='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : null;

const rules = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const vocab = new Set(Object.keys(rules.vocabulary || {}));
const seasons = new Set(Object.keys(rules.seasonFields || {}));
const statuses = new Set(Object.keys(rules.statusLegend || {}));

const errors = [];
const warnings = [];
const toFetch = [];

/*
 * Normalize typographic characters so a quote copied from a rendered web page
 * (curly quotes, en/em dashes) still matches the source's raw HTML entities,
 * and vice versa. Also case- and whitespace-insensitive.
 *
 * Also strips invisible Unicode characters — soft hyphen (U+00AD), zero-width
 * space/non-joiner/joiner, and the BOM/zero-width no-break space. PDF text
 * extractors (pdf.js, which pdf-parse@2 uses) commonly emit a soft hyphen at
 * hyphenation points that were a line-wrap in the original PDF, even when the
 * word also has a real, visible hyphen right next to it (e.g. "mildew-
 * resistant" wrapping mid-word can come out as "mildew­-resistant").
 * That character is invisible in a terminal or editor, so a broken quote
 * match from it looks like a mystery — caught once already on a real Monarda
 * citation before this fix landed.
 *
 * Also de-hyphenates real line-wrap breaks: a PDF laid out with justified
 * text can genuinely split a whole, unhyphenated word across a line break
 * with a visible hyphen, e.g. "minimizing over-\nhead watering" for
 * "overhead" — confirmed on the actual Chicago Botanic Garden Monarda PDF.
 * There's no reliable way to tell that apart from a real compound word
 * ("mildew-\nresistant") using text alone, so instead of guessing, the same
 * transformation — drop a hyphen that has no space before it but is
 * followed by whitespace, joining the two halves — is applied identically
 * to both the page text and the quote before comparing. That makes matching
 * insensitive to the distinction; it's a comparison-only transform and
 * never touches what's actually stored or displayed.
 */
function normalize(s) {
  return s
    .replace(/[­​‌‍﻿]/g, '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/(\S)-\s+(\S)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function checkEntry(where, e) {
  if (e.tag && !vocab.has(e.tag)) errors.push(`${where}: unknown tag "${e.tag}"`);
  if (!e.tag) errors.push(`${where}: entry has no tag`);
  const st = e.status || 'general';
  if (!statuses.has(st)) errors.push(`${where}: unknown status "${st}"`);

  if (st === 'verified') {
    const s = e.source;
    if (!s) {
      errors.push(`${where}: status=verified but no source`);
    } else if (typeof s === 'string') {
      warnings.push(`${where}: verified with a free-text source ("${s.slice(0, 60)}") — not checkable. Needs {url, quote}.`);
    } else {
      if (!s.url) errors.push(`${where}: verified source has no url`);
      if (!s.quote) errors.push(`${where}: verified source has no quote`);
      if (s.url && s.quote) toFetch.push({ where, url: s.url, quote: s.quote });
    }
  }
  if (e.note && e.note.length > 400) warnings.push(`${where}: note is very long (${e.note.length} chars)`);
}

function walkTasks(where, tasks) {
  if (!tasks) return;
  Object.keys(tasks).forEach((season) => {
    if (!seasons.has(season)) errors.push(`${where}: unknown season "${season}"`);
    (tasks[season] || []).forEach((e, i) => checkEntry(`${where} ${season}[${i}]`, e));
  });
}

/* archetypes */
const ids = new Set();
(rules.archetypes || []).forEach((a) => {
  if (!a.id) errors.push('archetype with no id');
  if (ids.has(a.id)) errors.push(`duplicate archetype id "${a.id}"`);
  ids.add(a.id);
  if (!a.match || !a.match.category) errors.push(`archetype ${a.id}: match.category required`);
  walkTasks(`archetype:${a.id}`, a.tasks);
});

/* modifiers */
(rules.modifiers || []).forEach((m) => {
  if (!m.id) errors.push('modifier with no id');
  if (!m.add || !m.add.season) errors.push(`modifier ${m.id}: add.season required`);
  else if (!seasons.has(m.add.season)) errors.push(`modifier ${m.id}: unknown season "${m.add.season}"`);
  if (m.add) checkEntry(`modifier:${m.id}`, m.add);
});

/*
 * genera — a genus entry is either a single {tasks} object (applies to the
 * whole genus) or an array of variants, each optionally scoped with a
 * `match` (used when one genus name covers biologically different plants,
 * e.g. herbaceous hardy hibiscus vs. woody Rose of Sharon, both "Hibiscus").
 * Every variant's tasks must still be walked and its sources checked either
 * way, or a bad citation on the array branch would silently pass.
 */
Object.keys(rules.genera || {}).forEach((g) => {
  const entry = rules.genera[g];
  const variants = Array.isArray(entry) ? entry : [entry];
  variants.forEach((v, i) => {
    const label = Array.isArray(entry) ? `genus:${g}[${i}]` : `genus:${g}`;
    // A variant may omit `match` entirely to apply genus-wide (used as a base
    // that a later, more specific variant overrides) — that's valid. It's
    // only a mistake if `match` is present but empty/unusable.
    if (v.match && !v.match.category && !v.match.habit && !v.match.habitAny) {
      errors.push(`${label}: match present but has no usable category/habit/habitAny`);
    }
    walkTasks(label, v.tasks);
  });
});

/* ── per-plant layer + cross-layer lint ───────────────────────────────────────
 * Everything above validates data/maintenance-rules.json. That file is only
 * three of the resolver's four layers. The fourth — the `Maintenance, *`
 * columns on each plant record in data/plants.json — sits at the TOP of the
 * precedence order and overrides genus rules, and until this pass existed the
 * validator never opened plants.json at all. A plant-level claim could ship
 * with no citation whatsoever and still produce a clean run. It did: 17
 * entries across 4 plants were resolving as `verified` (the "safe for client
 * deliverables" label) with no source, because the resolver stamped every
 * per-plant entry `verified` unconditionally.
 *
 * Rather than re-implement the layering here — which would drift from the real
 * thing the moment either side changed — this loads the actual resolver module
 * and runs it. It reads data/*.json directly, not dist/js/data.js, so the lint
 * checks what's committed rather than whatever was last built.
 */
const plants = JSON.parse(fs.readFileSync(PLANTS_FILE, 'utf8'));

/*
 * The resolver expects three globals from the generated data.js. Only two K
 * keys are actually read (K.cat, K.habit); they're mirrored here as literals
 * so this pass doesn't depend on a build artifact existing or being current.
 */
const resolverCtx = {
  MAINT: rules,
  K: { cat: 'Category', habit: 'Habit' },
  console,
};
vm.createContext(resolverCtx);
vm.runInContext(fs.readFileSync(RESOLVER_FILE, 'utf8'), resolverCtx);
const { parseMaintCell, resolveMaintenance } = resolverCtx;

/*
 * Directives that contradict each other if they land in the same season for
 * the same plant. These can't be caught by looking at any single layer: they
 * arise when e.g. an archetype says "leave stems standing over winter" and a
 * genus rule says "cut back" for the same season, and both survive because
 * they carry different tags and so never collide in addEntry().
 */
const CONFLICTING_TAGS = [
  ['leave-stems', 'cutback'],
  ['leave-stems', 'shear'],
  ['leave-seedheads', 'deadhead'],
];

/*
 * A conflict that's been consciously resolved in rules.conflictPolicy isn't a
 * finding — the resolver suppresses one side, so it can't reach a deliverable.
 * Only undeclared collisions are worth flagging. Declared policies are still
 * checked for sanity below, so a typo'd policy doesn't silently disable a lint.
 */
const declaredConflicts = new Set(
  (rules.conflictPolicy || []).map((c) => `${c.season}|${[c.prefer, c.suppress].sort().join('|')}`),
);
(rules.conflictPolicy || []).forEach((c) => {
  if (!c.season || !seasons.has(c.season)) errors.push(`conflictPolicy ${c.id || '(no id)'}: unknown season "${c.season}"`);
  if (!vocab.has(c.prefer)) errors.push(`conflictPolicy ${c.id || '(no id)'}: unknown prefer tag "${c.prefer}"`);
  if (!vocab.has(c.suppress)) errors.push(`conflictPolicy ${c.id || '(no id)'}: unknown suppress tag "${c.suppress}"`);
  if (!c.reason) warnings.push(`conflictPolicy ${c.id || '(no id)'}: no reason recorded — a suppression rule should say why it exists`);
});

const perPlantStats = { plantsWithCells: 0, entries: 0, untagged: 0 };
const resolvedTags = new Set();
const seasonCoverage = {};
const conflictCounts = {};
const untaggedSamples = [];

plants.forEach((p) => {
  const name = p['Latin Name'] || p['Common Name'] || '(unnamed plant)';

  /* raw per-plant cells: unknown tag prefixes silently degrade to free prose */
  let hasCells = false;
  Object.keys(rules.seasonFields || {}).forEach((season) => {
    const raw = p[rules.seasonFields[season]];
    if (raw == null || String(raw).trim() === '') return;
    hasCells = true;
    parseMaintCell(raw).forEach((e) => {
      perPlantStats.entries++;
      if (!e.tag) {
        perPlantStats.untagged++;
        if (untaggedSamples.length < 8) untaggedSamples.push(`${name} [${season}]`);
      }
    });
  });
  if (hasCells) perPlantStats.plantsWithCells++;

  /* resolved view — the thing the site actually renders */
  const bySeason = resolveMaintenance(p);
  Object.keys(bySeason).forEach((season) => {
    const list = bySeason[season];
    if (list.length) seasonCoverage[season] = (seasonCoverage[season] || 0) + 1;

    const tagsHere = new Set();
    list.forEach((e, i) => {
      resolvedTags.add(e.tag);
      tagsHere.add(e.tag);

      /*
       * The core invariant, and the reason this pass exists: `verified` is the
       * label that says "checked against a cited source", so a resolved entry
       * carrying it must have that source no matter which layer minted it.
       * Checking the resolved output rather than each input file means a bug
       * in the layering itself — not just bad data — gets caught.
       */
      if (e.status === 'verified' && !e.source) {
        errors.push(
          `plant:${name} ${season}[${i}] (origin=${e.origin}${e.originId ? `:${e.originId}` : ''}): resolves to status=verified with no source`,
        );
      }
      if (e.tag && !vocab.has(e.tag)) {
        errors.push(`plant:${name} ${season}[${i}]: unknown tag "${e.tag}"`);
      }
    });

    CONFLICTING_TAGS.forEach(([a, b]) => {
      if (!tagsHere.has(a) || !tagsHere.has(b)) return;
      if (declaredConflicts.has(`${season}|${[a, b].sort().join('|')}`)) return;
      const k = `${season}: "${a}" + "${b}"`;
      conflictCounts[k] = (conflictCounts[k] || 0) + 1;
    });
  });
});

if (perPlantStats.untagged) {
  warnings.push(
    `${perPlantStats.untagged} per-plant maintenance cell(s) are free prose with no vocabulary tag — they render without a label and never override a lower layer (addEntry only merges tagged entries), so the generic rule stays alongside them. Prefix with "tag: " e.g. "deadhead: …". First few: ${untaggedSamples.join(', ')}`,
  );
}

Object.keys(conflictCounts).forEach((k) => {
  warnings.push(`contradictory directives resolve together for ${conflictCounts[k]} plant(s) — ${k}`);
});

/* vocabulary terms defined but never reachable by any plant */
const deadVocab = [...vocab].filter((t) => !resolvedTags.has(t));
if (deadVocab.length) {
  warnings.push(`vocabulary term(s) never resolve for any plant (dead entries, or rules that should use them are missing): ${deadVocab.join(', ')}`);
}

/* a season no plant ever populates is more likely a gap than a real empty */
const SPARSE_SEASON_FLOOR = 5;
Object.keys(rules.seasonFields || {}).forEach((season) => {
  const n = seasonCoverage[season] || 0;
  if (n < SPARSE_SEASON_FLOOR) {
    warnings.push(`season "${season}" resolves for only ${n} of ${plants.length} plants — likely a coverage gap rather than a genuinely quiet season`);
  }
});

/* category fallback coverage — every category present must have a catch-all */
const cats = new Set((rules.archetypes || []).map((a) => a.match && a.match.category).filter(Boolean));
cats.forEach((c) => {
  const hasFallback = (rules.archetypes || []).some(
    (a) => a.match && a.match.category === c && !a.match.habit && !a.match.habitAny,
  );
  if (!hasFallback) warnings.push(`category "${c}" has no habit-less fallback archetype — plants with unexpected Habit values may resolve empty`);
});

/* ── report ──────────────────────────────────────────────────────────────── */
function report() {
  const counts = { verified: 0, general: 0, draft: 0, other: 0 };
  const tally = (e) => {
    const s = e.status || 'general';
    counts[s] === undefined ? counts.other++ : counts[s]++;
  };
  (rules.archetypes || []).forEach((a) => Object.values(a.tasks || {}).forEach((l) => l.forEach(tally)));
  Object.values(rules.genera || {}).forEach((entry) => {
    const variants = Array.isArray(entry) ? entry : [entry];
    variants.forEach((v) => Object.values(v.tasks || {}).forEach((l) => l.forEach(tally)));
  });
  (rules.modifiers || []).forEach((m) => m.add && tally(m.add));

  console.log('\nvalidate-sources');
  console.log(`  rule entries by status: ${JSON.stringify(counts)}`);
  console.log(`  checkable verified sources: ${toFetch.length}`);
  console.log(
    `  per-plant layer: ${perPlantStats.entries} entries on ${perPlantStats.plantsWithCells} plant(s), ${perPlantStats.untagged} untagged`,
  );

  console.log(`\nERRORS (${errors.length})`);
  errors.length ? errors.forEach((e) => console.log(`  ✗ ${e}`)) : console.log('  none');

  console.log(`\nWARNINGS (${warnings.length})`);
  warnings.length ? warnings.forEach((w) => console.log(`  ! ${w}`)) : console.log('  none');
}

/*
 * Turn a fetched HTML page into plain text for quote-matching.
 *
 * IMPORTANT: tags must be stripped to '' (nothing), not ' ' (a space). HTML
 * text nodes already contain whatever whitespace exists between words — the
 * tags themselves carry no spacing. Replacing tags with a space inserts a
 * spurious space every time a quote spans an inline element, e.g.
 * "(<em>Echinacea purpurea</em>)" — a real citation caught by this bug
 * during the maintenance-rules sourcing pass ("purple coneflower
 * (Echinacea purpurea) has been bred..." failed to match because the
 * italicized species name picked up phantom spaces around the parens).
 */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|figcaption|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#8212;|&mdash;/g, '-')
    .replace(/&amp;/g, '&');
}

/*
 * pdf-parse (v2, the actively maintained fork with a modern bundled pdf.js)
 * is a devDependency so PDF sources (e.g. Chicago Botanic Garden's Plant
 * Evaluation Notes) can actually be checked. Without it, a plain
 * fetch().text() on a PDF just returns raw/compressed bytes, which will
 * never contain a matchable quote — that's not a citation problem, it's a
 * tooling gap, and previously made every PDF-sourced "verified" entry look
 * like a failure.
 *
 * Note: pdf-parse@1.x's old bundled parser threw "bad XRef entry" on some
 * perfectly valid PDFs during testing — use v2's PDFParse class, not the
 * v1 function-call API.
 */
let PDFParse = null;
try {
  ({ PDFParse } = require('pdf-parse'));
} catch (e) {
  // handled at call site — network check will warn instead of hard-failing
}

async function extractPdfText(buf) {
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  return result.text;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * Some extension/garden sites (observed: extension.missouri.edu,
 * mtcubacenter.org) return HTTP 403 intermittently — a bot-protection or
 * rate-limit heuristic, not a sign the page moved or the citation is bad.
 * Confirmed by re-running: the same URLs that 403'd on one run passed clean
 * on the run before and after. A full, honest set of browser-like headers
 * plus a short retry-with-backoff on 403/429/5xx clears the transient case
 * without pretending to be anything other than a script checking a citation.
 */
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 PlantPickerSourceValidator/1.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};
const RETRY_STATUSES = new Set([403, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

async function fetchWithRetry(url) {
  let lastRes = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, { redirect: 'follow', headers: FETCH_HEADERS });
    if (res.ok || !RETRY_STATUSES.has(res.status) || attempt === MAX_ATTEMPTS) return res;
    lastRes = res;
    await sleep(attempt * 1500);
  }
  return lastRes;
}

/*
 * A genus's `where` label always starts "genus:<Name>" (optionally followed
 * by "[i]" for an array variant) — see the genera-walking loop above. Pull
 * just the genus name back out so --only can filter on it. Non-genus sources
 * (archetype:*, modifier:*) never match an --only filter, since a batch is
 * defined by which genera were added, not which shared archetype/modifier
 * rules happen to apply to them.
 */
function genusOf(where) {
  const m = /^genus:([^[\s]+)/.exec(where);
  return m ? m[1] : null;
}

async function checkNetwork() {
  const targets = ONLY ? toFetch.filter((f) => ONLY.has(genusOf(f.where))) : toFetch;

  if (!NETWORK) {
    if (toFetch.length) {
      const suffix = ONLY ? ` (${targets.length} match --only=${[...ONLY].join(',')})` : '';
      console.log(`\n${toFetch.length} source(s) have url+quote. Re-run with --network to verify them.${suffix}`);
    }
    return 0;
  }
  if (ONLY) {
    const found = new Set(toFetch.map((f) => genusOf(f.where)).filter(Boolean));
    const missing = [...ONLY].filter((g) => !found.has(g));
    if (missing.length) console.log(`  ! --only genus not found in file (typo, or no verified sources yet): ${missing.join(', ')}`);
  }
  console.log(`\nNETWORK CHECK (${targets.length}${ONLY ? ` of ${toFetch.length}` : ''} sources)`);
  let bad = 0;
  for (const f of targets) {
    try {
      // A small courtesy delay between requests to the same handful of sites
      // reduces the odds of tripping rate limiting in the first place.
      await sleep(400);
      const res = await fetchWithRetry(f.url);
      if (!res.ok) {
        console.log(`  ✗ ${f.where}: HTTP ${res.status} — ${f.url}`);
        bad++;
        continue;
      }
      const isPdf = /\.pdf($|\?)/i.test(f.url) || (res.headers.get('content-type') || '').includes('application/pdf');
      let text;
      if (isPdf) {
        if (!PDFParse) {
          console.log(`  ! ${f.where}: PDF source but pdf-parse isn't installed (run "npm install") — skipped, not a fail`);
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        text = normalize(await extractPdfText(buf));
      } else {
        const html = await res.text();
        text = normalize(htmlToText(html));
      }
      const needle = normalize(f.quote);
      if (text.includes(needle)) {
        console.log(`  ✓ ${f.where}`);
      } else {
        console.log(`  ✗ ${f.where}: quote NOT found on page — ${f.url}`);
        console.log(`      looked for: "${f.quote.slice(0, 80)}"`);
        bad++;
      }
    } catch (err) {
      console.log(`  ✗ ${f.where}: fetch failed (${err.message}) — ${f.url}`);
      bad++;
    }
  }
  return bad;
}

(async () => {
  report();
  const netBad = await checkNetwork();
  const fail = errors.length > 0 || netBad > 0 || (STRICT && warnings.length > 0);
  console.log(fail ? '\nFAILED\n' : '\nPASSED\n');
  process.exit(fail ? 1 : 0);
})();
