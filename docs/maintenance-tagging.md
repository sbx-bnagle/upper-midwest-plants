# Maintenance field strategy

How to populate `Maintenance, General` + the eight seasonal fields across 1,229 plants,
in a form that can generate per-plant maintenance guides when `Download .md` ships.

Current state: **4 of 1,229 plants** have any maintenance data (~11,000 empty cells).

---

## 1. Cell format

Each cell holds one or more **tag + optional note** pairs, delimited by ` | `:

```
tag: short plant-specific note | tag | tag: another note
```

Rules:

- Tag is lowercase, hyphenated, drawn from the controlled vocabulary below.
- Note is optional. A bare tag is valid and still generates generic guide copy.
- Note is one sentence, plant-specific. Skip anything the tag already implies.
- `|` is the delimiter because `;` and `,` already appear inside field prose.

Examples from plants already populated:

```
Maintenance, Early Spring
  cutback: Shear last year's stalks to the crown once new shoots appear. | divide: Every 3 years to maintain vigor.

Maintenance, Mid Summer
  deadhead: Cut flowering stems to the ground once dried. | monitor: Powdery mildew in hot, humid sites.

Maintenance, Late Fall
  mulch: Prevents frost heaving.
```

Why tags rather than prose: tags are **facts**, so they're both machine-usable
(filtering, grouping, guide generation) and not encumbered by any source's
copyright on wording. The prose gets written fresh at export time.

---

## 2. Controlled vocabulary

Keep this list closed. Adding a tag means updating the guide generator.

### Cutting & tidying

| Tag | Meaning |
| --- | --- |
| `cutback` | Cut stems to base/crown |
| `deadhead` | Remove spent flowers to extend bloom or stop seeding |
| `deadleaf` | Remove damaged/spent foliage |
| `shear` | Uniform trim of the whole clump (often a mid-season reset) |
| `prune` | Woody, structural cuts — shrubs and vines |
| `thin` | Remove stems for airflow or renewal |
| `pinch` | Early tip pinch for branching/height control |

### Division & spread

| Tag | Meaning |
| --- | --- |
| `divide` | Lift and split to maintain vigor |
| `edit-seedlings` | Thin volunteers from self-sowers |
| `contain` | Limit rhizome/sucker spread |

### Soil, water & feeding

| Tag | Meaning |
| --- | --- |
| `water-establish` | Consistent moisture through establishment |
| `water-deep` | Deep, infrequent watering once established |
| `mulch` | Apply/refresh mulch |
| `feed` | Compost or fertilizer |

### Support & siting

| Tag | Meaning |
| --- | --- |
| `stake` | Support for tall or floppy stems |
| `space` | Spacing/airflow to limit disease |
| `plant-timing` | Best window to plant or transplant |

### Habitat & observation

| Tag | Meaning |
| --- | --- |
| `leave-stems` | Leave standing stems over winter for cavity-nesting insects |
| `leave-seedheads` | Leave seed for birds |
| `weed` | Keep a clean ring; competition control |
| `monitor` | Watch for a named pest/disease |

---

## 3. Population strategy

Do **not** author 11,061 cells. Author ~150 reusable units and derive the rest.

### Layer 1 — archetype defaults (covers 100%)

42 `Category` + `Habit` combinations cover the entire catalog, and the traits
needed to pick one are already populated:

| Trait | Coverage |
| --- | --- |
| Category | 1229/1229 |
| Water Req / Light Req | 1229/1229 |
| Habit | 1209/1229 |
| Growth Rate/Lifespan | 1224/1229 |
| Bloom Time | 1141/1229 |

Write one tag set per archetype. Sketch:

- `flower / upright clump` (300 plants) — early spring `cutback`; mid summer
  `deadhead`; fall `leave-seedheads`, `leave-stems`; spring `divide`
- `shrub / rounded shrub` (205) — late winter/early spring `prune`; `thin` on renewal cycle
- `grass / upright clump` (38) — late winter `cutback` before green-up; `divide` in spring
- `fern` (16) — early spring `deadleaf` old fronds; `mulch`
- `vine / climbing vine` (37) — dormant `prune` to framework; `contain`

Derived modifiers from existing fields:

- `Attractive Seedhead Time` present → add `leave-seedheads` in that season
- `Water Req` contains dry → `water-deep`; wet/moist → `water-establish`
- `Low Maintenance = TRUE` → suppress optional tags (`pinch`, `shear`)
- Short-lived in `Growth Rate/Lifespan` → `edit-seedlings`
- `Bloom Time` end → season for `deadhead` / `cutback`

### Layer 2 — genus overrides (~91 genera → 80% of catalog)

Genus is where real horticultural difference lives, and it's concentrated:
Hydrangea 51, Hosta 42, Rosa 41, Echinacea 31, Sedum 29, Hibiscus 28,
Phlox 27, Heuchera 27, Carex 24, Viburnum 21.

