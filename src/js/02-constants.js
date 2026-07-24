/* Constants — months, filter definitions, color groups, tier order */
/* ── Visual month order (Mar–Feb) ────────────────────────────────────────── */
const VIS_MONTHS = [
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
];
const VIS_CAL = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1]; /* calendar index for each visual slot */

/* ── Filter definitions ──────────────────────────────────────────────────── */
const CATS = ['flower', 'shrub', 'grass', 'vine', 'fern', 'sedge'];

const GARDEN_ATTRS = [
  {
    l: 'Pollinator Friendly',
    t: (p) =>
      /attracts (pollinator|butterfl|bee|hummingbird|bird)|pollinator friendly|nectar|attracts wildlife/.test(
        (p['Garden Attributes'] || '').toLowerCase(),
      ),
  },
  {
    l: 'Fragrant',
    t: (p) => /fragran|aromatic/.test((p['Garden Attributes'] || '').toLowerCase()),
  },
  {
    l: 'Deer Resistant',
    t: (p) => /deer[\s-]resistant/.test((p['Garden Attributes'] || '').toLowerCase()),
  },
  { l: 'Attractive Seedhead', t: (p) => !!p['Attractive Seedhead Time'] },
  {
    l: 'Long Bloomtime',
    t: (p) => /long[\s-]bloom|rebloom/.test((p['Garden Attributes'] || '').toLowerCase()),
  },
  {
    l: 'Fall Color',
    t: (p) =>
      /fall color|fall interest|four-season/.test((p['Garden Attributes'] || '').toLowerCase()),
  },
  {
    l: 'Showy Fruit',
    t: (p) => /showy fruit|berr/.test((p['Garden Attributes'] || '').toLowerCase()),
  },
  { l: 'Evergreen', t: (p) => /evergreen/.test((p['Garden Attributes'] || '').toLowerCase()) },
  {
    l: 'Colorful Foliage',
    t: (p) =>
      /colorful foliage|colored foliage|variegat|silver foliage|burgundy foliage/.test(
        (p['Garden Attributes'] || '').toLowerCase(),
      ),
  },
  {
    l: 'Groundcover',
    t: (p) =>
      /ground[\s-]?cover|weed[\s-]suppress|mat-forming/.test(
        (p['Garden Attributes'] || '').toLowerCase(),
      ),
  },
  {
    l: 'Textural Specimen',
    t: (p) =>
      /textur|specimen|bold texture|feathery|architectural/.test(
        (p['Garden Attributes'] || '').toLowerCase(),
      ),
  },
  {
    l: 'Workhorse',
    t: (p) =>
      /workhorse|\btough\b|adaptable|\beasy\b|reliable/.test(
        (p['Garden Attributes'] || '').toLowerCase(),
      ),
  },
  { l: 'Edible', t: (p) => /edible/.test((p['Garden Attributes'] || '').toLowerCase()) },
  {
    l: 'Cut & Dry',
    t: (p) =>
      /cut flower|dried|cut[\s&-]+dry|for cutting/.test(
        (p['Garden Attributes'] || '').toLowerCase(),
      ),
  },
  { l: 'Border', t: (p) => /\bborder\b/.test((p['Garden Attributes'] || '').toLowerCase()) },
];

const COLOR_GROUPS = [
  { l: 'White', css: '#e8e4dc', txt: '#23211b', m: (bc) => /white|cream|ivory/.test(bc) },
  { l: 'Yellow', css: '#d4a010', txt: '#23211b', m: (bc) => /yellow|gold/.test(bc) },
  { l: 'Orange', css: '#d9772b', txt: '#fff', m: (bc) => /orange|copper/.test(bc) },
  { l: 'Red', css: '#b23a2e', txt: '#fff', m: (bc) => /\bred\b|scarlet/.test(bc) },
  { l: 'Pink', css: '#d98aa6', txt: '#23211b', m: (bc) => /pink|rose|salmon|coral/.test(bc) },
  { l: 'Purple', css: '#7c5a96', txt: '#fff', m: (bc) => /purple|violet|magenta/.test(bc) },
  { l: 'Lavender', css: '#a594c0', txt: '#23211b', m: (bc) => /lavender/.test(bc) },
  { l: 'Blue', css: '#5b7fb0', txt: '#fff', m: (bc) => /\bblue\b|indigo/.test(bc) },
  { l: 'Green', css: '#5d7a4e', txt: '#fff', m: (bc) => /\bgreen\b/.test(bc) },
];

const HABITS = [
  'upright clump',
  'mound',
  'rounded shrub',
  'upright shrub',
  'spreading mat',
  'spreading clump',
  'spreading mound',
  'climbing vine',
  'rounded mound',
  'fountain clump',
  'arching clump',
  'arching shrub',
  'thicket-forming shrub',
  'vertical spike',
  'architectural rosette',
];

const LEAF_ATTRS = [
  { l: 'Fine', m: /\bfine\b/ },
  { l: 'Medium', m: /\bmedium\b/ },
  { l: 'Coarse', m: /\bcoarse\b/ },
  { l: 'Compound', m: /compound/ },
  { l: 'Lobed', m: /lobed/ },
  { l: 'Aromatic', m: /aromatic/ },
  { l: 'Evergreen', m: /evergreen/ },
  { l: 'Succulent', m: /succulent/ },
  { l: 'Variegated', m: /variegated/ },
];

const FLOWER_SHAPES = [
  'Daisy/Head',
  'Spike',
  'Raceme',
  'Panicle',
  'Plume',
  'Flat cluster',
  'Umbel',
  'Spherical',
  'Trumpet',
  'Truss',
  'Whorl',
  'Solitary',
  'Catkin',
  'Insignificant',
];

const WATERS = [
  { l: 'Dry', m: 'dry' },
  { l: 'Average', m: 'average' },
  { l: 'Medium', m: 'medium' },
  { l: 'Moist', m: 'moist' },
  { l: 'Wet', m: 'wet' },
];
const LIGHTS = [
  { l: 'Full Sun', m: 'full sun' },
  { l: 'Part Sun', m: 'part sun' },
  { l: 'Part Shade', m: 'part shade' },
  { l: 'Full Shade', m: 'full shade' },
];

const SOIL_ATTRS = [
  { l: 'Well-drained', m: 'well-drained' },
  { l: 'Average', m: 'average' },
  { l: 'Moist', m: 'moist' },
  { l: 'Rich', m: 'rich' },
  { l: 'Loam', m: 'loam' },
  { l: 'Clay', m: 'clay' },
  { l: 'Sandy', m: 'sand' },
  { l: 'Acidic', m: 'acidic' },
  { l: 'Rocky/Poor', m: 'rocky' },
];

/* Default ordering: nativity tier (Native first), then common name A-Z */
const TIER_ORDER = [
  'Native',
  'Native cultivar',
  'Provisional: native cultivar/congener',
  'Provisional: native/near-region',
  'Near-region congener',
  'Confamilial',
  'Non-native congener',
  'Non-native (faunal value)',
];
function tierRank(t) {
  const i = TIER_ORDER.indexOf(t);
  return i < 0 ? TIER_ORDER.length : i;
}
