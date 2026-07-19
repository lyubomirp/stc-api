// The leader-attachment grant each enhancement adds beyond datasheets_leader.
// Only the target is stated -- bearers come from datasheets_enhancements. Keyed
// by name (stable; ids rot), resolved live and faction-scoped. See NOTES.

export type GrantTarget =
  { names: string[] } | { keywords: string[]; exclude?: string };

export const LEADER_GRANTS: Record<string, GrantTarget> = {
  'Exalted Patron': { names: ['Flawless Blades'] },
  'Bray Lord': { names: ['Tzaangors'] },
  'Mek Kaptin': { names: ['Flash Gitz'] },
  'Skwad Leader': { names: ['Kommandos'] },
  'Grimnar’s Mark': { names: ['Wolf Guard Terminators'] },
  'Sorrowscent Vulture': { names: ['Warp Talons'] },
  'Catechism of Divine Penitence': { names: ['Repentia Squad'] },
  'Abhuman Detail': { names: ['Ogryn Squad', 'Bullgryn Squad'] },
  'Butcher Lord': { names: ['Jakhals', 'Goremongers'] },
  'Disciple of Khorne': { names: ['Bloodcrushers', 'Flesh Hounds'] },
  // "Tyranid Warriors" is two datasheets, split by weapon type.
  'Synaptic Tyrant': {
    names: [
      'Tyranid Warriors With Melee Bio-weapons',
      'Tyranid Warriors With Ranged Bio-weapons',
    ],
  },
  Murdermind: { keywords: ['DESTROYER CULT'], exclude: 'CHARACTER' },
  'Wolf-touched': { keywords: ['WULFEN', 'INFANTRY'] },
};
