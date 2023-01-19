import { Collection, FilterQuery, UpdateManyOptions, UpdateQuery } from 'mongodb';

import { ILogger } from './logger';

export interface IUpdateMigration {
  collection: Collection;
  filter: FilterQuery<any>;
  updateQuery: UpdateQuery<any>;
  options?: UpdateManyOptions;
}

export interface IDeleteMigration {
  collection: Collection;
  filter: FilterQuery<any>;
}

// class used to apply migrations on the database
class MigrationScript {
  // method to update colllections
  public async update(logger: ILogger, ...updateMigrations: IUpdateMigration[]) {
    const startTime = Date.now();
    for (const updateMigration of updateMigrations) {
      logger.info(
        `Start updating ${updateMigration.collection.collectionName} with filter ${JSON.stringify(
          updateMigration.filter
        )}`
      );

      const updateResult = await updateMigration.collection.updateMany(
        updateMigration.filter,
        updateMigration.updateQuery,
        updateMigration.options
      );

      if (updateResult.result.ok !== 1) {
        throw new Error(`an error occurred when updating ${updateMigration.collection.collectionName}`);
      }
      logger.info(
        ` ${updateResult.result.nModified} elements from ${updateMigration.collection.collectionName} are updated with success`
      );
    }
    const seconds = Date.now() - startTime;
    logger.info(`Documents updated in ${seconds} seconds`);
  }

  // method to delete colllections
  public async delete(logger: ILogger, ...deleteMigrations: IDeleteMigration[]) {
    for (const deleteMigration of deleteMigrations) {
      logger.info(
        `Start deleting from ${deleteMigration.collection.collectionName} with filter ${JSON.stringify(
          deleteMigration.filter
        )}`
      );
      const deleteResult = await deleteMigration.collection.deleteMany(deleteMigration.filter);
      // assert deletion
      if (deleteResult.result.ok !== 1) {
        throw new Error(
          `${deleteMigration.collection.collectionName} still have elements with filter: ${JSON.stringify(
            deleteMigration.filter
          )}`
        );
      }
      logger.info(
        `Elements from ${deleteMigration.collection.collectionName} with filter ${JSON.stringify(
          deleteMigration.filter
        )} are deleted with success`
      );
    }
  }
}

export const migrationScript = new MigrationScript();
