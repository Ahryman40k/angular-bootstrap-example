import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { remove } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.44');
let PROJECTS_COLLECTION: Collection;
let TAXONOMIES_COLLECTION: Collection;

const STATUS_CODES_TO_REMOVE = ['archived', 'inDesign', 'worked', 'created', 'inRealization'];

/**
 * For V2.7.44 update project status taxonomies and adjust project with invalid status
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);
    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

    await deleteProjectStatusTaxonomies();
    await updateProjectStatuses();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.44 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function deleteProjectStatusTaxonomies(): Promise<void> {
  await TAXONOMIES_COLLECTION.deleteMany({
    group: TaxonomyGroup.projectStatus,
    code: { $in: STATUS_CODES_TO_REMOVE }
  });
}

async function updateProjectStatuses(): Promise<void> {
  await PROJECTS_COLLECTION.updateMany(
    {
      status: 'created'
    },
    {
      $set: {
        status: 'planned'
      }
    }
  );

  await PROJECTS_COLLECTION.updateMany(
    {
      status: { $in: remove(STATUS_CODES_TO_REMOVE, 'created') }
    },
    {
      $set: {
        status: 'programmed'
      }
    }
  );
}
