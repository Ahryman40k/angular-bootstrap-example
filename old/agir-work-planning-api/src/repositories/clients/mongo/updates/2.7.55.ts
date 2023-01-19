import {
  InterventionExternalReferenceType,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';
import { constants } from '../../../../../config/constants';
import { IAssetAttributes } from '../../../../features/asset/mongo/assetSchemas';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.55');
let TAXONOMIES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;
/**
 * For V2.7.55 we need to add the taxonomy group/code externalReferenceType/nexoReferenceNumber.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  await insertTaxonomies();
  await updateInterventionCollection();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.55 executed in ${milliseconds} milliseconds`);
}

async function insertTaxonomies(): Promise<void> {
  logger.info('Start insert taxonomies');
  try {
    await TAXONOMIES_COLLECTION.insertOne(taxoNexoReferenceType);
    logger.info(`nexoReferenceNumber inserted in collection ${TAXONOMIES_COLLECTION}`);
  } catch (e) {
    logger.error(
      `Error inserting externalReferenceType ${InterventionExternalReferenceType.nexoReferenceNumber} -> ${e}`
    );
  }
}

interface IIdAndAssets {
  _id: string;
  assets: IAssetAttributes[];
}

async function updateInterventionCollection(): Promise<void> {
  logger.info('Start update intervention colllection');
  try {
    const limit = 20;
    let offset = 0;
    let totalInterventionsIdsAndAssets = await getIdsAndAssets(offset, limit);
    while (!isEmpty(totalInterventionsIdsAndAssets)) {
      await Promise.all(
        totalInterventionsIdsAndAssets.map(idAndAssets => {
          if (!isEmpty(idAndAssets.assets)) {
            let updatedAssets: IAssetAttributes[];
            for (const asset of idAndAssets.assets) {
              // tslint:disable:no-string-literal
              if (!isEmpty(asset['externalReferenceId'])) {
                asset.externalReferenceIds = [asset['externalReferenceId']];
              }
              delete asset['externalReferenceId'];
            }
            updatedAssets = idAndAssets.assets;

            return INTERVENTIONS_COLLECTION.updateOne(
              { _id: idAndAssets._id },
              {
                $set: {
                  assets: updatedAssets
                }
              }
            );
          }
          return undefined;
        })
      );
      offset = offset + limit;
      totalInterventionsIdsAndAssets = await getIdsAndAssets(offset, limit);
    }
  } catch (e) {
    logger.error(`Error updating intervention collection assets externalReferenceIds -> ${e}`);
  }
}

async function getIdsAndAssets(offset: number, limit: number): Promise<IIdAndAssets[]> {
  return await INTERVENTIONS_COLLECTION.find(
    {},
    {
      skip: offset,
      limit,
      fields: { assets: 1 }
    }
  ).toArray();
}

const taxoNexoReferenceType: ITaxonomy = {
  group: TaxonomyGroup.externalReferenceType,
  code: InterventionExternalReferenceType.nexoAssetId,
  label: {
    en: 'NEXO asset ID',
    fr: 'ID NEXO'
  }
};

export const taxos2755: ITaxonomy[] = [taxoNexoReferenceType];
