import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { isEmpty } from '../../../../utils/utils';

const logger = createLogger('mongo/2.7.3');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.3  insert new assetType
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const assetType = getAssetTypeTaxonomies();
  const mapAssetLogicLayer = getMapAssetLogicLayerTaxonomies();

  await upsertTaxonomies(assetType);
  await upsertTaxonomies(mapAssetLogicLayer);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.3 executed in ${milliseconds} milliseconds`);
}

async function upsertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`upsert assetType  ${TAXONOMIES_COLLECTION.collectionName}`);
  try {
    for (const taxonomy of taxonomies) {
      const setValue = {
        label: taxonomy.label
      };
      // tslint:disable:no-string-literal
      if (!isEmpty(taxonomy.properties)) {
        setValue['properties'] = taxonomy.properties;
      }
      if (!isEmpty(taxonomy.displayOrder)) {
        setValue['displayOrder'] = taxonomy.displayOrder;
      }
      await TAXONOMIES_COLLECTION.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        { $set: setValue },
        { upsert: true }
      );
    }
  } catch (e) {
    logger.error(`Create Service taxonomies error -> ${e}`);
  }
}

export const taxos273: ITaxonomy[] = [...getAssetTypeTaxonomies(), ...getMapAssetLogicLayerTaxonomies()];
// tslint:disable-next-line: max-func-body-length
function getAssetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'intLogical',
      group: 'assetType',
      label: {
        fr: 'Int. Logique (nœud circule)',
        en: 'Int. Logique (nœud circule)'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'int-logiques-noeuds-circule',
        idKey: 'id',
        consultationOnly: 'false',
        dataKeys: ['installationDate'],
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'pole',
      group: 'assetType',
      label: {
        fr: 'Poteau',
        en: 'Pole'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'poteaux',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'mobilityAxisAM',
      group: 'assetType',
      label: {
        fr: 'Axe de mobilité AM',
        en: 'AM mobility axis'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'axes-de-mobilite-am',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'mobilityAxisPM',
      group: 'assetType',
      label: {
        fr: 'Axe de mobilité PM',
        en: 'PM mobility axis'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'axes-de-mobilite-pm',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'waterServiceEntrance',
      group: 'assetType',
      label: {
        fr: "Entrée de service de l'eau",
        en: 'Water service entrance'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'entrees-de-service-eau',
        idKey: 'noGeomatiqueVanne',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['dre'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'sewerAccessory',
      group: 'assetType',
      label: {
        fr: "Accessoire d'égout",
        en: 'Sewer accessory'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'accessoires-egouts',
        idKey: 'noGeomatiqueAccessoire',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['deeu'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'drinkingWater',
      group: 'assetType',
      label: {
        fr: 'Eau potable',
        en: 'Drinking water'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'eau-potable',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['dre'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'wasteWaters',
      group: 'assetType',
      label: {
        fr: 'Eaux usées',
        en: 'Waste waters'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'eaux-usees',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['dre'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'rainyWaters',
      group: 'assetType',
      label: {
        fr: 'Eaux pluviales',
        en: 'Rainy waters'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'eaux-pluviales',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['dre'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'road',
      group: 'assetType',
      label: {
        fr: 'Voirie',
        en: 'Road'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'voirie',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'unifiedNodes',
      group: 'assetType',
      label: {
        fr: 'Nœuds unifiés',
        en: 'Unified nodes'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'noeuds-unifies',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'area',
      group: 'assetType',
      label: {
        fr: 'Zone',
        en: 'Area'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'zones',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'lotNumber',
      group: 'assetType',
      label: {
        fr: 'Numéro de lots',
        en: 'Lot number'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'numeros-de-lots',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['sgpi'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'legalCadastre',
      group: 'assetType',
      label: {
        fr: 'Cadastre légal',
        en: 'Legal cadastre'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'cadastre-legal',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['sgpi'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'watercoursesDitches',
      group: 'assetType',
      label: {
        fr: "Cours d'eau et fossés",
        en: 'Watercourses and ditches'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'cours-eau-et-fosses',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['dre'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'flowDirection',
      group: 'assetType',
      label: {
        fr: 'Sens de circulation',
        en: 'Flow direction'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'sens-de-circulation',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'busStop',
      group: 'assetType',
      label: {
        fr: 'Arrêt de bus',
        en: 'Bus stop'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'arrets-de-bus',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['stm'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'busLine',
      group: 'assetType',
      label: {
        fr: 'Ligne de bus',
        en: 'Bus line'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'lignes-de-bus',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['stm'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'metroStation',
      group: 'assetType',
      label: {
        fr: 'Station de métro',
        en: 'Metro station'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'stations-de-metro',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['stm'],
        workTypes: ['construction', 'refection']
      }
    },
    {
      code: 'undergroundLine',
      group: 'assetType',
      label: {
        fr: 'Ligne de métro',
        en: 'Underground line'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'lignes-de-metro',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['stm'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'remStation',
      group: 'assetType',
      label: {
        fr: 'Station REM',
        en: 'REM station'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'rem-stations',
        idKey: 'uuid',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['mtq'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'sensitiveSite',
      group: 'assetType',
      label: {
        fr: 'Site sensible',
        en: 'Sensitive site'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'sites-sensibles',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['borough'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'polygonUndercutPark',
      group: 'assetType',
      label: {
        fr: 'Parc sous-découpage polygone',
        en: 'Polygon undercut park'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'parc-sous-decoupage-polygone',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['sgp'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'lineUndercutPark',
      group: 'assetType',
      label: {
        fr: 'Parc sous-découpage ligne',
        en: 'Line undercut park'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'parc-sous-decoupage-ligne',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['sgp'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'ecoterritory',
      group: 'assetType',
      label: {
        fr: 'Ecoterritoire',
        en: 'Ecoterritory'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'ecoterritoires',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['sgp'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'hqSubstation',
      group: 'assetType',
      label: {
        fr: 'Poste Hydro-Québec',
        en: 'Hydro-Quebec substation'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'postes-hydro-quebec',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['hq'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'pylon',
      group: 'assetType',
      label: {
        fr: 'Pylône',
        en: 'Pylon'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'pylones',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['hq'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'hqLine',
      group: 'assetType',
      label: {
        fr: 'Ligne Hydro-Québec',
        en: 'Hydro-Quebec line'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'lignes-hydro-quebec',
        idKey: 'id',
        consultationOnly: 'true',
        dataKeys: ['installationDate'],
        owners: ['hq'],
        workTypes: ['undefined']
      }
    },
    {
      code: 'electricalTerminal',
      group: 'assetType',
      label: {
        fr: 'Borne électrique',
        en: 'Electrical terminal'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'bornes-electriques',
        idKey: 'id',
        consultationOnly: 'false',
        owners: ['publicWorksRoad'],
        workTypes: ['undefined']
      }
    }
  ];
}

// tslint:disable-next-line: max-func-body-length
function getMapAssetLogicLayerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'mapAssetLogicLayer',
      code: 'drinkingWater',
      displayOrder: 3232,
      label: {
        en: 'Potable water',
        fr: 'Eau potable'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'busStop',
      displayOrder: 3233,
      label: {
        en: 'Bus stops',
        fr: 'Arrêts de bus'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'busLine',
      displayOrder: 3234,
      label: {
        en: 'Bus line',
        fr: 'Ligne de bus'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'undergroundLine',
      displayOrder: 3235,
      label: {
        en: 'Subway lines',
        fr: 'Lignes de métro'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'metroStation',
      displayOrder: 3236,
      label: {
        en: 'Subway stations',
        fr: 'Stations de métro'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'remStation',
      displayOrder: 3237,
      label: {
        en: 'REM stations',
        fr: 'REM stations'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'electricalTerminal',
      displayOrder: 3238,
      label: {
        en: 'Charging stations',
        fr: 'Bornes de recharge'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'hqLine',
      displayOrder: 3239,
      label: {
        en: 'Hydro-Québec lines',
        fr: 'Lignes Hydro-Québec'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'hqSubstation',
      displayOrder: 3240,
      label: {
        fr: 'Postes Hydro-Québec',
        en: 'Hydro-Quebec substations'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'pylon',
      displayOrder: 3241,
      label: {
        fr: 'Pylônes',
        en: 'Pylons'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'poles',
      displayOrder: 3242,
      label: {
        fr: 'Poteaux',
        en: 'Poles'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sewerAccessory',
      displayOrder: 3243,
      label: {
        fr: "Accessoire d'égout",
        en: 'Sewer accessory'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'wasteWaters',
      displayOrder: 3244,
      label: {
        fr: 'Eaux usées',
        en: 'Waste waters'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'rainyWaters',
      displayOrder: 3245,
      label: {
        fr: 'Eaux pluviales',
        en: 'Rainy waters'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'unifiedNodes',
      displayOrder: 3246,
      label: {
        fr: 'Nœuds unifiés',
        en: 'Unified nodes'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'road',
      displayOrder: 3247,
      label: {
        fr: 'Voirie',
        en: 'Road'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'area',
      displayOrder: 3248,
      label: {
        fr: 'Zone',
        en: 'Area'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'waterServiceEntrance',
      displayOrder: 3249,
      label: {
        fr: "Entrée de service de l'eau",
        en: 'Water service entrance'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'intLogical',
      displayOrder: 3250,
      label: {
        fr: 'Int. Logique (nœud circule)',
        en: 'Int. Logique (nœud circule)'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'watercoursesDitches',
      displayOrder: 3251,
      label: {
        fr: "Cours d'eau et fossés",
        en: 'Watercourses and ditches'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'lineUndercutPark',
      displayOrder: 3253,
      label: {
        fr: 'Parc sous-découpage ligne',
        en: 'Line undercut park'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'polygonUndercutPark',
      displayOrder: 3252,
      label: {
        fr: 'Parc sous-découpage polygone',
        en: 'Polygon undercut park'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'ecoterritory',
      displayOrder: 3254,
      label: {
        fr: 'Ecoterritoire',
        en: 'Ecoterritory'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sensitiveSite',
      displayOrder: 3255,
      label: {
        fr: 'Site sensible',
        en: 'Sensitive site'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'flowDirection',
      displayOrder: 3256,
      label: {
        fr: 'Sens de circulation',
        en: 'Flow direction'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'legalCadastre',
      displayOrder: 4000,
      label: {
        en: 'Legal cadastre',
        fr: 'Cadastre légal'
      }
    },

    {
      group: 'mapAssetLogicLayer',
      code: 'lotNumber',
      displayOrder: 4010,
      label: {
        fr: 'Numéro de lots',
        en: 'Lot number'
      }
    }
  ];
}
