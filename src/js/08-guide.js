/* Garden guide export — build a package of .md files for iA Writer.
 *
 * The inventory's `Download .md` produces a zip, not a single document. iA
 * Writer assembles a finished guide from content blocks, so the export has to
 * ship the pieces plus a head file that transcludes them in order. Everything
 * the guide references travels inside the zip, including copies of the task
 * prose, so the package resolves wherever it is dropped.
 */

/* ── season model ─────────────────────────────────────────────────────────
 * Season is the primary section, the portion within it a subhead. The plant
 * data carries eight seasonal keys plus a non-seasonal `general`; the four
 * portions with no data source appear only when a garden task maps to them.
 */
const SEASON_GROUPS = [
  [
    'spring',
    'Spring',
    [
      ['early_spring', 'Early spring', 'earlySpring'],
      ['mid_spring', 'Mid spring', null],
      ['late_spring', 'Late spring', 'lateSpring'],
    ],
  ],
  [
    'summer',
    'Summer',
    [
      ['early_summer', 'Early summer', 'earlySummer'],
      ['mid_summer', 'Mid summer', 'midSummer'],
      ['late_summer', 'Late summer', 'lateSummer'],
    ],
  ],
  [
    'fall',
    'Fall',
    [
      ['early_fall', 'Early fall', 'earlyFall'],
      ['mid_fall', 'Mid fall', 'midFall'],
      ['late_fall', 'Late fall', 'lateFall'],
    ],
  ],
  [
    'winter',
    'Winter',
    [
      ['early_winter', 'Early winter', null],
      ['mid_winter', 'Mid winter', null],
      ['late_winter', 'Late winter', null],
    ],
  ],
];

/*
 * Which garden-wide tasks belong to which portion of the year. The general
 * task files are not season-keyed the way plant rules are, so this mapping is
 * an editorial decision rather than something derived from the data: watering
 * and weeding recur through the growing season, cleanups anchor their ends,
 * and tool care lands in the one period with nothing else in it.
 */
const GENERAL_BY_SEASON = {
  early_spring: ['spring_cleanup', 'soil_improvement', 'feeding'],
  mid_spring: ['weeding'],
  late_spring: ['weeding', 'mulching'],
  early_summer: ['watering', 'weeding', 'deadleafing'],
  mid_summer: ['watering', 'weeding', 'deadleafing', 'pests_and_disease'],
  late_summer: ['watering', 'weeding', 'deadleafing', 'pests_and_disease'],
  early_fall: ['weeding', 'pests_and_disease'],
  mid_fall: ['fall_cleanup'],
  late_fall: ['fall_cleanup', 'mulching'],
  mid_winter: ['tool_care'],
};

const TAG_TO_FILE = {
  cutback: 'cutback',
  deadhead: 'deadhead',
  deadleaf: 'deadleaf',
  shear: 'shear',
  prune: 'prune',
  thin: 'thin',
  pinch: 'pinch',
  divide: 'divide',
  'edit-seedlings': 'edit_seedlings',
  contain: 'contain',
  'water-establish': 'water_establish',
  'water-deep': 'water_deep',
  mulch: 'mulch',
  stake: 'stake',
  space: 'space',
  'plant-timing': 'plant_timing',
  'leave-stems': 'leave_stems',
  'leave-seedheads': 'leave_seedheads',
  monitor: 'monitor',
};

/* ── zip writer (store only, no compression) ──────────────────────────────
 * A real dependency would be a build change for one feature. Store-only zips
 * are valid archives that Finder, iA Writer, and every unzip tool accept; the
 * files are markdown, so compression buys little against the cost of pulling
 * in a library.
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipBlob(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;

  const u16 = (n) => [n & 0xff, (n >>> 8) & 0xff];
  const u32 = (n) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

  files.forEach((f) => {
    const nameBytes = enc.encode(f.name);
    const body = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(body);
    // DOS timestamp is fixed; the archive carries no meaningful mtime and a
    // stable value keeps successive exports byte-comparable.
    const local = [].concat(
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0x21),
      u32(crc),
      u32(body.length),
      u32(body.length),
      u16(nameBytes.length),
      u16(0),
    );
    chunks.push(new Uint8Array(local), nameBytes, body);
    central.push({ nameBytes, crc, size: body.length, offset });
    offset += local.length + nameBytes.length + body.length;
  });

  const cdStart = offset;
  central.forEach((e) => {
    const h = [].concat(
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0x21),
      u32(e.crc),
      u32(e.size),
      u32(e.size),
      u16(e.nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(e.offset),
    );
    chunks.push(new Uint8Array(h), e.nameBytes);
    offset += h.length + e.nameBytes.length;
  });

  chunks.push(
    new Uint8Array(
      [].concat(
        u32(0x06054b50),
        u16(0),
        u16(0),
        u16(central.length),
        u16(central.length),
        u32(offset - cdStart),
        u32(cdStart),
        u16(0),
      ),
    ),
  );
  return new Blob(chunks, { type: 'application/zip' });
}

/* ── helpers ──────────────────────────────────────────────────────────────*/
/*
 * Folder name from the street address: '1200 Maple Drive' → '1200_MapleDr'.
 * Anything after the first comma is city and state, which the client already
 * knows and which would only lengthen the name. The street suffix is
 * abbreviated so the folder stays short enough to read in a file list.
 */
