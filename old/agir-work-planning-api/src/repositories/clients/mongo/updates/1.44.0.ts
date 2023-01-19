import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.44.0');
const RISK_AGREEMENT = 'riskAgreement';
const RISK_BURIAL_COMMENT = 'riskBurialComment';
const RISK_LAND_ACQUISITION = 'riskLandAcquisition';
const RISK_OTHER_COMMENT = 'riskOtherComment';

/**
 * For V1.44.0 We need to add a taxonomy for the risk types.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertTaxonomies(taxonomiesCollection);
}

async function insertTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy for the risk types`);
  const taxonomies = [
    {
      group: TaxonomyGroup.riskType,
      code: RISK_AGREEMENT,
      label: {
        fr: 'Risque entente',
        en: 'Risk agreement'
      }
    },
    {
      group: TaxonomyGroup.riskType,
      code: RISK_BURIAL_COMMENT,
      label: {
        fr: 'Risque enfouissement (voir commentaire)',
        en: 'Risk burial comment'
      }
    },
    {
      group: TaxonomyGroup.riskType,
      code: RISK_LAND_ACQUISITION,
      label: {
        fr: 'Risque acquisition de terrain',
        en: 'Risk land acquisition'
      }
    },
    {
      group: TaxonomyGroup.riskType,
      code: RISK_OTHER_COMMENT,
      label: {
        fr: 'Risque autre (voir commentaire)',
        en: 'Risk other comment'
      }
    }
  ];
  for (const taxonomy of taxonomies) {
    try {
      await taxonomiesCollection.insertOne(taxonomy);
    } catch (e) {
      logger.error(e, `Creating group ${TaxonomyGroup.riskType} and code ${taxonomy.code} failed.`);
      return;
    }
  }
}
