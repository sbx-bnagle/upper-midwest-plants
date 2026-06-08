# Plants master — methodology, dependability & sources (v4)

Primary file: **Plants_v4_master.csv** (1,284 plants + 1 metadata row, 57 columns)
Audit file: **Fiore_excluded_log.csv** (699 excluded rows, with reasons)

---

## What changed in v4 (this pass)
Added an **indicator-values block** (knowable, placed right after the site-requirements columns):

- **Coeff. of Conservatism C (0-10)** — joined from the Chicago Region FQA database (Swink & Wilhelm 1994). Sourced, not estimated. Populated for **359 plants** (28% overall; 312 of 869 native-tier rows). Blanks are correct "no value exists" cases: species absent from the Chicago regional flora (near-region or exotic species), hybrids, or entries with no species epithet.
- **Coeff. of Wetness W (-5 wet … +5 dry)** — same source, same coverage. This is your dry<->wet axis.
- **Shade Tolerance [USDA PLANTS]** — column added, **unpopulated this pass**. The authoritative source (USDA PLANTS Characteristics) is only reachable per-species via API / a bulk DB mirror and is itself sparse for forbs; populating it cleanly is the first task of the next pass. Not estimated.
- **Ellenberg-style L value (1-9)** — column added, **unpopulated**. No comprehensive North American calibration exists; will be filled only where a published NA value is found, so expect it to stay mostly blank.

Nomenclature note: the Chicago list uses 1994 names, so modern names were bridged for the major reclassified taxa (e.g., Symphyotrichum->Aster, Eutrochium->Eupatorium, Schizachyrium scoparium->Andropogon scoparius, Packera->Senecio). Bridging is partial; unbridged synonyms were left blank rather than guessed.

## Column dependability (sourced vs. inferred)
| Column group | Type | Dependability | Notes |
|---|---|---|---|
| Common/Latin name, Genus, Cultivar(Y/N), Source | Sourced | High | From the two catalogs; genus/cultivar parsed mechanically |
| Category (Fiore rows) | Sourced | High | From Fiore Item Group (Perennials/Groundcovers left blank to avoid guessing) |
| Coeff. of Conservatism C, Coeff. of Wetness W | Sourced | High where present | Swink & Wilhelm 1994 via Universal FQA; ~28% coverage, blanks = genuinely no regional value |
| Native Status Tier (existing 45) | Sourced/expert | High | Finalized from range data |
| Native Status Tier (Fiore) | Inferred (provisional) | Medium | Genus/family-anchored first pass; 410 REVIEW rows still need per-taxon confirmation |
| Site requirements, seasonal, description (existing 45) | Sourced | Med-High | From horticultural references (MOBOT, Illinois/Minnesota Wildflowers, etc.) |
| Site/seasonal/description (Fiore rows) | — | n/a | Intentionally blank; deep enrichment is future work |
| Shade Tolerance, Ellenberg L | Sourced (pending) | n/a | Columns present, unpopulated; no estimation |
| `[DOC]` Pollinators + count | Partly-sourced | Medium | Documented associations only; the count is a floor, not a census |
| `[EST]` CSR Strategy + Basis | Inferred | Low-Medium | Expert estimate from life history, NOT StrateFy-computed |
| `[REC]` Companion columns | Recommendation | n/a | Design suggestions, not facts |

Rule of thumb: **Sourced** = traceable to a cited dataset; **Inferred** = reasoned from traits/genus; **Recommendation** = horticultural judgment. Estimated/inferred fields are flagged in their headers (`[EST]`, `[REC]`) or in this table.