const STREET_SUFFIX = {
  street: 'St', st: 'St', drive: 'Dr', dr: 'Dr', avenue: 'Ave', ave: 'Ave', av: 'Ave',
  road: 'Rd', rd: 'Rd', lane: 'Ln', ln: 'Ln', court: 'Ct', ct: 'Ct',
  boulevard: 'Blvd', blvd: 'Blvd', place: 'Pl', pl: 'Pl', terrace: 'Ter', ter: 'Ter',
  circle: 'Cir', cir: 'Cir', parkway: 'Pkwy', pkwy: 'Pkwy', highway: 'Hwy', hwy: 'Hwy',
  trail: 'Trl', trl: 'Trl', square: 'Sq', sq: 'Sq', way: 'Way',
};

function addressFolder(address) {
  const street = String(address || '').split(',')[0].trim();
  if (!street) return 'Garden_Guide';
  const words = street.split(/\s+/).filter(Boolean);
  let number = '';
  if (/^[\d-]+[a-z]?$/i.test(words[0])) number = words.shift();
  const name = words
    .map((w) => {
      const bare = w.replace(/[^A-Za-z]/g, '').toLowerCase();
      if (STREET_SUFFIX[bare]) return STREET_SUFFIX[bare];
      const clean = w.replace(/[^A-Za-z0-9]/g, '');
      return clean ? clean[0].toUpperCase() + clean.slice(1) : '';
    })
    .join('');
  return [number, name].filter(Boolean).join('_') || 'Garden_Guide';
}

/*
 * Split the compiled tool list into what a garden cannot be maintained
 * without and what makes the work easier. The test is whether a task in this
 * guide becomes impossible without the item, not whether it is nice to own.
 */
const TOOL_ESSENTIAL = [
  'hand pruners', 'pruners', 'gloves', 'spade', 'garden fork', 'fork', 'rake',
  'watering can', 'hose', 'bucket', 'tub', 'shovel', 'hedge shears', 'shears',
  'loppers', 'snips', 'pruning saw', 'hand saw', 'wheelbarrow', 'weeding knife',
  'bags', 'tarp', 'stakes', 'twine', 'plant ties',
];

function isEssentialTool(name) {
  const n = name.toLowerCase();
  // exact, or the entry is the head of the phrase. A trailing match would put
  // 'Soaker hose' under necessities on the strength of 'hose'.
  return TOOL_ESSENTIAL.some((t) => n === t || n.startsWith(t + ' '));
}

/*
 * Pull the bullet list out of a task file's `##### Tools` section and reduce
 * each line to bare tool names.
 *
 * Inside a task, a tool is written with the context that makes it useful:
 * 'Hedge shears, for clumps wider than about 2ft'. Collected across a dozen
 * tasks those qualifiers turn a shopping list into noise, and they collide:
 * 'Hand pruners', 'Hand pruners, or snips for thin stems', and 'Snips or hand
 * pruners' are three lines naming two tools. So the qualifier after the first
 * comma is dropped, alternatives and pairs are split apart, and the result is
 * deduplicated. The full phrasing survives untouched inside the task file,
 * which is where the context still earns its place.
 */
