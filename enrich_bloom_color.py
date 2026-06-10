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

# ── Data from Missouri Botanical Garden Plant Finder ───────────────────────
# Sources:
#   Artemisia schmidtiana: MOBOT search — "yellow flowers" (July to August)
#   Leptinella squalida:   MOBOT search — "Yellow flowers bloom from June to July"
#   Polemonium reptans:    MOBOT search — "Bloom Color: Blue"
#   Thymus pseudolanuginosus: MOBOT search — "Bloom Color: Pale pink"
#   Yucca filamentosa:     MOBOT search — "Bloom Color: Creamy white"
#
# Carex pensylvanica + Carex rosea: wildflower.org — "Bloom Color: Not Applicable"
#   (sedge perianth absent); left blank.
# Microbiota decussata: conifer — no bloom data applicable; left blank.
DATA = {
    'Artemisia schmidtiana':    dict(bc='yellow'),
    'Leptinella squalida':      dict(bc='yellow'),
    'Polemonium reptans':        dict(bc='blue'),
    'Thymus pseudolanuginosus': dict(bc='pale pink'),
    'Yucca filamentosa':        dict(bc='creamy white'),
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
    # Bloom color: species rows only (cultivar-aware rule)
    if str(r[CULT]).strip().upper() != 'Y' and 'bc' in d:
        cells_filled += sb(i, BC, d['bc'])

m.to_csv('Plants_v4_master.csv', index=False)
print(f'Pass complete: {rows_hit} rows matched, {cells_filled} cells filled')
print('Species filled:', sorted(set(
    next((k for k in sorted_keys if str(r[LAT]).startswith(k)), '')
    for _, r in m.iterrows() if str(r[LAT]).strip()
) - {''})[:20])
