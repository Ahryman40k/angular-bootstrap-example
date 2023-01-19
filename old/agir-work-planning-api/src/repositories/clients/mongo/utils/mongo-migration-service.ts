import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { ILogger } from '../../../../utils/logger';

/**
 * Class that aggregates all common operations for migration.
 */
export class MongoMigrationService {
  constructor(private readonly logger: ILogger, private readonly db: MongoDb.Db) {}

  /**
   * Deletes all collections data but ignores exceptions if any.
   * Only deletes collections that may contain application data.
   * Will not delete taxonomies and app schema collections.
   */
  public async deleteCollectionsData(exceptions: string[] = null): Promise<void> {
    this.logger.debug('Starting to clean collections');
    const collectionsToClean = [
      constants.mongo.collectionNames.ANNUAL_PROGRAMS,
      constants.mongo.collectionNames.ANNUAL_PROGRAMS_HISTORICALS,
      constants.mongo.collectionNames.CONSTRAINTS_HISTORICALS,
      constants.mongo.collectionNames.COUNTERS,
      constants.mongo.collectionNames.HISTORY,
      constants.mongo.collectionNames.IMPORT_RELATIONS,
      constants.mongo.collectionNames.INTERVENTIONS,
      constants.mongo.collectionNames.INTERVENTIONS_HISTORICALS,
      constants.mongo.collectionNames.PROGRAM_BOOKS,
      constants.mongo.collectionNames.PROGRAM_BOOKS_HISTORICALS,
      constants.mongo.collectionNames.PROJECTS_HISTORICALS,
      constants.mongo.collectionNames.PROJECTS,
      constants.mongo.collectionNames.USERS_PREFERENCES
    ];

    if (exceptions != null) {
      exceptions.forEach(exception => {
        const indexOfException = collectionsToClean.indexOf(exception, 0);
        if (indexOfException > -1) {
          collectionsToClean.splice(indexOfException, 1);
        }
      });
    }

    for (const collectionName of collectionsToClean) {
      this.logger.debug('Cleaning collection: ' + collectionName);
      await this.db.collection(collectionName).deleteMany({});
    }
    this.logger.debug('Done cleaning collections');
  }
}
