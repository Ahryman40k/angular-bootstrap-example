import { Db } from 'mongodb';
import { createLogger } from '../../../../utils/logger';
import { appUtils } from '../../../../utils/utils';

const VERSION = `2.7.73`;
const logger = createLogger(`mongo/${VERSION}`);

// let RTU_PROJECTS_COLLECTION: Collection;

/**
 * For V2.7.73 we need to create indexes for rtu_projects collection
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  await appUtils.delay(0);
  // RTU_PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.RTU_PROJECTS);
  // Due to invalid rtu projects data on PRODUTION the index creation must be deactivated
  // await RTU_PROJECTS_COLLECTION.createIndexes([
  //   { key: { geometry: '2dsphere' }, name: 'geometry_1' },
  //   { key: { status: 1 } }
  // ]);

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}
