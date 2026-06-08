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
#   usperennials.com, gardenia.net, plants.ces.ncsu.edu,
#   prairiemoon.com / prairienursery.com (Amorpha canescens)
DATA = {
    # Bears' Breeches — MOBOT taxonid 291709
    # Zone 5-9, full sun to part shade, medium moisture, 3-4' tall x 2.5-3' wide
    # Bloom: late spring to mid summer; flowers pure white
    'Acanthus spinosus': dict(
        light='full sun, part shade',
        water='Medium',
        zone='5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b, 9a, 9b',
        hmin='3', hmax='4',
        smin='2.5', smax='3',
        bt='Late Spring, Early Summer, Mid Summer',
        bc='white',
        soil='average, well-drained',
    ),
    # Bottlebrush Buckeye — MOBOT taxonid 281048
    # Zone 4-8, part shade to full shade, medium, 8-12' tall x 8-15' wide
    # Bloom: June-July; white with red anthers
    'Aesculus parviflora': dict(
        light='part shade, full shade',
        water='Medium',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='8', hmax='12',
        smin='8', smax='15',
        bt='Early Summer, Mid Summer',
        bc='white',
        soil='loam',
    ),
    # Purple Giant Hyssop — wildflower.org, izelplants.com, multiple nursery sources
    # Zone 4-8, full sun to part shade, medium, 3-6' tall x 1.5-2' wide
    # Bloom: July-September; purple/lilac
    'Agastache scrophulariifolia': dict(
        light='full sun, part shade',
        water='Medium',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='3', hmax='6',
        smin='1.5', smax='2',
        bt='Mid Summer, Late Summer, Early Fall',
        bc='purple',
    ),
    # Lady's Mantle — MOBOT kempercode b210
    # Zone 3-8, full sun to part shade, medium, 1-1.5' tall x 1.5-2' wide
    # Bloom: June; chartreuse
    'Alchemilla mollis': dict(
        light='full sun, part shade',
        water='Medium',
        zone='3a, 3b, 4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='1', hmax='1.5',
        smin='1.5', smax='2',
        bt='Early Summer',
        bc='chartreuse',
        soil='average, loam',
    ),
    # Leadplant — MOBOT kempercode b260 + Prairie Moon/Prairie Nursery
    # Zone 2-9, full sun, dry to medium, 2-3' tall x 2-3' wide
    # Bloom: May-June; purple; drought tolerant
    'Amorpha canescens': dict(
        light='full sun',
        water='Dry to medium',
        zone='2a, 2b, 3a, 3b, 4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b, 9a, 9b',
        hmin='2', hmax='3',
        smin='2', smax='3',
        bt='Late Spring, Early Summer',
        bc='purple',
        dro='TRUE',
        soil='sand, loam, clay',
    ),
    # Threadleaf Bluestar — MOBOT kempercode w810
    # Zone 5-8, full sun to part shade, medium, 2-3' tall x 2-3' wide
    # Bloom: April-May; light blue; low maintenance; attracts butterflies
    'Amsonia hubrectii': dict(
        light='full sun, part shade',
        water='Medium',
        zone='5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='2', hmax='3',
        smin='2', smax='3',
        bt='Mid Spring, Late Spring',
        bc='light blue',
        lm='TRUE',
        ga='attracts butterflies',
    ),
    # Pasque Flower (syn. Pulsatilla vulgaris) — MOBOT kempercode b350
    # Zone 4-8, full sun, dry to medium, 0.75-1' tall x 0.75-1' wide
    # Bloom: March-April (early spring); purple
    'Anemone pulsatilla': dict(
        light='full sun',
        water='Dry to medium',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='0.75', hmax='1',
        smin='0.75', smax='1',
        bt='Early Spring, Mid Spring',
        bc='purple',
        soil='average, well-drained',
    ),
    # Snowdrop Windflower — MOBOT kempercode h330
    # Zone 4-8, part shade, medium, 1-1.5' tall x 0.75-1' wide
    # Bloom: April; white
    'Anemone sylvestris': dict(
        light='part shade',
        water='Medium',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='1', hmax='1.5',
        smin='0.75', smax='1',
        bt='Mid Spring',
        bc='white',
        soil='average, well-drained',
    ),
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
