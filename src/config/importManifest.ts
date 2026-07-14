export interface ImportSpec {
  file: string;
  service: string;
  columns: Record<string, string>;
  collapse?: {
    by: string;
    from: string;
    into: string;
  };
}

// Ordered so foreign keys resolve: parents before children.

export const IMPORT_MANIFEST: ImportSpec[] = [
  {
    file: 'Factions.csv',
    service: 'factionsService',
    columns: { id: 'id', name: 'name', link: 'link' },
  },
  {
    file: 'Source.csv',
    service: 'sourceService',
    columns: {
      id: 'id',
      name: 'name',
      type: 'type',
      edition: 'edition',
      version: 'version',
      errata_date: 'errataDate',
      errata_link: 'errataLink',
    },
  },
  {
    file: 'Detachments.csv',
    service: 'detachmentsService',
    columns: {
      id: 'id',
      faction_id: 'faction',
      name: 'name',
      legend: 'legend',
      type: 'type',
    },
  },
  {
    file: 'Stratagems.csv',
    service: 'stratagemsService',
    columns: {
      faction_id: 'faction',
      name: 'name',
      id: 'id',
      type: 'type',
      cp_cost: 'cpCost',
      legend: 'legend',
      turn: 'turn',
      phase: 'phase',
      detachment: 'detachment',
      detachment_id: 'detachmentRef',
      description: 'description',
    },
  },
  {
    file: 'Enhancements.csv',
    service: 'enhancementsService',
    columns: {
      faction_id: 'faction',
      id: 'id',
      name: 'name',
      cost: 'cost',
      detachment: 'detachment',
      detachment_id: 'detachmentRef',
      legend: 'legend',
      description: 'description',
    },
  },
  {
    file: 'Datasheets.csv',
    service: 'datasheetsService',
    columns: {
      id: 'id',
      name: 'name',
      faction_id: 'faction',
      source_id: 'source',
      legend: 'legend',
      role: 'role',
      loadout: 'loadout',
      transport: 'transport',
      virtual: 'virtual',
      leader_head: 'leaderHead',
      leader_footer: 'leaderFooter',
      damaged_w: 'damagedW',
      damaged_description: 'damagedDescription',
      link: 'link',
    },
  },
  {
    file: 'Abilities.csv',
    service: 'abilitiesService',
    columns: {
      id: 'id',
      name: 'name',
      legend: 'legend',
      faction_id: 'faction',
      description: 'description',
    },
    collapse: { by: 'id', from: 'faction', into: 'factions' },
  },
  {
    file: 'Detachment_abilities.csv',
    service: 'detachmentAbilitiesService',
    columns: {
      id: 'id',
      faction_id: 'faction',
      name: 'name',
      legend: 'legend',
      description: 'description',
      detachment: 'detachment',
      detachment_id: 'detachmentRef',
    },
  },
  {
    file: 'Datasheets_abilities.csv',
    service: 'datasheetsAbilitiesService',
    columns: {
      datasheet_id: 'datasheet',
      line: 'line',
      ability_id: 'ability',
      model: 'model',
      name: 'name',
      description: 'description',
      type: 'type',
      parameter: 'parameter',
    },
  },
  {
    file: 'Datasheets_detachment_abilities.csv',
    service: 'datasheetsDetachmentAbilitiesService',
    columns: {
      datasheet_id: 'datasheet',
      detachment_ability_id: 'detachmentAbility',
    },
  },
  {
    file: 'Datasheets_enhancements.csv',
    service: 'datasheetsEnhancementsService',
    columns: {
      datasheet_id: 'datasheet',
      enhancement_id: 'enhancement',
    },
  },
  {
    file: 'Datasheets_keywords.csv',
    service: 'datasheetsKeywordsService',
    columns: {
      datasheet_id: 'datasheet',
      keyword: 'keyword',
      model: 'model',
      is_faction_keyword: 'isFactionKeyword',
    },
  },
  {
    file: 'Datasheets_leader.csv',
    service: 'datasheetsLeaderService',
    columns: { leader_id: 'leader', attached_id: 'attached' },
  },
  {
    file: 'Datasheets_models.csv',
    service: 'datasheetsModelsService',
    columns: {
      datasheet_id: 'datasheet',
      line: 'line',
      name: 'name',
      M: 'm',
      T: 't',
      Sv: 'sv',
      inv_sv: 'invSv',
      inv_sv_descr: 'invSvDescr',
      W: 'w',
      Ld: 'ld',
      OC: 'oc',
      base_size: 'baseSize',
      base_size_descr: 'baseSizeDescr',
    },
  },
  {
    file: 'Datasheets_models_cost.csv',
    service: 'datasheetsModelsCostService',
    columns: {
      datasheet_id: 'datasheet',
      line: 'line',
      description: 'description',
      cost: 'cost',
    },
  },
  {
    file: 'Datasheets_options.csv',
    service: 'datasheetsOptionsService',
    columns: {
      datasheet_id: 'datasheet',
      line: 'line',
      button: 'button',
      description: 'description',
    },
  },
  {
    file: 'Datasheets_stratagems.csv',
    service: 'datasheetsStratagemsService',
    columns: {
      datasheet_id: 'datasheet',
      stratagem_id: 'stratagem',
    },
  },
  {
    file: 'Datasheets_unit_composition.csv',
    service: 'datasheetsUnitCompositionService',
    columns: {
      datasheet_id: 'datasheet',
      line: 'line',
      description: 'description',
    },
  },
  {
    file: 'Datasheets_wargear.csv',
    service: 'datasheetsWargearService',
    columns: {
      datasheet_id: 'datasheet',
      line: 'line',
      line_in_wargear: 'lineInWargear',
      dice: 'dice',
      name: 'name',
      description: 'description',
      range: 'range',
      type: 'type',
      A: 'a',
      BS_WS: 'bsWs',
      S: 's',
      AP: 'ap',
      D: 'd',
    },
  },
  {
    file: 'Last_update.csv',
    service: 'lastUpdateService',
    columns: { last_update: 'lastUpdate' },
  },
];
