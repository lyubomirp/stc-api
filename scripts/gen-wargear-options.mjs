// Regenerates src/data/wargearOptions.json from BSData. Runs by hand.
//
//   node scripts/gen-wargear-options.mjs [--check]
//
// Every faction in FACTIONS is emitted; each is matched against its own
// datasheets at import time, so names never collide across factions.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { xml2js } from 'xml-js';

const PTS = '51b2-306e-1021-d207';
const REPO = 'wh40k-10e';
const CACHE = path.join(os.tmpdir(), `bsdata-${REPO}`);
const OUT = path.join('src', 'data', 'wargearOptions.json');

// A faction's units spread across catalogues: 8 of EC's 23 datasheets live in
// the Chaos Space Marines file, SM's chapters each add their own, the Chaos
// legions borrow generic vehicles from CSM, GC borrows Brood Brothers from AM.
// List the siblings and shared libraries, not just the faction's own catalogue.
// Keys MUST equal the DB faction id (applyWargearOptions queries on it).
const FACTIONS = {
  // Imperium
  AoI: ['Imperium - Agents of the Imperium'],
  AM: ['Imperium - Astra Militarum', 'Imperium - Astra Militarum - Library'],
  AC: ['Imperium - Adeptus Custodes'],
  AdM: ['Imperium - Adeptus Mechanicus'],
  AS: ['Imperium - Adepta Sororitas'],
  GK: ['Imperium - Grey Knights'],
  // Imperial Knights borrow Skitarii/Tech-priests from AdMech.
  QI: [
    'Imperium - Imperial Knights',
    'Imperium - Imperial Knights - Library',
    'Imperium - Adeptus Mechanicus',
  ],
  TL: ['Imperium - Adeptus Titanicus', 'Library - Titans'],
  // The Heresy Legends library holds the Forge World relic vehicles (Sicaran,
  // Spartan, Leviathan, Xiphon...) both loyalist and traitor Astartes field.
  SM: [
    'Imperium - Space Marines',
    'Imperium - Black Templars',
    'Imperium - Blood Angels',
    'Imperium - Dark Angels',
    'Imperium - Deathwatch',
    'Imperium - Imperial Fists',
    'Imperium - Iron Hands',
    'Imperium - Raven Guard',
    'Imperium - Salamanders',
    'Imperium - Space Wolves',
    'Imperium - Ultramarines',
    'Imperium - White Scars',
    'Library - Astartes Heresy Legends',
  ],

  // Chaos
  CSM: ['Chaos - Chaos Space Marines', 'Library - Astartes Heresy Legends'],
  EC: ["Chaos - Emperor's Children", 'Chaos - Chaos Space Marines'],
  DG: [
    'Chaos - Death Guard',
    'Chaos - Chaos Space Marines',
    'Library - Astartes Heresy Legends',
  ],
  TS: [
    'Chaos - Thousand Sons',
    'Chaos - Chaos Space Marines',
    'Library - Astartes Heresy Legends',
  ],
  WE: [
    'Chaos - World Eaters',
    'Chaos - Chaos Space Marines',
    'Library - Astartes Heresy Legends',
  ],
  // Chaos Daemons and Chaos Knights both borrow CSM characters, cultists and
  // renegade infantry.
  CD: [
    'Chaos - Chaos Daemons',
    'Chaos - Chaos Daemons Library',
    'Chaos - Chaos Space Marines',
  ],
  QT: [
    'Chaos - Chaos Knights',
    'Chaos - Chaos Knights Library',
    'Chaos - Chaos Space Marines',
  ],

  // Xenos
  AE: ['Aeldari - Craftworlds', 'Aeldari - Aeldari Library', 'Aeldari - Ynnari'],
  DRU: ['Aeldari - Drukhari', 'Aeldari - Aeldari Library'],
  NEC: ['Necrons'],
  ORK: ['Orks'],
  TAU: ["T'au Empire"],
  LoV: ['Leagues of Votann'],
  TYR: ['Tyranids', 'Library - Tyranids'],
  // GC fields Brood Brothers (AM) and, in Wahapedia's listing, some Tyranids.
  GC: [
    'Genestealer Cults',
    'Imperium - Astra Militarum',
    'Imperium - Astra Militarum - Library',
    'Tyranids',
    'Library - Tyranids',
  ],

  // Unaligned
  UN: ['Unaligned Forces'],
};

// Crusade is the narrative campaign mode, not matched play.
const EXCLUDE_GROUPS = /^(crusade|.*crusade relics|.*battle traits)$/i;

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');

// MUST stay identical to normaliseName in src/config/wargearOptions.ts.
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

