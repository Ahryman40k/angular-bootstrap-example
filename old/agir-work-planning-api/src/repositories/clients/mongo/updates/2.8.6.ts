import { isEmpty } from 'lodash';
import { Collection, Db, FilterQuery, UpdateManyOptions, UpdateQuery } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.6`;
const logger = createLogger(`mongo/${VERSION}`);
let interventionCollection: Collection;

interface IUpdateMigration {
  collection: Collection;
  filter: FilterQuery<any>;
  updateQuery: UpdateQuery<any> | any;
  options?: UpdateManyOptions;
}

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  interventionCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

  logger.info(
    `Remove isInitial, referenceId, referencedInterventions, and interventionArea.id attributes from interventions collection`
  );

  const updateMigrations: IUpdateMigration[] = [
    {
      collection: interventionCollection,
      filter: { isInitial: { $exists: true } },
      updateQuery: { $unset: { isInitial: '' } }
    },
    {
      collection: interventionCollection,
      filter: { referenceId: { $exists: true } },
      updateQuery: { $unset: { referenceId: '' } }
    },
    {
      collection: interventionCollection,
      filter: { referencedInterventions: { $exists: true } },
      updateQuery: { $unset: { referencedInterventions: '' } }
    },
    {
      collection: interventionCollection,
      filter: { 'interventionArea.id': { $exists: true } },
      updateQuery: { $unset: { 'interventionArea.id': '' } }
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
