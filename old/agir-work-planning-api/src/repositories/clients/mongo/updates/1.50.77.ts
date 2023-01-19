import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.50.77');

export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await upsertMapLayerTaxonomies(taxonomiesCollection);
  await upsertAssetTypeTaxonomies(taxonomiesCollection);
  await deleteDeprecatedMapLayerTaxonomies(taxonomiesCollection);
}

async function upsertOne(
  collection: MongoDb.Collection,
  filter: MongoDb.FilterQuery<any>,
  upsert: MongoDb.UpdateQuery<any> | Partial<any>
): Promise<void> {
  await collection.updateOne(filter, upsert, { upsert: true });
}

// tslint:disable-next-line:max-func-body-length
/**
 * 1000 - Surface -> Exemple: chaussée, parc, chambre de vanne
 * 2000 - Ligne   -> Exemple: ligne de gaz, ligne d'aqueduc
 * 3000 - Point   -> Exemple: regard d'égout, borne fontaine
 */
async function upsertMapLayerTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Upsert taxonomy in group mapAssetLogicLayer`);
  const mapAssetLogicLayerTaxonomies: ITaxonomy[] = [
    {
      group: 'mapAssetLogicLayer',
      code: 'parks',
      displayOrder: 1000,
      label: {
        en: 'Parks',
        fr: 'Parcs'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'roadways',
      displayOrder: 1600,
      label: {
        en: 'Roadways',
        fr: 'Chaussées de la voirie'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'revisionRoadNetworks',
      displayOrder: 1610,
      label: {
        en: 'Road networks in revision',
        fr: 'Réseaux en revision voirie'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'alleys',
      displayOrder: 1620,
      label: {
        en: 'Alleys',
        fr: 'Ruelles'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sidewalk',
      displayOrder: 1700,
      label: {
        en: 'Sidewalks',
        fr: 'Trottoirs'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sewerChambers',
      displayOrder: 1800,
      label: {
        en: 'Sewer chambers',
        fr: `Chambres d'égoûts`
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'aqueductValveChambers',
      displayOrder: 1810,
      label: {
        en: `Aqueduct valve chambers`,
        fr: `Chambres de vanne d'aqueduc`
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'bikePaths',
      displayOrder: 2000,
      label: {
        en: 'Bike paths',
        fr: 'Piste cyclables'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sewers',
      displayOrder: 2100,
      label: {
        en: 'Sewers',
        fr: 'Égoûts'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'aqueducts',
      displayOrder: 2200,
      label: {
        en: 'Aqueducts',
        fr: 'Aqueducs'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'gas',
      displayOrder: 2300,
      label: {
        en: 'Metropolitain gas',
        fr: 'Gaz métropolitain'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'csemMassives',
      displayOrder: 2410,
      label: {
        en: 'CSEM massives',
        fr: 'Massifs de la CSEM'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'aqueductEntranceSegments',
      displayOrder: 2420,
      label: {
        en: 'Aqueducs entrance segments',
        fr: `Segments d'entree de service d'eau`
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'aqueductValves',
      displayOrder: 3220,
      label: {
        en: 'Aqueducs valve',
        fr: 'Vannes'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'csemStructures',
      displayOrder: 3400,
      label: {
        en: 'CSEM structures',
        fr: 'Structures de la CSEM'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'roadNetworkNodes',
      displayOrder: 3710,
      label: {
        en: 'Road network nodes',
        fr: 'Noeuds de réseau routier'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sewerManhole',
      displayOrder: 3720,
      label: {
        en: 'Sewer manholes',
        fr: "Regards d'égoût"
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sewerJoins',
      displayOrder: 3725,
      label: {
        en: 'Sewer joins',
        fr: `Raccords d'égoût`
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'aqueductJoins',
      displayOrder: 3727,
      label: {
        en: 'Aqueduct joins',
        fr: `Raccords d'aqueduc`
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'fireHydrants',
      displayOrder: 3730,
      label: {
        en: 'Fire Hydrants',
        fr: "Bouches d'incendie"
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'sewerSumps',
      displayOrder: 3750,
      label: {
        en: 'Sewer sumps',
        fr: 'Puisards'
      }
    }
  ];
  for (const taxonomy of mapAssetLogicLayerTaxonomies) {
    try {
      await upsertOne(
        taxonomiesCollection,
        { group: taxonomy.group, code: taxonomy.code },
        {
          $set: {
            'label.fr': taxonomy.label.fr,
            'label.en': taxonomy.label.en,
            displayOrder: taxonomy.displayOrder
          }
        }
      );
    } catch (e) {
      logger.info(`Upsert taxonomy in group mapAssetLogicLayer error -> ${e}`);
    }
  }
}

interface IProperties {
  idKey: string;
  namespace: string;
  owners: string[];
  sourcesLayerId: string;
  workTypes: string[];
}

interface ITaxonomyForScript extends ITaxonomy {
  properties: IProperties;
}

// tslint:disable-next-line:max-func-body-length
async function upsertAssetTypeTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Upsert taxonomy in group assetType`);
  const mapAssetTypeTaxonomies: ITaxonomyForScript[] = [
    {
      group: 'assetType',
      code: 'aqueductValve',
      label: {
        en: 'Aqueduct Valve',
        fr: "Vanne d'aqueduc"
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['dre'],
        sourcesLayerId: 'vannes',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'abandon']
      }
    },
    {
      group: 'assetType',
      code: 'aqueductValveChamber',
      label: {
        en: 'Aqueduct valve chamber',
        fr: `Chambre de vanne d'aqueduc`
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['dre'],
        sourcesLayerId: 'chambres-de-vannes-aqueducs',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'abandon', 'equipmentChange']
      }
    },
    {
      group: 'assetType',
      code: 'sewerChamber',
      label: {
        en: 'Sewer chamber',
        fr: "Chambre d'égoût"
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['dre', 'deeu'],
        sourcesLayerId: 'chambres-egouts',
        workTypes: ['construction', 'reconstruction', 'equipmentChange', 'repair']
      }
    },
    {
      group: 'assetType',
      code: 'roadNetworkNode',
      label: {
        en: 'Road network node',
        fr: 'Noeud de réseau routier'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'noeuds',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'abandon']
      }
    },
    {
      group: 'assetType',
      code: 'bikePath',
      label: {
        en: 'Bike path',
        fr: 'Piste cyclable'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'pistes-cyclables',
        workTypes: ['marking', 'designingRoadway', 'pistecyclable']
      }
    },
    {
      group: 'assetType',
      code: 'revisionRoadNetwork',
      label: {
        en: 'Road network in revision',
        fr: 'Réseau en revision voirie'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'reseau-en-revision-voirie',
        workTypes: ['undefined']
      }
    },
    {
      group: 'assetType',
      code: 'gas',
      label: {
        en: 'Metropolitain gas',
        fr: 'Gaz métropolitain'
      },
      properties: {
        idKey: 'id',
        namespace: 'secured',
        owners: ['energir'],
        sourcesLayerId: 'gaz-metropolitain',
        workTypes: ['insideRegulators', 'corrective', 'construction', 'reconstruction', 'abandon', 'undefined']
      }
    },
    {
      group: 'assetType',
      code: 'csemStructure',
      label: {
        en: 'CSEM structure',
        fr: 'Structure de la CSEM'
      },
      properties: {
        idKey: 'id',
        namespace: 'secured',
        owners: ['csem'],
        sourcesLayerId: 'csem-structure',
        workTypes: ['construction', 'reconstruction', 'burying', 'dismantling', 'undefined']
      }
    },
    {
      group: 'assetType',
      code: 'csemMassive',
      label: {
        en: 'CSEM massive',
        fr: 'Massif de la CSEM'
      },
      properties: {
        idKey: 'id',
        namespace: 'secured',
        owners: ['csem'],
        sourcesLayerId: 'csem-massif',
        workTypes: ['construction', 'reconstruction', 'burying', 'dismantling', 'undefined']
      }
    },
    {
      group: 'assetType',
      code: 'park',
      label: {
        en: 'Park',
        fr: 'Parc'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['sgp'],
        sourcesLayerId: 'parcs',
        workTypes: ['construction', 'reconstruction']
      }
    },
    {
      group: 'assetType',
      code: 'roadway',
      label: {
        en: 'Roadway',
        fr: 'Chaussée'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'chaussees',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'pulvoStabilization', 'cutResurfacing']
      }
    },
    {
      group: 'assetType',
      code: 'sewerJoin',
      label: {
        en: 'Sewer join',
        fr: `Raccord d'égoût`
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['deeu'],
        sourcesLayerId: 'raccords-egouts',
        workTypes: ['construction', 'reconstruction', 'replacement', 'abandon']
      }
    },
    {
      group: 'assetType',
      code: 'alley',
      label: {
        en: 'Alley',
        fr: 'Ruelle'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'ruelles',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'pulvoStabilization', 'cutResurfacing']
      }
    },
    {
      group: 'assetType',
      code: 'aqueductJoin',
      label: {
        en: 'Aqueduct join',
        fr: `Raccord d'aqueduc`
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['dre'],
        sourcesLayerId: 'raccords-aqueduc',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'abandon', 'equipmentChange']
      }
    },
    {
      group: 'assetType',
      code: 'aqueductEntranceSegment',
      label: {
        en: 'Aqueducs entrance segment',
        fr: `Segment d'entree de service d'eau`
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['dre'],
        sourcesLayerId: 'segments-entrees-de-service-eau',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'abandon', 'equipmentChange']
      }
    },
    {
      group: 'assetType',
      code: 'sewerSump',
      label: {
        en: 'Sewer sump',
        fr: `Puisard`
      },
      properties: {
        idKey: 'idGcaf',
        namespace: 'secured',
        owners: ['deeu'],
        sourcesLayerId: 'puisards',
        workTypes: ['construction', 'reconstruction', 'replacement', 'abandon']
      }
    }
  ];
  for (const taxonomy of mapAssetTypeTaxonomies) {
    try {
      await upsertOne(
        taxonomiesCollection,
        { group: taxonomy.group, code: taxonomy.code },
        {
          $set: {
            'label.fr': taxonomy.label.fr,
            'label.en': taxonomy.label.en,
            'properties.idKey': taxonomy.properties.idKey,
            'properties.namespace': taxonomy.properties.namespace,
            'properties.owners': taxonomy.properties.owners,
            'properties.sourcesLayerId': taxonomy.properties.sourcesLayerId,
            'properties.workTypes': taxonomy.properties.workTypes
          }
        }
      );
    } catch (e) {
      logger.info(`Upsert taxonomy in group AssetType error -> ${e}`);
    }
  }
}

async function deleteDeprecatedMapLayerTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Delete deprecated taxonomy in group mapAssetLogicLayer`);
  try {
    await taxonomiesCollection.deleteOne({
      group: 'mapAssetLogicLayer',
      code: 'pavement'
    });
  } catch (e) {
    logger.info(`Delete taxonomy in group mapAssetLogicLayer error -> ${e}`);
  }
}
