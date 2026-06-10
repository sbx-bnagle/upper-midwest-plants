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

# ── Sources consulted ───────────────────────────────────────────────────────
# Missouri Botanical Garden Plant Finder (search snippets), NC State Extension,
# Lady Bird Johnson Wildflower Center, Prairie Moon Nursery, Morning Sky Greenery,
# Gardenia.net, Wisconsin Horticulture Extension
# ───────────────────────────────────────────────────────────────────────────

DATA = {
    # Acanthus spinosus — bear's breeches (non-native; included via tier filter)
    # Sources: NC State Extension, Gardenia.net, MOBOT snippet
    # Zone 5–9 (multiple sources); height 3–4', spread 2–3'; full sun to part shade;
    # medium moisture; blooms early–late summer; white flowers with purple bracts
    'Acanthus spinosus': dict(
        light='full sun, part sun, part shade',
        water='average',
        zone='5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b, 9a, 9b',
        hmin='3', hmax='4',
        smin='2', smax='3',
        bt='Early Summer, Mid Summer, Late Summer',
        bc='white',
        soil='average',
    ),

    # Aesculus parviflora — bottlebrush buckeye
    # Sources: MOBOT snippet, NC State Extension, Morton Arboretum, Chicago Botanic Garden
    # Zone 4–8; height 8–12', spread 8–15'; part shade to full shade;
    # medium moisture; blooms June–July; white flowers; attracts pollinators
    'Aesculus parviflora': dict(
        light='part shade, full shade',
        water='average',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='8', hmax='12',
        smin='8', smax='15',
        bt='Early Summer, Mid Summer',
        bc='white',
        soil='high organic, loam',
        ga='pollinator friendly',
    ),

    # Agastache scrophulariifolia — purple giant hyssop
    # Sources: LBJWC, Prairie Moon Nursery, Morning Sky Greenery, Minnesota Wildflowers
    # Zone 3–8; height 3–6', spread 1.5–2'; full sun to part sun;
    # medium moisture; blooms July–September; pale purple; supports native bees
    'Agastache scrophulariifolia': dict(
        light='full sun, part sun',
        water='average',
        zone='3a, 3b, 4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='3', hmax='6',
        smin='1.5', smax='2',
        bt='Mid Summer, Late Summer, Early Fall',
        bc='pale purple',
        soil='average, loam',
        ga='pollinator friendly',
    ),

    # Alchemilla mollis — lady's mantle (non-native; included via tier filter)
    # Source: MOBOT Plant Finder search snippet (complete structured data)
    # Zone 3–8; height 1–1.5', spread 1.5–2.5'; full sun to part shade;
    # medium moisture; blooms June; chartreuse flowers
    'Alchemilla mollis': dict(
        light='full sun, part sun, part shade',
        water='average',
        zone='3a, 3b, 4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='1', hmax='1.5',
        smin='1.5', smax='2.5',
        bt='Early Summer',
        bc='chartreuse',
        soil='average',
    ),

    # Amorpha canescens — leadplant (native prairie shrub)
    # Sources: MOBOT snippet, Prairie Moon Nursery, Gardenia.net, multiple native nurseries
    # Zone 2–9; height 1–3', spread 2–2.5'; full sun;
    # dry to medium moisture; blooms May–June; bluish-purple; drought tolerant; attracts pollinators
    'Amorpha canescens': dict(
        light='full sun',
        water='dry, average',
        zone='2a, 2b, 3a, 3b, 4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b, 9a, 9b',
        hmin='1', hmax='3',
        smin='2', smax='2.5',
        bt='Late Spring, Early Summer',
        bc='purple',
        dro='TRUE',
        soil='average, clay, sand, rocky/poor',
        ga='pollinator friendly',
    ),

    # Amsonia hubrectii (= A. hubrichtii) — threadleaf bluestar
    # Sources: MOBOT Plant Finder (search snippet), NC State, Walters Gardens, STL Master Gardener
    # Zone 5–8 (MOBOT); height 2–3', spread 2–3'; full sun to part sun;
    # medium moisture; blooms May (mid–late spring); light blue; fall color; low-maintenance
    'Amsonia hubrectii': dict(
        light='full sun, part sun',
        water='average',
        zone='5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='2', hmax='3',
        smin='2', smax='3',
        bt='Mid Spring, Late Spring',
        bc='light blue',
        soil='average',
        ga='fall color',
        lm='TRUE',
    ),

    # Anemone pulsatilla (= Pulsatilla vulgaris) — pasque flower (European)
    # Sources: MOBOT snippet, Wisconsin Horticulture Extension, Gardenia.net
    # Zone 4–8; height 0.5–1', spread 0.67–1'; full sun;
    # medium moisture; blooms March–April; purple; ornamental seedheads
    'Anemone pulsatilla': dict(
        light='full sun',
        water='average',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='0.5', hmax='1',
        smin='0.67', smax='1',
        bt='Early Spring, Mid Spring',
        bc='purple',
        soil='average',
        ga='attractive seedheads',
    ),

    # Anemone sylvestris — snowdrop anemone (European)
    # Source: MOBOT Plant Finder search snippet (complete structured data),
    #         Gardenia.net confirms fragrant flowers
    # Zone 4–8 (MOBOT); height 1–1.5', spread 0.75–1'; part shade to full shade;
    # medium moisture; blooms April (mid spring); white; fragrant
    'Anemone sylvestris': dict(
        light='part shade, full shade',
        water='average',
        zone='4a, 4b, 5a, 5b, 6a, 6b, 7a, 7b, 8a, 8b',
        hmin='1', hmax='1.5',
        smin='0.75', smax='1',
        bt='Mid Spring',
        bc='white',
        soil='average',
        ga='fragrant',
    ),
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
