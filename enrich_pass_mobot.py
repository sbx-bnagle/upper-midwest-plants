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

# ── DATA collected from Missouri Botanical Garden Plant Finder and Lady Bird
#    Johnson Wildflower Center / supplementary sources (Morning Sky Greenery,
#    NC State Extension, Wisconsin Horticulture Extension). Only explicitly
#    stated values recorded. ────────────────────────────────────────────────
DATA = {
    # Source: MOBOT Plant Finder (taxonid=291709)
    'Acanthus spinosus': dict(
        light='Full sun to part shade',
        water='Medium',
        zone='5 to 9',
        hmin='3',
        hmax='4',
        smin='2',
        smax='3',
        bt='June to August',
        bc='pink to mauve',
    ),
    # Source: MOBOT Plant Finder (taxonid=281048), Morton Arboretum, NC State
    'Aesculus parviflora': dict(
        light='Part shade to full shade',
        water='Medium',
        zone='4 to 8',
        hmin='8',
        hmax='12',
        smin='8',
        smax='15',
        bt='June to July',
        bc='white',
    ),
    # Source: LBJWFC (wildflower.org/AGSC), Morning Sky Greenery
    'Agastache scrophulariifolia': dict(
        light='Full sun to part shade',
        water='Medium',
        zone='4 to 8',
        hmin='3',
        hmax='6',
        smin='2',
        smax='2',
        bt='July to September',
        bc='purple',
        ga='attracts butterflies, attracts bees, attracts hummingbirds',
    ),
    # Source: MOBOT Plant Finder (kempercode=b210)
    'Alchemilla mollis': dict(
        light='Full sun to part shade',
        water='Medium',
        zone='3 to 8',
        hmin='1',
        hmax='1.5',
        smin='1.5',
        smax='2.5',
        bt='June',
        bc='chartreuse',
    ),
    # Source: MOBOT Plant Finder (taxonid=242792)
    'Amorpha canescens': dict(
        light='Full sun',
        water='Dry to medium',
        zone='2 to 9',
        hmin='2',
        hmax='3',
        smin='2',
        smax='2.5',
        bt='July to September',
        bc='purple',
        dro='TRUE',
        lm='TRUE',
        ga='attracts birds, attracts butterflies',
    ),
    # Source: MOBOT Plant Finder (kempercode=w810), North Creek Nurseries,
    #         NC State Extension
    'Amsonia hubrectii': dict(
        light='Full sun to part shade',
        water='Dry to medium',
        zone='4 to 9',
        hmin='3',
        hmax='3',
        smin='2',
        smax='3',
        bt='May to June',
        bc='light blue',
    ),
    # Source: MOBOT Plant Finder (kempercode=b350 — Pulsatilla vulgaris),
    #         Wisconsin Horticulture Extension
    'Anemone pulsatilla': dict(
        light='Full sun',
        water='Dry to medium',
        zone='4 to 8',
        hmin='0.75',
        hmax='1',
        bt='March to April',
        bc='purple',
        dro='TRUE',
    ),
    # Source: MOBOT Plant Finder (kempercode=h330)
    'Anemone sylvestris': dict(
        light='Part shade',
        water='Medium',
        zone='4 to 8',
        hmin='1',
        hmax='1.5',
        smin='0.75',
        smax='1',
        bt='April',
        bc='white',
        soil='sand',
    ),
}
# ─────────────────────────────────────────────────────────────────────────────

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
