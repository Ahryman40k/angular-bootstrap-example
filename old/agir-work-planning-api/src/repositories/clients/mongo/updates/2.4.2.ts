import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.4.2');

export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await upsertMapLayerTaxonomies(taxonomiesCollection);
  await upsertAssetTypeTaxonomies(taxonomiesCollection);
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
      code: 'roadNetworkArterial',
      displayOrder: 2001,
      label: {
        en: 'Arterial road network',
        fr: 'Réseau routier arteriel'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'unifiedSections',
      displayOrder: 2002,
      label: {
        en: 'Unified sections',
        fr: 'Tronçons unifiés'
      }
    },
    {
      group: 'mapAssetLogicLayer',
      code: 'highways',
      displayOrder: 2003,
      label: {
        en: 'Highways',
        fr: 'Autoroutes'
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

// tslint:disable-next-line:max-func-body-length
async function upsertAssetTypeTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Upsert taxonomy in group assetType`);
  const mapAssetTypeTaxonomies: ITaxonomy[] = [
    {
      group: 'assetType',
      code: 'roadNetworkArterial',
      label: {
        en: 'Arterial road network',
        fr: 'Réseau routier arteriel'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'reseau-arteriel',
        workTypes: ['undefined']
      }
    },
    {
      group: 'assetType',
      code: 'unifiedSection',
      label: {
        en: 'Unified sections',
        fr: 'Tronçons unifiés'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'troncons-unifies',
        workTypes: ['undefined']
      }
    },
    {
      group: 'assetType',
      code: 'highway',
      label: {
        en: 'Autoroute',
        fr: 'Highway'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad', 'mtq', 'borough'],
        sourcesLayerId: 'autoroutes',
        workTypes: ['undefined']
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
