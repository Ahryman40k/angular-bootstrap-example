import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.19');

/**
 * For V2.7.19 we need to update the taxonomy group boroughs.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await updateTaxonomies(db);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.19 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

const GROUP = 'borough';
const FIELD_PATH = 'properties.rtuData';
const CODE_AND_VALUE = [
  {
    code: 'IBZSGV',
    value: {
      id: '17001',
      name: "L'Île-Bizard-Sainte-Geneviève"
    }
  }
];

export const taxos2719 = getBoroughTaxonomies();

function getBoroughTaxonomies(): ITaxonomy[] {
  return CODE_AND_VALUE.map(item => {
    return {
      code: item.code,
      group: 'borough',
      properties: {
        rtuData: {
          id: item.value.id,
          name: item.value.name
        }
      }
    } as ITaxonomy;
  });
}

async function updateTaxonomies(db: MongoDb.Db): Promise<void> {
  logger.info('UPDATE TAXONOMIES STARTED');
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  for (const codeAndValue of CODE_AND_VALUE) {
    logger.info(`Updating ${GROUP} with code ${codeAndValue.code}`);
    await taxonomiesCollection.updateOne(
      { group: GROUP, code: codeAndValue.code },
      {
        $set: {
          [FIELD_PATH]: codeAndValue.value
        }
      }
    );
  }
  logger.info('UPDATE TAXONOMIES DONE');
}