function toolsFromTask(md) {
  const m = /^##### Tools\s*\n([\s\S]*?)(?:\n#{1,5} |\s*$)/m.exec(md || '');
  if (!m) return [];
  const out = [];
  m[1]
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
    .forEach((line) => {
      line
        .split(',')[0]
        .split(/\s+(?:or|and)\s+/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
        .forEach((s) => out.push(s[0].toUpperCase() + s.slice(1)));
    });
  return out;
}

/* ── guide builder ────────────────────────────────────────────────────────*/
function buildGuideFiles(plants, answers) {
  const files = [];
  const usedPlantTasks = new Set();
  const usedGeneralTasks = new Set();

  /* resolve every selected plant once */
  const resolved = plants.map((p) => ({ p, by: resolveMaintenance(p) }));

  /* season sections: h2 season, h3 portion, h4 task titles from the pool
   *
   * Plant names sit as bold labels rather than headings. A heading there would
   * have to be h4, colliding with the task titles the content blocks bring in,
   * and the plant is a grouping label for the tasks beneath it rather than a
   * section of its own.
   */
  const seasonFiles = [];
  SEASON_GROUPS.forEach(([seasonKey, seasonTitle, portions]) => {
    let md = `## ${seasonTitle}\n\n`;
    let any = false;

    portions.forEach(([key, title, dataKey]) => {
      const generals = (GENERAL_BY_SEASON[key] || []).filter((g) => TASKS['general/' + g]);
      const perPlant = [];
      if (dataKey) {
        resolved.forEach(({ p, by }) => {
          const entries = (by[dataKey] || []).filter((e) => TAG_TO_FILE[e.tag]);
          if (entries.length) perPlant.push({ p, entries });
        });
      }
      if (!generals.length && !perPlant.length) return;
      any = true;

      md += `### ${title}\n\n`;
      if (generals.length) {
        md += `**Garden tasks**\n\n`;
        generals.forEach((g) => {
          usedGeneralTasks.add(g);
          md += `/tasks/general/${g}.md\n\n`;
        });
      }
      if (perPlant.length) {
        md += `**Plant tasks**\n\n`;
        perPlant.forEach(({ p, entries }) => {
          md += `**${p[K.com] || p[K.lat]}**\\\n`;
          md += p[K.com] && p[K.lat] ? `*${p[K.lat]}*\n\n` : `\n`;
          entries.forEach((e) => {
            const f = TAG_TO_FILE[e.tag];
            usedPlantTasks.add(f);
            md += `/tasks/plant/${f}.md\n\n`;
            if ((e.origin === 'genus' || e.origin === 'plant') && e.note) {
              const who = e.origin === 'plant' ? p[K.lat] : e.originId;
              md += `**${who}:** ${e.note}\n\n`;
            }
          });
        });
      }
    });

    if (!any) return;
    const name = `${String(seasonFiles.length + 3).padStart(2, '0')}_${seasonKey}.md`;
    seasonFiles.push(name);
    files.push({ name, data: md.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n' });
  });

  /* cover */
  const cover =
    `# Your garden guide\n\n` +
    `Congratulations, takes some work, changes over time, here to help, enjoy\n\n` +
    `___\n\n` +
    `${answers.address || '[Address of Garden]'}\n\n` +
    `${answers.message || ''}\n\n` +
    `💅🏻 **Leah Fagan**\\\n` +
    `Diva of Dirt\n\n` +
    `/z_img/sig.png\n\n` +
    `312 771 1876\\\n` +
    `leah@growgoodgardens.com\n`;
  files.unshift({ name: '01_cover.md', data: cover });

  /* tools, compiled from exactly the tasks this guide includes */
  const toolSet = new Map();
  [...usedGeneralTasks].forEach((t) =>
    toolsFromTask(TASKS['general/' + t]).forEach((x) => toolSet.set(x.toLowerCase(), x)),
  );
  [...usedPlantTasks].forEach((t) =>
    toolsFromTask(TASKS['plant/' + t]).forEach((x) => toolSet.set(x.toLowerCase(), x)),
  );
  const tools = [...toolSet.values()].sort((a, b) => a.localeCompare(b));
  const essential = tools.filter(isEssentialTool);
  const optional = tools.filter((t) => !isEssentialTool(t));
  files.splice(1, 0, {
    name: '02_tools.md',
    data:
      `## What you will need\n\n` +
      `Everything the tasks in this guide call for.\n\n` +
      `### Necessities\n\n` +
      (essential.length ? essential.map((t) => `- ${t}`).join('\n') : '- Nothing beyond your hands') +
      `\n\n### Nice to have\n\n` +
      (optional.length
        ? optional.map((t) => `- ${t}`).join('\n')
        : '- Nothing else is called for') +
      '\n',
  });

  /* plant list */
  let pl = `## Your plants\n\n`;
  plants.forEach((p) => {
    pl += `### ${p[K.com] || p[K.lat]}\n\n`;
    if (p[K.com] && p[K.lat]) pl += `*${p[K.lat]}*\n\n`;
    const h =
      p[K.hmin] && p[K.hmax] ? `${p[K.hmin]}–${p[K.hmax]}ft` : p[K.hmax] ? `${p[K.hmax]}ft` : '';
    const s =
      p[K.smin] && p[K.smax] ? `${p[K.smin]}–${p[K.smax]}ft` : p[K.smax] ? `${p[K.smax]}ft` : '';
    const rows = [
      ['Light', p[K.light]],
      ['Water', p[K.water]],
      ['Height', h],
      ['Spread', s],
      ['Bloom', p[K.bloomtime]],
      ['Bloom color', p[K.bloomcolor]],
      ['Soil', p[K.soil]],
    ].filter(([, v]) => v);
    rows.forEach(([k, v]) => (pl += `**${k}:** ${v}\\\n`));
    pl = pl.replace(/\\\n$/, '\n');
    pl += `\n`;
  });
  files.push({ name: '90_plant_list.md', data: pl });

  /* closing */
  files.push({
    name: '99_closing.md',
    data:
      `## Thank you\n\n` +
      `Thank you for trusting us with your garden.\n\n` +
      `A garden is never finished, and neither is this guide. If something in it ` +
      `does not match what you are seeing in the ground, that is worth a ` +
      `conversation rather than a worry.\n\n` +
      `We are here to answer questions, and we are here to do the work with you ` +
      `or for you. Ask at any point.\n`,
  });

  /*
   * Head file: nothing but the transclusions, each followed by a page break so
   * every section starts on its own page in the pdf export.
   */
  const order = ['01_cover.md', '02_tools.md']
    .concat(seasonFiles)
    .concat(['90_plant_list.md', '99_closing.md']);
  files.unshift({
    name: '00_guide.md',
    data: order.map((f) => `/${f}`).join('\n\n+++\n\n') + '\n',
  });

  /* copies of every task file the guide references */
  [...usedGeneralTasks].sort().forEach((t) =>
    files.push({ name: `tasks/general/${t}.md`, data: TASKS['general/' + t] }),
  );
  [...usedPlantTasks].sort().forEach((t) =>
    files.push({ name: `tasks/plant/${t}.md`, data: TASKS['plant/' + t] }),
  );

  return files;
}

/* ── question dialog ──────────────────────────────────────────────────────*/
function openGuideDialog() {
  if (!inventory.size) return;
  const existing = document.getElementById('guide-dialog');
  if (existing) existing.remove();

  const d = document.createElement('dialog');
  d.id = 'guide-dialog';
  d.style.cssText =
    'border:0;border-radius:8px;padding:0;max-width:30rem;width:90vw;' +
    'box-shadow:0 10px 40px rgba(0,0,0,.3);font:inherit;';
  d.innerHTML =
    '<form method="dialog" style="padding:1.5rem;display:grid;gap:1rem">' +
    '<h2 style="margin:0;font-size:1.1rem">Garden guide</h2>' +
    '<label style="display:grid;gap:.35rem;font-size:.85rem">Address of garden' +
    '<input id="gd-address" type="text" placeholder="123 Maple St, Oak Park IL" ' +
    'style="padding:.5rem;border:1px solid #bbb;border-radius:4px;font:inherit"></label>' +
    '<label style="display:grid;gap:.35rem;font-size:.85rem">Personal message' +
    '<textarea id="gd-message" rows="4" placeholder="A note to the client for the cover page." ' +
    'style="padding:.5rem;border:1px solid #bbb;border-radius:4px;font:inherit;resize:vertical"></textarea></label>' +
    '<div style="display:flex;gap:.5rem;justify-content:flex-end">' +
    '<button value="cancel" style="padding:.5rem 1rem">Cancel</button>' +
    '<button id="gd-ok" value="ok" style="padding:.5rem 1rem;font-weight:600">Build guide</button>' +
    '</div></form>';
  document.body.appendChild(d);

  d.addEventListener('close', () => {
    if (d.returnValue === 'ok') {
      downloadGuidePackage({
        address: d.querySelector('#gd-address').value.trim(),
        message: d.querySelector('#gd-message').value.trim(),
      });
    }
    d.remove();
  });
  d.showModal();
}

function downloadGuidePackage(answers) {
  const ids = [...inventory.keys()];
  if (!ids.length) return;
  const plants = ids
    .map((id) => PLANTS[id])
    .sort((a, b) => {
      const na = (a[K.com] || a[K.lat] || '').toLowerCase();
      const nb = (b[K.com] || b[K.lat] || '').toLowerCase();
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

  const folder = addressFolder(answers.address);
  const files = buildGuideFiles(plants, answers).map((f) => ({
    name: `${folder}/${f.name}`,
    data: f.data,
  }));

  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob(files));
  a.download = folder + '.zip';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 100);
}
