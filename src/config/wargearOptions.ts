import * as fs from 'node:fs';
import * as path from 'node:path';

// BSData's vocabulary: a `group` with max 1 is a pick-one choice, an `entry` is
// a model or upgrade, a `link` references a shared entry with the name inlined.
export interface WargearNode {
  kind: 'group' | 'entry' | 'link';
  name: string;
  min?: number;
  max?: number;
  pts?: number;
  children?: WargearNode[];
}

export interface WargearUnit {
  bsName: string;
  catalogue: string;
  pts?: number;
  maxPerRoster?: number;
  children: WargearNode[];
}

interface WargearFile {
  source: string;
  faction: string;
  catalogues: string[];
  units: Record<string, WargearUnit>;
}

// Generated offline by scripts/gen-wargear-options.mjs; never fetched at import
// time. Resolved from __dirname so it works from both src and dist.
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

// Name is the only join to BSData. MUST stay identical to `norm` in
// scripts/gen-wargear-options.mjs: the generator writes the keys this reads.
export const normaliseName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
