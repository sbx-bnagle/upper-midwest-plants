# MOBOT Data Collection Pass — Plant Database Routine

## Context

You are running an automated enrichment pass on an Upper Midwest/Chicago-region plant database. The master CSV is at `data/Plants_v4_master.csv` (~1,229 rows, ~61 columns). Your job: find native plant species with missing culture data, look them up from reputable botanical sources, and fill in the blanks.

---

## CRITICAL INTEGRITY RULE

**NEVER estimate, infer, or fabricate values.** Only record what a source explicitly states. If a value is not clearly stated in a reliable source, leave the cell blank. This rule overrides everything.

---

## Step 1 — Find species to enrich

Read `data/Plants_v4_master.csv`. Find rows where ALL are true:
- `Native Status Tier` is not empty (any native tier counts)
- `Cultivar (Y/N)` = `N` (straight species only, not cultivars)
- `Light Req` is empty (proxy for "not yet enriched this pass")

Extract the `Latin Name` values. From each name, take only the genus + species epithet (first two words). Deduplicate. Sort alphabetically. Take the first **8 unique base species names** that are not already enriched (i.e., have no value in `Light Req`).

---

## Step 2 — Collect data from reputable sources

For each species, search the following in order:

1. **Missouri Botanical Garden Plant Finder** — search: `[species name] site:missouribotanicalgarden.org zone height sun water bloom`
2. **Lady Bird Johnson Wildflower Center** — search: `[species name] wildflower.org bloom sun moisture height`
3. **Supplementary** (as needed): Missouri Dept. of Conservation, Chicago Botanic Garden, Prairie Nursery, Morning Sky Greenery

Extract **only explicitly stated values** for these fields:

| Field key  | Column name fragment    | Example values                                      |
|------------|-------------------------|-----------------------------------------------------|
| `light`    | `Light Req`             | `Full sun`, `Part shade to full shade`              |
| `water`    | `Water Req`             | `Medium`, `Dry to medium`, `Medium to wet`          |
| `zone`     | `Zone`                  | `3 to 8`                                            |
| `hmin`     | `Height, Min`           | `2` (feet, decimal)                                 |
| `hmax`     | `Height, Max`           | `4`                                                 |
| `smin`     | `Spread, Min`           | `1`                                                 |
| `smax`     | `Spread, Max`           | `2`                                                 |
| `bt`       | `Bloom Time`            | `June to August`, `April to May`                    |
| `bc`       | `Bloom Color`           | `yellow`, `purple`, `pink to lavender`              |
| `dro`      | `Drought Resistant`     | `TRUE` (only if explicitly drought-tolerant)        |
| `lm`       | `Low Maintenance`       | `TRUE` (only if explicitly stated)                  |
| `ga`       | `Garden Attributes`     | `attracts butterflies, good cut flower`             |
| `soil`     | `Soil Req`              | `sand`, `loam`, `clay`                              |

**Special rules:**
- **Ferns** (rows where `Category` = `fern`): leave `bt` and `bc` blank — ferns are non-flowering
- **Grasses** (rows where `Category` = `grass`): fill `bt` if explicitly stated; leave `bc` blank — grass inflorescence color is not a garden attribute
- If a species isn't found in any source, skip it cleanly (leave blank, don't guess)

---

## Step 3 — Write and run the join script

Write a Python script using this exact template. Fill in the DATA dict with what you found. Run it.

```python
import pandas as pd, re

m = pd.read_csv('data/Plants_v4_master.csv', dtype=str, keep_default_na=False)

def clean(h): return re.sub(r'^\s*\d+[a-z]?/\s*', '', h).strip()
def K(s):
    for c in m.columns:
        if s.lower() in clean(c).lower(): return c

LAT  = K('Latin Name');    LIGHT = K('Light Req');  WATER = K('Water Req')
ZONE = K('Zone');          BT    = K('Bloom Time'); BC    = K('Bloom Color')
HMIN = K('Height, Min');   HMAX  = K('Height, Max')
SMIN = K('Spread, Min');   SMAX  = K('Spread, Max')
DRO  = K('Drought Resistant'); LM = K('Low Maintenance')
GA   = K('Garden Attributes'); SOIL = K('Soil Req'); CULT = K('Cultivar')

# ── Fill DATA dict from your research ──────────────────────────────────────
DATA = {
    # 'Species name': dict(light='...', water='...', zone='...', hmin='...',
    #                      hmax='...', smin='...', smax='...', bt='...',
    #                      bc='...', dro='TRUE', lm='TRUE', ga='...', soil='...'),
}
# ───────────────────────────────────────────────────────────────────────────

sorted_keys = sorted(DATA.keys(), key=len, reverse=True)  # specific before generic
COLS_ALL = {
    'light': LIGHT, 'water': WATER, 'zone': ZONE, 'bt': BT,
    'hmin': HMIN, 'hmax': HMAX, 'smin': SMIN, 'smax': SMAX,
    'dro': DRO, 'lm': LM, 'ga': GA, 'soil': SOIL,
}

def sb(i, col, val):
    if val and not str(m.at[i, col]).strip():
        m.at[i, col] = val; return 1
    return 0

rows_hit = cells_filled = 0
for i, r in m.iterrows():
    lat = str(r[LAT]).strip()
    matched = None
    for key in sorted_keys:
        if lat == key or lat.startswith(key + ' '):
            matched = key; break
    if not matched:
        continue
    rows_hit += 1
    d = DATA[matched]
    for k2, col in COLS_ALL.items():
        if k2 in d:
            cells_filled += sb(i, col, d[k2])
    # Bloom color: species rows only (cultivar-aware rule)
    if str(r[CULT]).strip().upper() != 'Y' and 'bc' in d:
        cells_filled += sb(i, BC, d['bc'])

m.to_csv('data/Plants_v4_master.csv', index=False)
print(f'Pass complete: {rows_hit} rows matched, {cells_filled} cells filled')
print('Species filled:', sorted(set(
    next((k for k in sorted_keys if str(r[LAT]).startswith(k)), '')
    for _, r in m.iterrows() if str(r[LAT]).strip()
) - {''})[:20])
```

---

## Step 4 — Commit

```bash
git add data/Plants_v4_master.csv
git commit -m "Routine MOBOT pass: [list species names you filled]"
git push
```

---

## What a good pass looks like

- 5–10 species searched, 6–8 typically found in master
- 20–100+ cells filled (more when a species has many cultivars)
- Zero fabricated values — only explicit source statements recorded
- Brief commit message listing species names
