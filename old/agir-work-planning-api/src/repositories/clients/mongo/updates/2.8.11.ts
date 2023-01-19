import { InterventionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { IUpdateMigration, migrationScript } from '../../../../utils/MigrationScriptsUtils';

const VERSION = `2.8.11`;
const logger = createLogger(`mongo/${VERSION}`);

export default async function update(db: MongoDb.Db): Promise<void> {
  const updateMigration: IUpdateMigration = {
    collection: db.collection(constants.mongo.collectionNames.INTERVENTIONS),
    filter: { status: InterventionStatus.waiting, 'project.id': { $exists: true, $ne: null } },
    updateQuery: { $set: { status: InterventionStatus.integrated } }
  };
  await migrationScript.update(logger, updateMigration);
}