async function load(name) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${name}.cat`);

  if (!fs.existsSync(file)) {
    const url = `https://raw.githubusercontent.com/BSData/${REPO}/main/${encodeURIComponent(name)}.cat`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    fs.writeFileSync(file, await res.text());
  }

  return fs.readFileSync(file, 'utf8');
}

const kids = (n, name) => (n.elements || []).filter((e) => e.name === name);
const nested = (n, plural, singular) =>
  kids(n, plural).flatMap((x) => kids(x, singular));

const num = (v) => (v === undefined ? undefined : Number(v));

// Constraints land on the group or on the child, inconsistently -- read both.
function limits(n) {
  const out = {};
  for (const c of nested(n, 'constraints', 'constraint')) {
    const a = c.attributes;
    if (a.field !== 'selections') continue;
    if (a.scope === 'parent') {
      if (a.type === 'min') out.min = num(a.value);
      if (a.type === 'max') out.max = num(a.value);
    }
  }
  return out;
}

function rosterMax(n) {
  for (const c of nested(n, 'constraints', 'constraint')) {
    const a = c.attributes;
    if (a.field === 'selections' && a.scope === 'roster' && a.type === 'max') {
      return num(a.value);
    }
  }
  return undefined;
}

const pts = (n) =>
  num(
    nested(n, 'costs', 'cost').find((c) => c.attributes.typeId === PTS)
      ?.attributes.value,
  );

function node(n, kind) {
  const name = n.attributes?.name;
  if (!name || EXCLUDE_GROUPS.test(name)) return null;

  const children = [
    ...nested(n, 'selectionEntryGroups', 'selectionEntryGroup')
      .map((c) => node(c, 'group'))
      .filter(Boolean),
    ...nested(n, 'selectionEntries', 'selectionEntry')
      .map((c) => node(c, 'entry'))
      .filter(Boolean),
    ...nested(n, 'entryLinks', 'entryLink')
      .filter((l) => l.attributes.type === 'selectionEntry')
      .map((l) => node(l, 'link'))
      .filter(Boolean),
  ];

  const p = pts(n);
  const { min, max } = limits(n);

  return {
    kind,
    name,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(p ? { pts: p } : {}),
    ...(children.length ? { children } : {}),
  };
}

function unitsFor(catalogues, cache) {
  const units = {};
  for (const cname of catalogues) {
    const cat = cache[cname];
    for (const e of nested(cat, 'sharedSelectionEntries', 'selectionEntry')) {
      const type = e.attributes.type;
      if (type !== 'unit' && type !== 'model') continue;
      if (pts(e) === undefined) continue;

      const tree = node(e, 'entry');
      if (!tree) continue;

      units[norm(e.attributes.name)] = {
        bsName: e.attributes.name,
        catalogue: cname,
        ...(pts(e) ? { pts: pts(e) } : {}),
        ...(rosterMax(e) !== undefined ? { maxPerRoster: rosterMax(e) } : {}),
        children: tree.children ?? [],
      };
    }
  }
  return units;
}

const exclusiveCount = (units) => {
  let groups = 0;
  let exclusive = 0;
  (function count(n) {
    for (const c of n.children ?? []) {
      if (c.kind === 'group') {
        groups++;
        if (c.max === 1) exclusive++;
      }
      count(c);
    }
  })({ children: Object.values(units) });
  return { groups, exclusive };
};

const main = async () => {
  // Parse every catalogue once; several factions share the same files.
  const wanted = [...new Set(Object.values(FACTIONS).flat())];
  const cache = {};
  for (const cname of wanted) {
    cache[cname] = xml2js(await load(cname), { compact: false }).elements.find(
      (e) => e.name === 'catalogue',
    );
  }

  const factions = {};
  for (const [code, catalogues] of Object.entries(FACTIONS)) {
    const units = unitsFor(catalogues, cache);
    factions[code] = { catalogues, units };
    const { groups, exclusive } = exclusiveCount(units);
    console.log(
      `${code}: ${Object.keys(units).length} units, ${groups} groups (${exclusive} pick-one)`,
    );
  }

  const body =
    JSON.stringify(
      {
        _comment:
          'GENERATED by scripts/gen-wargear-options.mjs -- do not edit by hand.',
        source: `BSData/${REPO}`,
        factions,
      },
      null,
      2,
    ) + '\n';

  if (checkOnly) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== body) {
      console.error(`\n${OUT} is stale -- re-run without --check`);
      process.exit(1);
    }
    console.log(`\n${OUT} is up to date`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body);
  console.log(`\nwrote ${OUT} (${Object.keys(factions).length} factions)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