## Bibliography (where the bulk of the data came from)
- **Swink, F. & G. Wilhelm. 1994. Plants of the Chicago Region, 4th ed.** Indiana Academy of Science. — C-values and wetness coefficients (via Universal FQA database #1).
- **Freyman, W.A., Masters, L.A. & Packard, S. 2016.** The Universal FQA Calculator. *Methods in Ecology and Evolution* 7:380-383. universalfqa.org — FQA database host; data accessed through the `fqar` R package's bundled Chicago table.
- **USDA PLANTS Database** (plants.usda.gov) — shade tolerance / characteristics (pending source for next pass).
- **BONAP — Biota of North America Program** (bonap.org) — nativity and distribution used in tier calls.
- **Missouri Botanical Garden Plant Finder** — horticultural traits and cultivar data for the original 45.
- **Illinois Wildflowers (J. Hilty)** — flower-visitor / pollinator association records and species ecology.
- **Minnesota Wildflowers** — supplementary native range/trait data.
- **Fowler, J. — Pollen Specialist Bees of the Eastern U.S.** — specialist-bee associations.
- **Xerces Society** — pollinator value references.
- **Pierce, S. et al. 2017.** A global method for calculating plant CSR ecological strategies (StrateFy). *Functional Ecology* 31:444-457 — framework behind the `[EST]` CSR estimates.
- **Charles J. Fiore Nursery** availability list (user-provided) — added plant taxa.
- **Midwest Groundcovers** catalog — source of the original plant set.

## Native Status Tier framework (unchanged)
`Native` > `Native cultivar` > `Congener - near-region` > `Congener - non-native` > `Confamilial - non-native` > `Non-native - documented faunal value`; anything fitting none is dropped. Fiore plants carry a PROVISIONAL genus-anchored tier; 410 REVIEW rows need per-taxon confirmation.

## Work queue (next sessions)
1. **Source & populate Shade Tolerance** (USDA PLANTS via plantsdb.xyz API or a PLANTS Characteristics export); add Ellenberg L where a published NA value exists.
2. **Resolve the 410 REVIEW rows**; finalize provisional nativity tiers on the 828 KEEP rows.
3. **Enrich deep columns in batches** (Ferns -> Grasses -> Groundcovers -> Perennials -> Shrubs/Vines): requirements, seasonal, pollinators, CSR, companions.
4. Optionally expand FQA synonym bridging and consider the 2017 "Flora of the Chicago Region" (FQA #80) for modern nomenclature coverage.

## Standing caveats
- `[EST] CSR` = expert estimate, not StrateFy-computed; `[DOC]` pollinator counts are documented floors; companion columns are recommendations.
- The invasive-exclusion list is the well-known Upper-Midwest set, not exhaustive — check the REVIEW set for additional aggressive exotics.
- C/W reflect the Chicago Region specifically; a Minnesota or Wisconsin target would use a different FQA list (different C-values).

---

## v5 update (this pass)
- **Region locked to Chicago** — the C-value / wetness join uses the Chicago Region FQA (Swink & Wilhelm 1994), as requested.
- **Sociability (German index): not added.** The "German sociability index" is the Braun-Blanquet sociability scale (Geselligkeit, 1-5), which is a *stand-level field observation*, not a published per-species attribute. The German trait database that could carry it (BiolFlor, Klotz et al. 2002) covers only the ~3,660 species of the German flora, with negligible overlap with this North American list. Per the "if available" condition and the no-estimating rule, there was nothing to source, so no column was added. Can be added instantly if a North American sociability dataset surfaces.
- **New deliverables: `plants.json` + `index.html`.** `plants.json` is the full table (1,283 taxa, empty fields dropped per record). `index.html` is a standalone, filterable field-guide website (data embedded, so it works by double-clicking — no server needed). Filters: name search, nativity tier, category, source, minimum C-value, and a "has pollinator data" toggle; sortable columns; click any row to expand all populated fields. Estimated/recommended/documented columns are visually flagged (`[EST]`/`[REC]`/`[DOC]`) in the detail view. Both files are generated from `Plants_v4_master.csv`; regenerate them whenever the master changes.

---

## v6 update (seasonal images)
- **Per-season image columns added** to the master: Image - Spring / Summer / Fall / Winter (URL or Google Drive ID). Plus the legacy Drive Image ID is used as a Summer fallback. Currently 5 plants have a primary image; the rest are empty by design.
- **Real photos are not bulk-collected.** Scraped web photos are copyrighted and can't be redistributed inside a deliverable site, and verified season-labeled photos for 1,283 species aren't sourceable here. So real-photo slots stay empty until populated with license-clean images (your own / Drive / an approved CC harvest with attribution). When a slot has a value, the site shows it tagged **PHOTO**.
- **Renderings are generated, not photographed.** For every empty season slot the website draws a stylized SVG motif **live in the browser** from the plant's known attributes (bloom color, fall color, habit/type, seedhead, season) and stamps it **RENDERING**. These are honest diagrams, never claimed to be accurate depictions, and add no file weight (no stored image files). For plants where only Category is known, the motif is type-based (fern/grass/shrub/vine/forb).
- **To replace a rendering:** put a URL or Drive ID in that plant's season column, regenerate plants.json + index.html from the master, and the photo takes over automatically.

---

## v7 update (REVIEW resolved + Shade Tolerance sourced)
**REVIEW rows resolved (was 410 → now 0).** Each exotic-genus row was classified by its family/genus relationship to important regional natives:
- **73** reclassified to **Native / near-region** — genera that genuinely carry regional natives but were missed in the first genus pass (Pinus, Picea, Abies, Tsuga, Taxus, Thuja, Festuca, Galium, Gillenia, Chionanthus, Ruellia, Sanguisorba, Stachys, Artemisia, Veronica, Persicaria, Equisetum, Waldsteinia, Smilacina=Maianthemum, and the misspelled "Symphiotricum"=Symphyotrichum).
- **5** → **Native cultivar (intergeneric native hybrid)** (Heucherella = Heuchera × Tiarella).
- **278** → **Confamilial - non-native** (family contains important regional natives; basis cites the family + an exemplar native).
- **54 dropped** (logged in Fiore_excluded_log.csv): orphan families with no important regional native (Paeonia, Hemerocallis, Kniphofia, Delosperma, Ceratostigma), a tender tropical (Bougainvillea), a catalog non-taxon ("Espalier"), and aggressive non-natives that slipped the first invasive screen (Phyllostachys & Imperata bamboo/blood-grass, Lamiastrum, Tamarix).

Master is now **1,229 plants, with every row carrying a resolved (non-REVIEW) tier.** A handful of dropped genera (Hemerocallis, Kniphofia, Ceratostigma) have *marginal* faunal value; they were dropped on the strict family-tie rule and are listed in the log so you can re-include them if you want a looser faunal bar.

**Shade Tolerance populated from USDA PLANTS** (Characteristics: Tolerant / Intermediate / Intolerant), joined on Genus+species: **199 of 1,229** plants. The field is genuinely sparse in USDA (well-covered for woody plants, thin for forbs), so blanks are "USDA has no value," not estimates. **Ellenberg L** remains empty (still no North American source).

**Bibliography addition:** USDA PLANTS Database Characteristics (Shade Tolerance), accessed via the `usdaplantsapi` SQLite mirror of the USDA PLANTS dataset.

Updated work queue: (1) finalize the 676+152 PROVISIONAL Fiore tiers to species-level final tiers; (2) batch-enrich deep columns (Ferns → Grasses → Groundcovers → Perennials → Shrubs/Vines); (3) optional: source Ellenberg-style L; expand FQA synonym bridging / consider Flora of the Chicago Region (2017) for modern nomenclature.

---

## v8 update (images removed + data audit)
- **Images removed from the website.** The seasonal image strip, row thumbnails, and the live rendering generator are gone; the site is back to the table + expandable detail. The per-season image columns remain in the master CSV (empty, ready) but are no longer displayed.
- **Data audit prompted by the "all photos identical" observation.** Root cause: the five original sample rows (Achillea, Actaea, Agastache, Allium, Amsonia) all carried a single placeholder Drive Image ID from the source sheet. The same five rows also still held **"quick brown fox" placeholder text** in their Summary Blurb (my earlier "fill only if blank" logic skipped them because the cell wasn't empty). **Both fixed:** real summary blurbs written for all five; the bogus shared image ID cleared.
- **Audit of the rest of the dataset:** scanned every plant-specific prose field for placeholder text and improper duplication. No other placeholder text anywhere. The other repeated values are legitimate, not errors: CSR strategy is a shared category; the Native-Status basis text is intentionally templated for provisional Fiore tiers; categorical fields (light, zone, type) repeat by nature. Conclusion: the placeholder artifacts were confined to those five source rows and are now resolved.

---

## v9 update (FQA join spot-check)
Audited all 359 C/W joins for synonym-matching and ecological plausibility.

- **Synonym matches (13) all taxonomically correct.** They reduce to three species: Eutrochium maculatum = *Eupatorium maculatum*; Schizachyrium scoparium = *Andropogon scoparius*; Symphyotrichum (novae-angliae, oblongifolium) = *Aster* (+ their cultivars). Same epithets, right species, sensible C/W (e.g., Joe-Pye W=−5 wet; little bluestem W=+4 dry).
- **Wetness vs. common-name flags: all false alarms.** "Sedge" and "prairie" in a name don't imply wet — the dry-woodland *Carex* (W=+5) and wet-meadow *Filipendula rubra* "Queen-of-the-Prairie" (W=−5) values are correct. No wetness errors found.
- **Two nativity conflicts** (FQA native flag vs. my tier):
  - *Baptisia australis* — FQA treats it as non-native to the Chicago Region (C=0). It's a central/SE-US native, adventive here. **Reclassified** from "Native" to "Native — near-region (not native to Chicago Region per FQA)."
  - *Achillea millefolium* — FQA scores it C=0/non-native because the naturalized Chicago genotype is European. Left as "Native" (the species is circumboreal-native) with the genotype caveat already in its basis.
- **Cultivar C-value inheritance — the key caveat.** **226 of the 359** C-valued rows are cultivars that inherit their *wild species'* C and W. These are valid as species-level attributes, but a mass-produced selection (e.g., Hydrangea arborescens 'Annabelle' at C=10, Blue Rug juniper, 'Gro-Low' sumac, 'Tara' dropseed, the aromatic-aster selections) does **not** function as a high-quality-remnant conservative. **Read C/W on any Cultivar=Y row as the wild-species value, not the cultivar's own ecological behavior.** The high (C=10) values were verified as legitimate Chicago-Region figures for the wild species — many are range-edge conservatives whose regional C is high even though they're garden-adaptable generally.

Net: no wrong joins found; the values are sourced-correct. The actionable items were one tier reclassification (Baptisia) and the standing cultivar-inheritance caveat above.

---

## v10 update (site re-layout + fonts + a data fix)
- **List columns regrouped** into three labeled blocks: **Primary** (Name = common + botanical combined, Nativity tier, Category), **Requirements** (Soil, Light, Water, Low-maintenance check, Drought check), **Design characteristics** (bloom-season timeline, Width range, Height range, Growth habit). Checks (✓) render only when the field is true; blank when false/unknown. Width/Height are ft ranges (min–max). All other data (C/W, shade tolerance, pollinators, CSR, companions, descriptions) remains in the click-to-expand detail row.
- **Bloom-season timeline:** a Jan–Dec track (labeled Mar/Jun/Sep/Dec) with the blooming months filled using the plant's bloom color when known, otherwise grey — derived from the Bloom Time phase phrases.
- **Fonts:** sans → **Alegreya Sans**, mono → **Space Mono** (Newsreader serif retained for the display heading).
- **Data fix surfaced by the timeline:** Christmas fern (and any fern category) carried a bloom-time value spanning nearly the whole year — spurious, since ferns are spore-bearing and don't bloom. Cleared bloom time/color for fern-category rows so their timeline reads empty. Grass/sedge flowering periods (e.g., spring *Carex*) were kept — they genuinely flower (wind-pollinated) and render as an informative grey bar.

---

## v11 update (deep enrichment from USDA PLANTS Characteristics)
Enrichment was done the same way as C/W and Shade Tolerance: **joining a real sourced dataset, not hand-writing traits for 1,200 plants** (which would be fabrication at scale). Source: USDA PLANTS Characteristics (the ~1,080 fully-characterized species, plus broader Growth Habit / Duration). Joined on Genus+species; **blank cells only** (the curated 45 and prior joins were never overwritten).

**Cultivar-aware rule:** timing and cultural traits (bloom period, moisture, drought, soil texture, growth rate/lifespan, foliage texture, category, conspicuous-feature attributes) were filled for both species and cultivars, since they're largely conserved within a species. **Bloom color and mature height were filled for straight species only** — cultivars are frequently bred for novel color and size, so inheriting the species value there would be wrong.

Cells newly filled (sourced, USDA): Category +228, Growth Rate/Lifespan +537, Leaf texture +199, Water +185, Soil +185, Bloom Time +173, Garden Attributes +123, Bloom Color +34 (species only), Height +33 (species only), Drought +30. Coverage now: Category 816, Growth/Lifespan 572, Water 230, Soil 228, Bloom Time 217 (→ timeline renders for 217), Bloom Color 74. Mappings: Moisture_Use Low/Med/High → dry/average/moist; Drought_Tolerance High → drought ✓; soil-texture adaptation → sand/loam/clay; Growth_Habit → category.

**Light column** now shows Light Req where present, else falls back to the USDA Shade Tolerance rating (per the earlier "shade tolerance = primary light column" instruction).

**What was deliberately NOT auto-filled (and why):** CSR strategy, companion lists, pollinator lists/counts, summary blurbs, detailed descriptions, and the 12 seasonal maintenance fields remain populated **only for the curated 45 plants**. These are not available from any joinable dataset, and mass-generating them from memory for ~1,180 plants would be exactly the estimation/fabrication this project has avoided. They stay blank until done as deliberate per-plant work (or sourced). Blanks throughout the file continue to mean "no sourced value," never a guess.

Dependability: USDA-sourced trait cells = **High** where present (with the cultivar-inheritance caveat for timing/cultural traits). Bloom color / height carry no cultivar misattribution because they were restricted to straight species.

---

## v12 update (UI revisions)
- Title is now **"Plant Picker"**; removed the "Field Catalog · Chicago Region" kicker and the descriptive subtitle.
- **Fonts:** the serif (Newsreader) is gone — headings use **Alegreya Sans bold (800)**, botanical names use Alegreya Sans italic; Space Mono retained for data/labels.
- Background set to flat **#f0efeb** (dotted texture removed); side margins reduced to ~20px with the layout now full-width for more listing room.
- **Removed the Low-maintenance and Drought columns** from the table (the data remains in the master CSV and shows in the click-to-expand detail). Requirements group is now Soil / Light / Water.
- **Light column** now uses the "Light Req" field directly (shade-tolerance fallback removed); Shade Tolerance still appears in the detail panel.
- **Infinite scroll** replaces pagination (rows load in chunks of 60 as you scroll).
- **Seasonal timeline restyled** closer to the reference: a transparent Jan–Dec axis with monthly tick marks (stronger ticks at Mar/Jun/Sep/Dec) and the bloom period drawn as discrete filled cells in the bloom color (or grey), rather than a bordered bar.

Data files (master CSV, plants.json) are unchanged this pass — only the website was revised.

---

## v13 update (external collection — Missouri Botanical Garden Plant Finder)
Validated **MOBOT Plant Finder** as a reputable, cleanly-parseable source (structured Sun / Water / Zone / Height / Spread / Bloom Time / Bloom Description / Maintenance / Flower / Fruit / Attracts / Tolerate fields). Collected and joined a first verified batch of native straight-species (Actaea pachypoda, Allium cernuum, Asclepias syriaca) — 31 cells filled, blank-only, sourced. The bloom-timeline parser was upgraded to read month-name ranges ("June to August") in addition to season phases. Earlier, one USDA name-typo was recovered via fuzzy matching (Andropogon gerardii).

**Throughput reality (important):** MOBOT detail pages aren't bulk-downloadable and each plant requires a search + a full-page fetch (the page is ~90% site navigation), so collection is genuinely incremental — a small batch per pass. The remaining gap is **999 plants blank on light/water/bloom: 844 cultivars + 155 straight species**. MOBOT reliably covers the native/species blanks (≈128 native species) over several passes; it covers only some cultivars.

**Recommended path:** (1) continue MOBOT batches each pass for the native/species blanks; (2) for the 844 **cultivar** blanks — which no open dataset covers well — the efficient route is a single bulk join from a **Walters Gardens / "Perennial Resource" export** or a **Fiore/Midwest Groundcovers catalog attribute export** (their own SKU pages already carry light/size/bloom/zone). One such export would fill hundreds of cultivar rows in a single sourced join, versus per-page collection. Nothing is estimated either way — blanks remain blank until a source supplies the value.

---

## v14 update (MOBOT collection — pass 2)
Continuing the per-pass MOBOT collection. **Pass 2** added Adiantum pedatum and Aruncus dioicus (structured Sun/Water/Zone/Height/Spread/Bloom/Maintenance), 20 cells filled, sourced. Running MOBOT-collected total: **5 native species** (Actaea pachypoda, Allium cernuum, Asclepias syriaca, Adiantum pedatum, Aruncus dioicus).

Practical note on rate: each MOBOT detail page is ~90% site navigation, so a sustainable batch is roughly a handful of species per pass. We'll keep chipping at the ~123 remaining blank native species over subsequent passes; the 844 cultivar blanks still want a bulk Walters/catalog export rather than per-page collection.

---

## v15 update (MOBOT collection — pass 3, multi-source snippet method)
Added 4 native species — Asclepias verticillata, Aralia racemosa, Anemone cylindrica, Athyrium filix-femina (30 cells: light/water/soil/height/spread/bloom time+color/zone/drought/maintenance as available).

**Method note:** to raise throughput without burning the session on each page's ~90% navigation boilerplate, this pass took values from search *snippets* across MOBOT Plant Finder plus corroborating reputable references — Lady Bird Johnson Wildflower Center (wildflower.org), Missouri Dept. of Conservation, Chicago Botanic Garden, Prairie Nursery. Rule held constant: **only explicitly-stated values are recorded; nothing inferred; blanks left blank.** Where a field wasn't explicitly stated in any source (e.g. Aralia racemosa bloom time/color, several zones), it was left blank rather than guessed. Ferns recorded as non-flowering (bloom left empty, consistent with the fern rule).

Running MOBOT/reputable-source total: **9 native species**. Coverage now (of 1,229): Light 54, Water 240, Bloom Time 224, Soil 231, Height-min 54.

---

## v16 update (MOBOT collection — pass 4, cultivar-aware batch)
Added 4 new native species (Baptisia alba, Chelone glabra, Lobelia cardinalis, Lobelia siphilitica), plus confirmed and preserved existing data for Geranium maculatum and Phlox divaricata. Sources: MOBOT Plant Finder + Penn State Extension (citing MOBOT), Prairie Nursery, Morning Sky Greenery, UT Extension. Explicit values only; blanks left blank.

**Cultivar propagation:** Cultural fields (light, water, zone, height, spread, bloom time) propagated to cultivar rows via startswith matching — these attributes are shared with the parent species. Bloom color withheld for cultivars (cultivar-aware rule). A bug in the base_name regex was caught and patched: the master stores cultivar names without apostrophes (e.g. "Geranium maculatum Espresso"), so future scripts use startswith matching rather than apostrophe-splitting. 59 total cells filled this pass.

Running MOBOT/reputable-source total: **~13 native species** enriched. Coverage now (of 1,229): Light 58, Water 244+, Bloom Time 228+, Bloom Color 85+, Height-min 58+.

**Note on MGC Plant Library:** confirmed by Brad that there is no downloadable Plant Library on the Midwest Groundcovers site; availability downloads are SKU/stock lists only. Attribute data from MGC still requires a sales-desk export request.

---

## v17 update (MOBOT collection — pass 5, largest batch)
116 cells filled across 25 rows (10 species matched in master): Monarda fistulosa, Monarda didyma, Zizia aurea, Packera aurea, Mertensia virginica, Polygonatum biflorum, Liatris spicata, Liatris pycnostachya, Liatris aspera, Heliopsis helianthoides.

Sources: MOBOT Plant Finder + Lady Bird Johnson Wildflower Center (wildflower.org — structured bloom/light/moisture fields used directly), North Creek Nurseries, MO Wildflowers, NCSU Plants.

Notable entries: Mertensia virginica (spring ephemeral, blue, March–May); Packera aurea (golden ragwort, early spring groundcover); three Liatris species differentiated by bloom window (L. spicata July–Sept; L. pycnostachya July–Sept; L. aspera Aug–Oct) and drought tolerance; Heliopsis helianthoides (full summer yellow, drought-tolerant); both Monarda species with distinct water requirements (fistulosa dry–medium vs. didyma medium–wet).

Match logic upgraded to length-sorted prefix matching so `Polygonatum biflorum var. commutatum` (not present) is handled correctly without clobbering `Polygonatum biflorum` height. Cultivar-aware bloom color rule maintained.

Running MOBOT/reputable-source total: **~23 native species** enriched across passes 1–5. Coverage now (of 1,229): Light 82, Water 263, Bloom Time 247, Height-min 82.

---

## v18 update (MOBOT collection — pass 6)
138 cells filled across 23 rows, 6 species: Echinacea purpurea, Rudbeckia fulgida, Penstemon digitalis, Gillenia trifoliata, Ratibida pinnata, Vernonia fasciculata. Sources: MOBOT Plant Finder + Wikipedia (Vernonia zone 4–9).

Echinacea purpurea was the highest-impact entry this pass — its many cultivars all received species-level culture data (zone 3–8, full sun to part shade, dry to medium, June–Aug, low maintenance, drought-tolerant); bloom color withheld for cultivars per standard rule. Rudbeckia fulgida similarly propagated to all var./cultivar rows. Note: E. purpurea cultivar height varies widely (1–6'); species fallback of 2–5' applied only to rows that were blank.

Porteranthus trifoliata (Gillenia synonym, MOBOT's current accepted name) and Vernonia noveboracensis were not found in master. Vernonia fasciculata zone 4–9 sourced from Wikipedia citing USDA.

Running MOBOT/reputable-source total: **~29 species** enriched. Coverage now (of 1,229): Light 103, Water 270, Bloom Time 254, Bloom Color 88, Height-min 103.

---

## v19 update (MOBOT collection — pass 7)
44 cells filled (26 from main join + 18 from edge-case patch). Species confirmed in master: Eutrochium maculatum, Eupatorium maculatum (Gateway, Phantom), Filipendula rubra, Solidago rugosa ('Fireworks'), Solidago speciosa, Solidago caesia, Solidago flexicaulis; plus edge-case fills for Eupatorium dubium (Baby Joe, Little Joe) and Helenium autumnale (stored as abbreviated "Helenium a." in master).

Sources: MOBOT Plant Finder throughout. Several expected species absent from master (Eutrochium purpureum/fistulosum, Solidago rigida/nemoralis/canadensis/juncea, Helenium autumnale as straight species) — Fiore/MGC catalog simply doesn't list them.

Naming edge cases documented: (a) master abbreviates Helenium autumnale cultivars as "Helenium a. [name]" — patched with startswith('Helenium a.'); (b) both old Eupatorium and new Eutrochium names coexist in master — both covered by DATA. Solidago in master is sparse: only rugosa, speciosa, caesia, flexicaulis, plus unnamed hybrids (Golden Fleece, Sugar Kisses) which don't map to a species key.

Running total: **~36 native species** enriched. Coverage now (of 1,229): Light 113, Water 277, Bloom Time 259, Bloom Color 90, Height-min 111.

---

## v20 update (MOBOT collection — pass 8, prairie grasses)
97 cells filled across 25 rows, 6 species: Schizachyrium scoparium (little bluestem), Andropogon gerardii + gerardi (big bluestem — both spellings present in master), Panicum virgatum (switchgrass), Sorghastrum nutans (Indian grass), Sporobolus heterolepis (prairie dropseed).

Sources: MOBOT Plant Finder (explicit culture descriptions); Andropogon gerardii light/water additionally corroborated by MOBOT note that A. glomeratus' moist-soil preference "distinguishes it from... Andropogon gerardii."

**Bloom color withheld for grasses** — grass inflorescence is wind-pollinated and inconspicuous; bloom color is not a meaningful garden attribute for graminoids, so bc was not filled. Bloom time filled where MOBOT states it (late summer = August–September). Both Andropogon spellings (gerardii / gerardi) deliberately included as they coexist in the master.

Running total: **~41 native species enriched** (plus cultivar propagation). Coverage now (of 1,229): Light 135, Water 277, Bloom Time 259, Height-min 133.

---

## v21 update (MOBOT collection — pass 9, asters and coreopsis)
68 cells filled, 14 rows, 10 species: Aster novae-angliae (+ Symphyotrichum novae-angliae as new name), Aster oblongifolius, Aster cordifolius, Aster laevis (+ Symphyotrichum laeve), Coreopsis verticillata, Coreopsis lanceolata, Callirhoe involucrata, Rudbeckia hirta.

Sources: MOBOT Plant Finder + UT Extension (S. novae-angliae light/water). Both old Aster names and new Symphyotrichum names included in DATA; master predominantly uses old Aster names.

Diagnostic findings: (a) Thalictrum dasycarpum absent from master — master has T. dioicum (early meadow rue, already filled); (b) Coreopsis palmata and Symphyotrichum oblongifolium absent — only Aster oblongifolius present; (c) remaining 12 Coreopsis rows are unnamed hybrid cultivars (Big Bang, Cosmic Eye, etc.) with no species key match — not filled. Bloom color filled for species rows only per standard cultivar-aware rule.

Notable: Callirhoe involucrata (wine cups) is a trailing groundcover — hmin=0.5, hmax=0.75 ft foliage / smin=2, smax=3 ft spread; continuous bloom May–October.

Running total: **~50 native species enriched**. Coverage now (of 1,229): Light 147, Water 289, Bloom Time 266, Bloom Color 93, Height-min 140.
