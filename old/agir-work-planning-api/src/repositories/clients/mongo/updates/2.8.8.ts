import { isEmpty } from 'lodash';
import { Collection, Db, FilterQuery, UpdateManyOptions, UpdateQuery } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.8`;
const logger = createLogger(`mongo/${VERSION}`);
let projectCollection: Collection;

interface IUpdateMigration {
  collection: Collection;
  filter: FilterQuery<any>;
  updateQuery: UpdateQuery<any> | any;
  options?: UpdateManyOptions;
}

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  projectCollection = db.collection(constants.mongo.collectionNames.PROJECTS);

  logger.info(`Remove requirements, referenceId, and programBookId attributes from project collection`);

  const updateMigrations: IUpdateMigration[] = [
    {
      collection: projectCollection,
      filter: { requirements: { $exists: true } },
      updateQuery: { $unset: { requirements: '' } }
    },
    {
      collection: projectCollection,
      filter: { referenceId: { $exists: true } },
      updateQuery: { $unset: { referenceId: '' } }
    },
    {
      collection: projectCollection,
      filter: { programBookId: { $exists: true } },
      updateQuery: { $unset: { programBookId: '' } }
    }
  ];

  for (const migration of updateMigrations) {
    logger.info(
      `Start updating ${migration.collection.collectionName} with filter ${JSON.stringify(migration.filter)}`
    );

    await migration.collection.updateMany(migration.filter, migration.updateQuery, migration.options);

    const updateResult = await migration.collection.find(migration.filter).toArray();
    if (!isEmpty(updateResult)) {
      throw new Error(
        `Some ${migration.collection.collectionName} still have ${JSON.stringify(migration.filter)} : ${
          updateResult.length
        }`
      );
    }
    logger.info(
      `Elements from ${migration.collection.collectionName} with filter ${JSON.stringify(
        migration.filter
      )} are updated with success`
    );
  }

  logger.info(`Script ${VERSION} executed in ${Date.now() - startTime} milliseconds`);
}
