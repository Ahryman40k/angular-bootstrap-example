import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.8.10');
let TAXONOMIES_COLLECTION: MongoDb.Collection;

/**
 * For V2.8.12 we need to modify the taxonomy group requirementSubtype
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await replaceTaxonomies();
  await createSubmissionIndexes(db);
  // await add index
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.8.12 executed in ${milliseconds} milliseconds`);
}

// tslint:disable-next-line: no-async-without-await
async function replaceTaxonomies(): Promise<void> {
  logger.info('Update taxonomies');
  try {
    requirementSubType.forEach(async element => {
      await setRelatedDesignRequirementTaxonomy(element.code, element.relatedDesignRequirement);
    });
  } catch (e) {
    logger.error(`Replace taxonomies error -> ${e}`);
  }
}

async function setRelatedDesignRequirementTaxonomy(code: string, relatedDesignRequirement: string): Promise<void> {
  await TAXONOMIES_COLLECTION.findOneAndUpdate(
    { group: 'requirementSubtype', code },
    {
      $set: { 'properties.relatedDesignRequirement': relatedDesignRequirement }
    }
  );
}

const requirementSubType = [
  {
    code: 'coordinationObstacles',
    relatedDesignRequirement: 'coordinationObstacles'
  },
  {
    code: 'coordinationWork',
    relatedDesignRequirement: 'coordinationWork'
  },
  {
    code: 'rehabAqBeforePcpr',
    relatedDesignRequirement: 'rehabAqBeforePcpr'
  },
  {
    code: 'rehabAqBeforePrcpr',
    relatedDesignRequirement: 'rehabAqBeforePrcpr'
  },
  {
    code: 'rehabEgBeforePcpr',
    relatedDesignRequirement: 'rehabEgBeforePcpr'
  },
  {
    code: 'rehabEgBeforePrcpr',
    relatedDesignRequirement: 'rehabEgBeforePrcpr'
  },
  {
    code: 'espBeforePcpr',
    relatedDesignRequirement: 'espBeforePcpr'
  },
  {
    code: 'espBeforePrcpr',
    relatedDesignRequirement: 'espBeforePrcpr'
  },
  {
    code: 'otherRequirements',
    relatedDesignRequirement: 'other'
  }
];

async function createSubmissionIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.SUBMISSIONS}" collection.`);
  const submissions: MongoDb.Collection = db.collection(constants.mongo.collectionNames.SUBMISSIONS);
  await submissions.createIndexes([
    {
      key: {
        drmNumber: 1
      },
      name: 'drmNumber_1'
    },
    {
      key: {
        programBookId: 1
      },
      name: 'programBookId_1'
    },
    {
      key: {
        projectIds: 1
      },
      name: 'projectIds_1'
    },
    {
      key: {
        status: 1
      },
      name: 'status_1'
    },
    {
      key: {
        progressStatus: 1
      },
      name: 'progressStatus_1'
    }
  ]);
}
