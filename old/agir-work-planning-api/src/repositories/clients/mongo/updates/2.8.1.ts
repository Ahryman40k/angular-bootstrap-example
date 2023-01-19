import { Collection, Db } from 'mongodb';

import { isEmpty } from 'lodash';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.1`;
const logger = createLogger(`mongo/${VERSION}`);

let TAXONOMIES_COLLECTION: Collection;

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  const filter = { group: 'commentType' };
  await TAXONOMIES_COLLECTION.deleteMany(filter);
  // assert deletion
  const result = await TAXONOMIES_COLLECTION.find(filter).toArray();
  if (!isEmpty(result)) {
    throw new Error(
      `Some ${TAXONOMIES_COLLECTION.collectionName} still have ${JSON.stringify(filter)} : ${result.length}`
    );
  }

  logger.info(`Script ${VERSION} executed in ${Date.now() - startTime} milliseconds`);
}
