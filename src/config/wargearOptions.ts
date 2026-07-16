import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * A node in a unit's wargear tree, mirroring BSData's own vocabulary.
 *
 * `group` is a choice: `max: 1` means pick one of `children`, which is the
 * exclusivity Wahapedia only ever states in prose. `entry` is a selectable
 * (a model, or an upgrade). `link` is a reference to a shared entry -- BSData
 * denormalises the name onto it, so it needs no resolution to render.
 */
export interface WargearNode {
  kind: 'group' | 'entry' | 'link';
  name: string;
  min?: number;
  max?: number;
  pts?: number;
  children?: WargearNode[];
}

export interface WargearUnit {
  /** BSData's name for the unit -- the join we matched on, kept for tracing. */
  bsName: string;
  catalogue: string;
  pts?: number;
  /** e.g. 1 for Epic Heroes, 6 for a Battleline unit. */
  maxPerRoster?: number;
  children: WargearNode[];
}

interface WargearFile {
  source: string;
  faction: string;
  catalogues: string[];
  units: Record<string, WargearUnit>;
}

// Committed, generated offline by scripts/gen-wargear-options.mjs. BSData is
// deliberately not fetched at import time: the import must stay a function of
// the Wahapedia snapshot plus this file, with no third-party network call
// inside the transaction.
//
// Resolved from __dirname so it works from both src (ts) and dist (js).
const load = (): WargearFile => {
  const candidates = [
    path.join(__dirname, '..', 'data', 'wargearOptions.json'),
    path.join(process.cwd(), 'src', 'data', 'wargearOptions.json'),
  ];

  const found = candidates.find((p) => fs.existsSync(p));

  if (!found) {
    throw new Error(
      `wargearOptions.json not found (looked in: ${candidates.join(', ')})`,
    );
  }

  return JSON.parse(fs.readFileSync(found, 'utf8')) as WargearFile;
};

export const WARGEAR_OPTIONS = load();

/**
 * Wahapedia writes curly apostrophes, BSData straight ones, and the two
 * disagree on bracketed suffixes. Name is the only join between them, so it
 * has to be normalised identically on both sides -- keep this in step with
 * `norm` in scripts/gen-wargear-options.mjs.
 */
export const normaliseName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
