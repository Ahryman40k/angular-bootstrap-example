import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { isEmpty } from '../../../../utils/utils';

const logger = createLogger('mongo/2.7.25');
const WORK_TYPE_UNDEFINED = 'undefined';
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.25  insert new assetType
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const assetType = getAssetTypeTaxonomies();
  const mapAssetLogicLayer = getMapAssetLogicLayerTaxonomies();

  await deleteMobilityAxisTaxonomies();

  await upsertTaxonomies(assetType);
  await upsertTaxonomies(mapAssetLogicLayer);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.25 executed in ${milliseconds} milliseconds`);
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

/**
 * Deleting the old mobilityAxisAM and  mobilityAxisPM
 *
 * @returns {Promise<void>}
 */
async function deleteMobilityAxisTaxonomies(): Promise<void> {
  const codes = ['mobilityAxisAM', 'mobilityAxisPM'];

  const result = await TAXONOMIES_COLLECTION.deleteMany({ group: TaxonomyGroup.assetType, code: { $in: codes } });
  logger.info(`${result.deletedCount} assetType  mobilityAxisAM and  mobilityAxisPM  DELETED`);
}

export const taxos2725: ITaxonomy[] = [...getAssetTypeTaxonomies(), ...getMapAssetLogicLayerTaxonomies()];

// tslint:disable-next-line: max-func-body-length
function getAssetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'mobilityAxis',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Axes de mobilité',
        en: 'Mobility axis'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'axes-de-mobilite',
        idKey: 'id',
        consultationOnly: true,
        owners: ['publicWorksRoad'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'aqueductAccessory',
      group: TaxonomyGroup.assetType,
      label: {
        fr: "Accessoire d'aqueduc",
        en: 'Aqueduct accessory'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'accessoires-aqueducs',
        idKey: 'noGeomatiqueAccessoire',
        consultationOnly: true,
        owners: ['dre'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'leadGround',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Terrain plomb',
        en: 'Lead ground'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'terrains-plomb',
        idKey: 'id',
        consultationOnly: true,
        owners: ['dre'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'cable',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Câble',
        en: 'Cable'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'cables',
        idKey: 'id',
        consultationOnly: true,
        owners: ['hq'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'barrel',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Fût',
        en: 'Barrel'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'futs',
        idKey: 'id',
        consultationOnly: true,
        owners: ['hq'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'shoppingStreet',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Rue commençante',
        en: 'Shopping street'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'rues-commercantes',
        consultationOnly: true,
        owners: ['borough'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'track',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Voie ferrée',
        en: 'Track'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'voies-ferrees',
        idKey: 'id',
        consultationOnly: true,
        owners: ['mtq'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'busShelter',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Abribus',
        en: 'Bus shelter'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'abribus',
        idKey: 'id',
        consultationOnly: true,
        owners: ['stm'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'waterPoint',
      group: TaxonomyGroup.assetType,
      label: {
        fr: "Point d'eau",
        en: 'Water point'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'points-eau',
        idKey: 'id',
        consultationOnly: true,
        owners: ['borough'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    },
    {
      code: 'sewerDrop',
      group: TaxonomyGroup.assetType,
      label: {
        fr: "Chute à l'égout",
        en: "Chute à l'égout"
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'chute-a-egout',
        idKey: 'id',
        consultationOnly: false,
        owners: ['deeu'],
        workTypes: ['repair']
      }
    },
    {
      code: 'wood',
      group: TaxonomyGroup.assetType,
      label: {
        fr: 'Bois',
        en: 'Woods'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'bois',
        idKey: 'id',
        consultationOnly: true,
        owners: ['sgp'],
        workTypes: [WORK_TYPE_UNDEFINED]
      }
    }
  ];
}

// tslint:disable-next-line: max-func-body-length
function getMapAssetLogicLayerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'mobilityAxis',
      displayOrder: 2210,
      label: {
        fr: 'Axes de mobilité',
        en: 'Mobility axis'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'aqueductAccessory',
      displayOrder: 3755,
      label: {
        fr: "Accessoire d'aqueduc",
        en: 'Aqueduct accessory'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'leadGround',
      displayOrder: 1710,
      label: {
        fr: 'Terrain plomb',
        en: 'Lead ground'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'wood',
      displayOrder: 1720,
      label: {
        fr: 'Bois',
        en: 'Woods'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'sewerDrop',
      displayOrder: 3760,
      label: {
        fr: "Chute à l'égoût",
        en: 'Sewer drop'
      }
    }
  ];
}
