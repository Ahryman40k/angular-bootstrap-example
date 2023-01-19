import { InterventionExternalReferenceType, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.4');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.4 we need to add the taxonomy group/code externalReferenceType/nexoReferenceNumber.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertTaxonomies();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.4 executed in ${milliseconds} milliseconds`);
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

const taxoNexoReferenceType: ITaxonomy = {
  group: 'externalReferenceType',
  code: InterventionExternalReferenceType.nexoReferenceNumber,
  label: {
    en: 'NEXO reference number',
    fr: 'Numéro de référence - NEXO'
  }
};

export const taxos274: ITaxonomy[] = [taxoNexoReferenceType];
