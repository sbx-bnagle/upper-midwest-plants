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

# Sources:
# - Carex stricta BT: wildflower.org (May to June)
# - Carex vulpinoidea BT: wildflower.org (July to August)
# - Carex woodii BT: wildflower.org (May, June, July)
# - Artemisia schmidtiana BC: MOBOT (small yellow flower-heads)
# - Leptinella squalida BC: MOBOT (button-like yellow flowers in early summer)
# - Polemonium reptans BC: MOBOT (blue flowers)
# - Fargesia rufa: MOBOT says "rarely flowers" — no BT recorded
# - Microbiota decussata: Cupressaceae conifer, non-flowering — no BT/BC recorded

DATA = {
    'Artemisia schmidtiana': dict(bc='yellow'),
    'Carex stricta':         dict(bt='May to June'),
    'Carex vulpinoidea':     dict(bt='July to August'),
    'Carex woodii':          dict(bt='May to July'),
    'Leptinella squalida':   dict(bc='yellow'),
    'Polemonium reptans':    dict(bc='blue'),
}

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
