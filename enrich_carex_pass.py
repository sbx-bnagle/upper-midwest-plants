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

# ── Sources consulted ──────────────────────────────────────────────────────
# Missouri Botanical Garden Plant Finder (search results — site blocks direct fetch)
# Lady Bird Johnson Wildflower Center (wildflower.org — site blocks direct fetch)
# Chicago Botanic Garden plant finder
# Prairie Moon Nursery / Prairie Nursery
# Mt. Cuba Center Carex trials
# Minnesota Wildflowers
#
# Grass rule: bt filled where explicitly stated; bc left blank per instructions.
# ──────────────────────────────────────────────────────────────────────────

DATA = {
    # BT: MOBOT/prairiemoon "late spring blooming spikes" → April to May
    # Spread: "1 – 1½ feet spread" (multiple nursery sources)
    'Carex albicans': dict(
        bt='April to May',
        smin='1', smax='1.5',
    ),

    # BT: wildflower.org + prairiemoon "May and June" (fruiting late spring → early summer)
    # Spread: "12-18 inches spread" (multiple sources)
    'Carex appalachica': dict(
        bt='May to June',
        smin='1', smax='1.5',
    ),

    # BT: Chicago Botanic Garden explicitly "May-June"
    # Spread: "mature size is 12 inches tall and wide" (bluethumb.org / nursery sources)
    # DRO: explicitly "tolerates drought" (multiple sources)
    'Carex brevior': dict(
        bt='May to June',
        smin='1', smax='1',
        dro='TRUE',
    ),

    # BT: MOBOT explicitly "late spring to summer (May-July)"
    'Carex bromoides': dict(
        bt='May to July',
    ),

    # BT: Prairie Moon / Prairie Nursery "April to May" (early spring blooms)
    'Carex plantaginea': dict(
        bt='April to May',
    ),

    # BT: multiple sources "Flowers bloom from April-May" (late spring)
    # Spread: "1-2' tall with an equal spread" (multiple sources)
    # Soil: "rich loamy soil with abundant organic matter" (MOBOT/nursery sources)
    'Carex radiata': dict(
        bt='April to May',
        smin='1', smax='2',
        soil='loam',
    ),

    # BT: Chicago Botanic Garden / Mt. Cuba Center "shines in April and May
    #     as the foliage emerges and the flowers and fruit are produced"
    'Carex sprengelii': dict(
        bt='April to May',
    ),

    # BT: multiple sources "June-August" / "early summer … brown flower spikes"
    #     (Hoffmann Nursery, MOBOT search, gardenia.net)
    'Carex flacca': dict(
        bt='June to August',
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
    # Bloom color: species rows only (cultivar-aware rule)
    if str(r[CULT]).strip().upper() != 'Y' and 'bc' in d:
        cells_filled += sb(i, BC, d['bc'])

m.to_csv('Plants_v4_master.csv', index=False)
print(f'Pass complete: {rows_hit} rows matched, {cells_filled} cells filled')
print('Species filled:', sorted(set(
    next((k for k in sorted_keys if str(r[LAT]).startswith(k)), '')
    for _, r in m.iterrows() if str(r[LAT]).strip()
) - {''})[:20])
