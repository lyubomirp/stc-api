export interface CostTier {
  /**
   * The row's own line within its datasheet. THE key: (datasheetId, line) is
   * unique across all 2136 cost rows, and model count is not -- 14 datasheets
   * price two different compositions at the same count.
   */
  line: string;
  /** Models this option fields, summed from its wording. */
  models: number;
  pts: number;
  /** "3 Wolf Guard Headtakers and 3 Hunting Wolves" -- what the player picks. */
  label: string;
}

interface CostRow {
  line: string;
  description: string;
  cost: string;
}

/**
 * Turns `datasheets_models_cost` rows into points tiers.
 *
 * The single home for this: the arsenal list and the roster's saved price both
 * read it, and two implementations that drift mean the roster stores a
 * different number from the one on screen.
 *
 * `description` is not always "N models" -- 54 of 2136 rows are not:
 *
 *   "1 Sword Brother, 5 Initiates and 4 Neophytes"  -> 10 models, not 1
 *   "2 Spanners and 8 Burna Boyz"                   -> 10 models, not 2
 *
 * so the count is the SUM of every number in the string. Reading only the first
 * made both Crusader Squad tiers "1 model", which collide, leaving its 20-model
 * tier unreachable.
 */
export const costTiers = (rows: CostRow[]): CostTier[] =>
  rows
    // "1 model (Assigned Agent)" is the *allied* price -- an Eversor is 110 in
    // its own detachment and 120 as someone's ally. Two costs for one model
    // count would make the tier pick arbitrary, and allies are not built yet.
    .filter((r) => !/\(assigned agent\)/i.test(r.description ?? ''))
    // A "+N" cost is an add-on, not a unit price ("Attack Bike" +55). Checked
    // explicitly because Number('+55') is 55 and perfectly finite -- only the
    // models > 0 test below happens to catch these today, and it would stop
    // catching them the moment upstream writes "2 Attack Bikes".
    .filter((r) => /^\d+$/.test(String(r.cost ?? '').trim()))
    .map((r) => ({
      models: [...(r.description ?? '').matchAll(/(\d+)/g)].reduce(
        (sum, m) => sum + Number(m[1]),
        0,
      ),
      pts: Number(r.cost),
      label: r.description ?? '',
      line: r.line,
    }))
    // 0 models is an upgrade line, not a unit size: "Shadow Spectre Exarch"
    // costing "+30", "Attack Bike" costing "+55".
    .filter((t) => t.models > 0 && Number.isFinite(t.pts))
    // The export repeats some rows verbatim (Gladiator Lancer, "1 model" 160,
    // twice). Identical is harmless; collapse to the first line.
    .filter(
      (t, i, all) =>
        all.findIndex(
          (o) => o.models === t.models && o.pts === t.pts,
        ) === i,
    )
    // Sort by pts as well as models so the order is DETERMINISTIC. 14
    // datasheets price two different *compositions* at the same model count --
    // Wolf Guard Headtakers is 110 for "3 Headtakers and 3 Hunting Wolves" and
    // 170 for "6 Headtakers", both 6 models -- and an unstable tie-break makes
    // the quoted price change between runs.
    .sort((a, b) => a.models - b.models || a.pts - b.pts);

/**
 * Legacy: prices by model count alone.
 *
 * Only for rosters saved before `costLine` existed. Model count is ambiguous --
 * a 6-model Wolf Guard Headtakers is 110 or 170 depending on a composition the
 * count does not capture -- so this quotes the **higher** price: over-stating
 * an army is visible, under-stating it means fielding a list quietly over cap.
 * New saves pick a tier by `line` and never come through here.
 */
export const priceAt = (
  tiers: CostTier[],
  modelCount: number,
): number | null => {
  if (!tiers.length) return null;

  const fitting = tiers.filter((t) => modelCount >= t.models);

  if (!fitting.length) return tiers[0].pts;

  const best = Math.max(...fitting.map((t) => t.models));

  return Math.max(
    ...fitting.filter((t) => t.models === best).map((t) => t.pts),
  );
};
