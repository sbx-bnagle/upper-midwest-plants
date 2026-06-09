import pandas as pd, re

m = pd.read_csv('Plants_v4_master.csv', dtype=str, keep_default_na=False)

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

# ── Fill DATA dict from research ───────────────────────────────────────────
# Sources: Missouri Botanical Garden Plant Finder (primary),
#   wildflower.org (Lady Bird Johnson Wildflower Center),
#   Native Plant Society of Texas, Minnesota Wildflowers,
#   Prairie Moon Nursery / Prairie Nursery
DATA = {
    # White-tinged Sedge — MOBOT Plant Finder (kempercode e116)
    # "Flowers bloom in late spring (May)"
    'Carex albicans': dict(bt='Late Spring'),
    # Appalachian Sedge — wildflower.org + multiple nursery sources
    # blooms May–June (late spring to early summer)
    'Carex appalachica': dict(bt='May to June'),
    # Plains Oval Sedge — Native Plant Society of TX (citing USDA PLANTS)
    # "blooms May–July"
    'Carex brevior': dict(bt='May to July'),
    # Brome-like Sedge — MOBOT Plant Finder (taxonid 299617)
    # "flowering stems appear in late spring to summer (May–July)"
    'Carex bromoides': dict(bt='May to July'),
    # Blue Sedge — MOBOT Plant Finder (taxonid 279735) + multiple horticultural sources
    # "bloom time June–August"; "flowers in early summer"
    'Carex flacca': dict(bt='June to August'),
    # Plantain-leaved Sedge — wildflower.org (id_plant=capl4)
    # bloom time explicitly listed as "Mar, Apr, May"
    'Carex plantaginea': dict(bt='March to May'),
    # Eastern Star Sedge — MOBOT Plant Finder (taxonid 299620)
    # "flowers bloom from April–May"
    'Carex radiata': dict(bt='April to May'),
    # Long-beaked Sedge — wildflower.org (id_plant=casp7) + Minnesota Wildflowers
    # "April/May–June"; "blooming occurs mid to late spring"
    'Carex sprengelii': dict(bt='April to June'),
}
# ───────────────────────────────────────────────────────────────────────────

sorted_keys = sorted(DATA.keys(), key=len, reverse=True)
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
    if str(r[CULT]).strip().upper() != 'Y' and 'bc' in d:
        cells_filled += sb(i, BC, d['bc'])

m.to_csv('Plants_v4_master.csv', index=False)
print(f'Pass complete: {rows_hit} rows matched, {cells_filled} cells filled')
print('Species filled:', sorted(set(
    next((k for k in sorted_keys if str(r[LAT]).startswith(k)), '')
    for _, r in m.iterrows() if str(r[LAT]).strip()
) - {''})[:20])
