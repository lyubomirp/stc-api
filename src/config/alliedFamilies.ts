// One config entry per allied-forces rule (8 exist; two populated). Everything
// but the cap numbers is derived from the DB at request time; the caps are prose
// and the only transcribed part. See NOTES.

export interface AlliedCategory {
  keyword: string;
  label: string;
}

// Agents cap a unit count per category; Daemonic Pact caps a points budget.
export type AlliedCaps =
  | {
      mode: 'count';
      byBattleSize: Record<number, Record<string, number>>;
    }
  | { mode: 'points'; byBattleSize: Record<number, number> };

export interface AlliedFamily {
  id: string;
  name: string;
  // The faction the allied units come from.
  sourceFactionId: string;
  // Any-of: every datasheet in the army must carry at least one of these.
  eligibilityKeywords: string[];
  // Empty for a points-budget family.
  categories: AlliedCategory[];
  // Prose-sourced; verify against the current rules.
  caps: AlliedCaps;
}

export const ALLIED_FAMILIES: AlliedFamily[] = [
  {
    id: 'agents-of-the-imperium',
    name: 'Agents of the Imperium',
    sourceFactionId: 'AoI',
    eligibilityKeywords: ['Imperium'],
    categories: [
      { keyword: 'Retinue', label: 'Retinue' },
      { keyword: 'Requisitioned', label: 'Requisitioned' },
      { keyword: 'Character', label: 'Character' },
    ],
    caps: {
      mode: 'count',
      byBattleSize: {
        1000: { Retinue: 1, Character: 1, Requisitioned: 1 },
        2000: { Retinue: 2, Character: 2, Requisitioned: 1 },
        3000: { Retinue: 3, Character: 3, Requisitioned: 2 },
      },
    },
  },
  {
    // CSM/Chaos Knights taking Daemons. Normal price, points-budget cap; the
    // god-ratio and no-warlord/no-enhancement clauses are not enforced.
    id: 'daemonic-pact',
    name: 'Daemonic Pact',
    sourceFactionId: 'CD',
    eligibilityKeywords: ['Heretic Astartes', 'Chaos Knights'],
    categories: [],
    caps: {
      mode: 'points',
      byBattleSize: { 1000: 250, 2000: 500, 3000: 750 },
    },
  },
];