Genus-level notes carry the specifics worth writing once:
Hydrangea pruning depends on old vs. new wood; Phlox needs `space` + `monitor`
for powdery mildew; Heuchera needs `divide` every ~3 years for frost heave.

### Layer 3 — per-plant notes (target: 100–200 plants)

Reserve bespoke notes for cultivar quirks and anything contradicting its genus
default. Everything else inherits.

**Effort: ~150 authored units instead of 11,061 cells.**

### Storage

Keep the derived values out of `plants.json` — store archetype and genus rules
in a separate file and resolve at render/export. That keeps per-plant data as
only what's genuinely plant-specific, and lets a rule fix propagate everywhere.

---

## 4. Sources

### Recommended — public domain or regionally authoritative

| Source | Why | Reuse |
| --- | --- | --- |
| [USDA NRCS Plant Guides](https://www.nrcs.usda.gov/plant-materials/news/nrcs-plant-guides) | 500+ guides with explicit establishment/management sections | US Gov work — public domain |
| [USDA PLANTS Fact Sheets](https://plantsorig.sc.egov.usda.gov/java/factSheet) | Already the source for the Shade Tolerance field | Public domain |
| UMN / UW–Madison / Iowa State Extension | Land-grant, written for this exact climate | Usually reusable with attribution — verify per page |
| [Mt. Cuba Center trial reports](https://mtcubacenter.org/research/trial-garden/) | Multi-year side-by-side trials; strongest evidence on which cultivars actually need what | Copyrighted prose; cite, don't copy |
| Prairie Moon Nursery | Upper Midwest natives, plug/seed establishment detail | Copyrighted; facts only |
| Xerces Society | Authority for `leave-stems` / `leave-seedheads` timing | Copyrighted; cite |

### The sources under consideration

- **plantfinder.mobot.org (Missouri Botanical Garden)** — the best of the five.
  Horticulturally reliable, consistent structure, good regional overlap. Prose is
  copyrighted: extract facts into tags, never paste sentences.
- **garden.org (National Gardening Association)** — usable, but largely
  user-contributed, so quality varies entry to entry. Good for cross-checking.
- **gardenia.net** — clean structure and decent care sections; commercial and
  copyrighted, and it skews to general ornamentals over regional natives.
- **davesgarden.com** — user-submitted anecdote. Useful signal for real-world
  problems (flopping, mildew, aggressive spread) that formal sources omit.
  Not authoritative on its own.
- **ai-plantfinder.com** — recommend against using as a fact source. The
  Anise Hyssop page is well *structured* — its Season / Task / What to do / Why
  table is a good model for the schema, and worth borrowing as a shape. But the
  site is AI-generated SEO content published by a software/advertising company,
  with generic bylines, zero citations, uncorrected typos, and stablemates like
  "What's The Scariest Plant in The Forest?". Facts there are unverifiable and
  plausibly hallucinated. Feeding it into a horticultural reference risks
  laundering errors into something gardeners act on.

### Copyright note

Facts (bloom time, prune-in-spring, divide every 3 years) are not copyrightable;
the sentences expressing them are. The tag vocabulary is the safeguard: collect
facts as tags, write guide prose fresh at export.

---

## 4b. Verification contract

Anything marked `verified` goes into client deliverables, so it must be
independently checkable. A free-text source name is not enough — it can't be
audited, and it's indistinguishable from a fabricated citation.

```json
{
  "tag": "prune",
  "note": "H. paniculata blooms on new wood — prune in early spring.",
  "status": "verified",
  "source": {
    "url": "https://…",
    "title": "Missouri Botanical Garden Plant Finder — Hydrangea paniculata",
    "quote": "verbatim snippet that appears on that page"
  }
}
```

`npm run validate` checks structure offline: tags exist in the vocabulary,
seasons are real, every `verified` entry carries a URL and quote, and every
category has a fallback archetype. `npm run validate:network` then fetches each
URL and confirms the quote actually appears on the page.

This is what makes the authoring step model-agnostic. A cheap model can draft
tags from a fetched source document, but if it invents a citation or a quote,
`validate:network` fails and it never reaches a client. Run
`npm run validate:strict` in CI to gate on warnings too.

## 5. Suggested order

1. Lock the vocabulary (§2) — everything downstream depends on it.
2. Author the ~42 archetype tag sets; auto-apply and spot-check.
3. Layer in the top ~30 genera (50% of catalog), then extend toward 91.
4. Bespoke notes only where a plant contradicts its defaults.
5. Build the `.md` generator against tags, with genus/archetype fallback.

## 6. Open decisions

- **Season granularity.** Nine fields is fine-grained; most tasks land in
  early spring / mid summer / late fall. Consider whether the mid-season columns
  earn their keep.
- **Editing UI.** Maintenance notes are long and the drawer's edit inputs are
  single-line `<input>`. Full-width fields likely want `<textarea>`.
- **Provenance.** Consider marking derived vs. authored values so guides can
  distinguish "general practice" from "verified for this plant".
