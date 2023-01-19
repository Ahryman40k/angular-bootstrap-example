import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Collection, Db, FilterQuery, UpdateManyOptions, UpdateQuery } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.2`;
const logger = createLogger(`mongo/${VERSION}`);

interface IUpdateMigration {
  collection: Collection;
  filter: FilterQuery<any>;
  updateQuery: UpdateQuery<any> | any;
  options?: UpdateManyOptions;
}

interface IDeleteMigration {
  collection: Collection;
  filter: FilterQuery<any>;
}

export default async function update(db: Db): Promise<void> {
  const waterManagementCode = 'waterManagement';
  const dreCode = 'dre';
  const planningCode = 'planning';

  const startTime = Date.now();
  const TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  const INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  const OPPORTUNITY_NOTICES_COLLECTION = db.collection(constants.mongo.collectionNames.OPPORTUNITY_NOTICES);
  const PROGRAM_BOOKS_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  const PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);
  const updateMigrations: IUpdateMigration[] = [
    // RequestorId
    {
      collection: INTERVENTIONS_COLLECTION,
      filter: { requestorId: waterManagementCode },
      updateQuery: { $set: { requestorId: dreCode } }
    },
    {
      collection: OPPORTUNITY_NOTICES_COLLECTION,
      filter: { requestorId: waterManagementCode },
      updateQuery: { $set: { requestorId: dreCode } }
    },
    {
      collection: PROJECTS_COLLECTION,
      filter: { inChargeId: waterManagementCode },
      updateQuery: { $set: { inChargeId: dreCode } }
    },
    {
      collection: PROGRAM_BOOKS_COLLECTION,
      filter: { 'objectives.requestorId': waterManagementCode },
      updateQuery: { $set: { 'objectives.$[el].requestorId': dreCode } },
      options: { arrayFilters: [{ 'el.requestorId': waterManagementCode }] }
    },
    {
      collection: PROGRAM_BOOKS_COLLECTION,
      filter: { 'priorityScenarios.priorityLevels.criteria.requestorId': waterManagementCode },
      updateQuery: { $set: { 'priorityScenarios.$[].priorityLevels.$[].criteria.requestorId.$[el]': dreCode } },
      options: { arrayFilters: [{ el: waterManagementCode }] }
    },
    // Assets owner
    {
      collection: INTERVENTIONS_COLLECTION,
      filter: { 'assets.ownerId': waterManagementCode },
      updateQuery: { $set: { 'assets.$[el].ownerId': dreCode } },
      options: { arrayFilters: [{ 'el.ownerId': waterManagementCode }] }
    },
    {
      collection: OPPORTUNITY_NOTICES_COLLECTION,
      filter: { 'assets.ownerId': waterManagementCode },
      updateQuery: { $set: { 'assets.$[el].ownerId': dreCode } },
      options: { arrayFilters: [{ 'el.ownerId': waterManagementCode }] }
    },
    {
      collection: TAXONOMIES_COLLECTION,
      filter: { 'properties.owners': waterManagementCode },
      updateQuery: { $pull: { 'properties.owners': waterManagementCode } }
    }
  ];
  const deleteMigrations: IDeleteMigration[] = [
    {
      collection: TAXONOMIES_COLLECTION,
      filter: { group: TaxonomyGroup.requestor, code: waterManagementCode }
    },
    {
      collection: TAXONOMIES_COLLECTION,
      filter: { group: TaxonomyGroup.assetOwner, code: waterManagementCode }
    },
    {
      collection: TAXONOMIES_COLLECTION,
      filter: { group: TaxonomyGroup.assetOwner, code: planningCode }
    }
  ];

  for (const migration of deleteMigrations) {
    logger.info(
      `Start deleting from ${migration.collection.collectionName} with filter ${JSON.stringify(migration.filter)}`
    );
    await migration.collection.deleteMany(migration.filter);
    // assert deletion
    const result = await migration.collection.find(migration.filter).toArray();
    if (!isEmpty(result)) {
      throw new Error(
        `Some ${migration.collection.collectionName} still have ${JSON.stringify(migration.filter)} : ${result.length}`
      );
    }
    logger.info(
      `Elements from ${migration.collection.collectionName} with filter ${JSON.stringify(
        migration.filter
      )} are deleted with success`
    );
  }

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
