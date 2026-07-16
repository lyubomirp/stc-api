export interface CostTier {
  // (datasheetId, line) is unique; model count is not.
  line: string;
  models: number;
  pts: number;
  label: string;
}

interface CostRow {
  line: string;
  description: string;
  cost: string;
}

// The single home for cost parsing: the datasheets list and the saved roster
// price both read it, and a second copy would drift.
export const costTiers = (rows: CostRow[]): CostTier[] =>
  rows
    // "(Assigned Agent)" rows are the ally price, not this unit's.
    .filter((r) => !/\(assigned agent\)/i.test(r.description ?? ''))
    // Drops "+N" add-on lines. Explicit because Number('+55') is finite, so
    // only the models > 0 test below catches them -- and that stops working
    // the moment upstream writes "2 Attack Bikes".
    .filter((r) => /^\d+$/.test(String(r.cost ?? '').trim()))
    .map((r) => ({
      // Sum every number: "1 Sword Brother, 5 Initiates and 4 Neophytes" is 10.
      models: [...(r.description ?? '').matchAll(/(\d+)/g)].reduce(
        (sum, m) => sum + Number(m[1]),
        0,
      ),
      pts: Number(r.cost),
      label: r.description ?? '',
      line: r.line,
    }))
    // 0 models is an upgrade line, not a unit size.
    .filter((t) => t.models > 0 && Number.isFinite(t.pts))
    .filter(
      (t, i, all) =>
        all.findIndex(
          (o) => o.models === t.models && o.pts === t.pts,
        ) === i,
    )
    // pts breaks the tie so the order is deterministic across runs.
    .sort((a, b) => a.models - b.models || a.pts - b.pts);

// Legacy rosters only, saved before costLine existed. Model count is ambiguous,
// so this quotes the higher price -- an army over cap must not read as under.
// RosterStep.priceByCount on the client mirrors this and must keep matching.
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
