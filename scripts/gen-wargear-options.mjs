// Regenerates src/data/wargearOptions.json from BSData.
//
//   node scripts/gen-wargear-options.mjs [--faction EC] [--check]
//
// Wahapedia carries wargear options as prose ("Any number of Tormentors can
// each have their boltgun replaced with..."), so exclusivity -- "one of these
// two, not both" -- is not derivable from the import. BSData states it as a
// selectionEntryGroup with a max constraint over its children:
//
//   <selectionEntryGroup name="Pistol" min=1 max=1>
//     -> Bolt pistol | Plasma pistol
//
// This reads that structure and nothing else. It is deliberately NOT the old
// app.service.ts approach of xml2json-ing whole catalogues into a blob: the
// graph is only unmanageable if you convert all of it.
//
// BSData is not a runtime or import-time dependency. This runs by hand and
// commits a static map; ImportService reads the committed JSON.
//
// 10e is the source because the database is Wahapedia 10e.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { xml2js } from 'xml-js';

const PTS = '51b2-306e-1021-d207';
const REPO = 'wh40k-10e';
const CACHE = path.join(os.tmpdir(), `bsdata-${REPO}`);
const OUT = path.join('src', 'data', 'wargearOptions.json');

// A faction's units are spread across catalogues: 8 of Emperor's Children's 23
// datasheets live in the Chaos Space Marines file, not their own.
const FACTIONS = {
  EC: ["Chaos - Emperor's Children", 'Chaos - Chaos Space Marines'],
};

// Crusade is the narrative campaign mode -- not matched play, not this builder.
const EXCLUDE_GROUPS =
  /^(crusade|.*crusade relics|.*battle traits)$/i;

const argv = process.argv.slice(2);
const faction = argv.includes('--faction')
  ? argv[argv.indexOf('--faction') + 1]
  : 'EC';
const checkOnly = argv.includes('--check');

if (!FACTIONS[faction]) {
  console.error(
    `unknown faction "${faction}" (have: ${Object.keys(FACTIONS).join(', ')})`,
  );
  process.exit(1);
}

// Wahapedia writes curly apostrophes, BSData straight ones.
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

const kids = (n, name) =>
  (n.elements || []).filter((e) => e.name === name);
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
    if (
      a.field === 'selections' &&
      a.scope === 'roster' &&
      a.type === 'max'
    ) {
      return num(a.value);
    }
  }
  return undefined;
}

const pts = (n) =>
  num(
    nested(n, 'costs', 'cost').find(
      (c) => c.attributes.typeId === PTS,
    )?.attributes.value,
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

const main = async () => {
  const units = {};
  let groups = 0;
  let exclusive = 0;

  for (const cname of FACTIONS[faction]) {
    const cat = xml2js(await load(cname), {
      compact: false,
    }).elements.find((e) => e.name === 'catalogue');

    for (const e of nested(
      cat,
      'sharedSelectionEntries',
      'selectionEntry',
    )) {
      const type = e.attributes.type;
      if (type !== 'unit' && type !== 'model') continue;
      if (pts(e) === undefined) continue;

      const tree = node(e, 'entry');
      if (!tree) continue;

      units[norm(e.attributes.name)] = {
        bsName: e.attributes.name,
        catalogue: cname,
        ...(pts(e) ? { pts: pts(e) } : {}),
        ...(rosterMax(e) !== undefined
          ? { maxPerRoster: rosterMax(e) }
          : {}),
        children: tree.children ?? [],
      };
    }
  }

  (function count(n) {
    for (const c of n.children ?? []) {
      if (c.kind === 'group') {
        groups++;
        if (c.max === 1) exclusive++;
      }
      count(c);
    }
  })({ children: Object.values(units) });

  const body =
    JSON.stringify(
      {
        _comment:
          'GENERATED by scripts/gen-wargear-options.mjs -- do not edit by hand.',
        source: `BSData/${REPO}`,
        faction,
        catalogues: FACTIONS[faction],
        units,
      },
      null,
      2,
    ) + '\n';

  console.log(
    `faction ${faction}: ${Object.keys(units).length} units`,
  );
  console.log(
    `  choice groups: ${groups} (${exclusive} are pick-one)`,
  );
  console.log(
    `  with a roster cap: ${Object.values(units).filter((u) => u.maxPerRoster !== undefined).length}`,
  );

  if (checkOnly) {
    const current = fs.existsSync(OUT)
      ? fs.readFileSync(OUT, 'utf8')
      : '';
    if (current !== body) {
      console.error(`\n${OUT} is stale -- re-run without --check`);
      process.exit(1);
    }
    console.log(`\n${OUT} is up to date`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body);
  console.log(`\nwrote ${OUT}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
