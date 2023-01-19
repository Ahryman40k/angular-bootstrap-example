import { InterventionExternalReferenceType, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { ISubmissionAttributes } from '../../../../features/submissions/mongo/submissionModel';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.56');
let TAXONOMIES_COLLECTION: Collection;
let PROJECTS_COLLECTION: Collection;
let SUBMISSION_COLLECTION: Collection;
/**
 * For V2.7.56 we need to add the taxonomy submissionStatus and submissionProgressStatus
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);
  await insertTaxonomies();
  await unsetProjectsCollection();
  await createSubmissionsCollection(db);
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.56 executed in ${milliseconds} milliseconds`);
}

async function insertTaxonomies(): Promise<void> {
  logger.info('Start insert taxonomies');
  try {
    await TAXONOMIES_COLLECTION.insertMany(taxos2756);
    logger.info(`nexoReferenceNumber inserted in collection ${TAXONOMIES_COLLECTION}`);
  } catch (e) {
    logger.error(
      `Error inserting externalReferenceType ${InterventionExternalReferenceType.nexoReferenceNumber} -> ${e}`
    );
  }
}

interface IIdAndSubmissions {
  _id: string;
  submissions: ISubmissionAttributes;
}

async function unsetProjectsCollection(): Promise<void> {
  logger.info('Start update project colllection');
  try {
    const limit = 20;
    let offset = 0;
    let projectsIdsAndSubmissions = await getIdsAndSubmissions(offset, limit);
    while (!isEmpty(projectsIdsAndSubmissions)) {
      await Promise.all(
        projectsIdsAndSubmissions.map(idAndSubmissions => {
          if (!isEmpty(idAndSubmissions.submissions)) {
            return PROJECTS_COLLECTION.updateOne(
              { _id: idAndSubmissions._id },
              {
                $unset: { submissions: '' }
              }
            );
          }
          return undefined;
        })
      );
      offset = offset + limit;
      projectsIdsAndSubmissions = await getIdsAndSubmissions(offset, limit);
    }
  } catch (e) {
    logger.error(`Error updating intervention collection assets externalReferenceIds -> ${e}`);
  }
}

async function getIdsAndSubmissions(offset: number, limit: number): Promise<IIdAndSubmissions[]> {
  return await PROJECTS_COLLECTION.find(
    {},
    {
      skip: offset,
      limit,
      fields: { submissions: 1 }
    }
  ).toArray();
}

async function createSubmissionsCollection(db: Db) {
  SUBMISSION_COLLECTION = await db.createCollection(constants.mongo.collectionNames.SUBMISSIONS);
  await SUBMISSION_COLLECTION.createIndexes([
    {
      key: {
        submissionNumber: 1
      },
      name: 'submissionNumber_1'
    }
  ]);
}

const taxoSubmissionsStatuses: ITaxonomy[] = [
  {
    group: 'submissionStatus',
    code: 'valid',
    label: {
      en: 'Valid',
      fr: 'Valide'
    }
  },
  {
    group: 'submissionStatus',
    code: 'invalid',
    label: {
      en: 'Invalid',
      fr: 'Invalide'
    }
  }
];
const taxoSubmissionsProgressStatuses: ITaxonomy[] = [
  {
    group: 'submissionProgressStatus',
    code: 'preliminaryDraft',
    label: {
      en: 'Preliminary draft',
      fr: 'Avant-projet'
    }
  },
  {
    group: 'submissionProgressStatus',
    code: 'design',
    label: {
      en: 'Design',
      fr: 'Conception'
    }
  },
  {
    group: 'submissionProgressStatus',
    code: 'callForTender',
    label: {
      en: 'Call for tender',
      fr: "Appel d'offre"
    }
  },
  {
    group: 'submissionProgressStatus',
    code: 'granted',
    label: {
      en: 'Granted',
      fr: 'Octroyée'
    }
  },
  {
    group: 'submissionProgressStatus',
    code: 'realization',
    label: {
      en: 'Réalisation',
      fr: 'Réalisation'
    }
  },
  {
    group: 'submissionProgressStatus',
    code: 'closing',
    label: {
      en: 'Closing',
      fr: 'Fermeture'
    }
  }
];

export const taxos2756: ITaxonomy[] = [...taxoSubmissionsStatuses, ...taxoSubmissionsProgressStatuses];
