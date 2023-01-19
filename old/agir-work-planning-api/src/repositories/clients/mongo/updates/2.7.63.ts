import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.63`;
const logger = createLogger(`mongo/${VERSION}`);
let TAXONOMIES_COLLECTION: Collection;

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  try {
    await insertRole();
    await updateShareableRoles();
  } catch (e) {
    logger.error(e, `Migration ${VERSION} FAILED`);
    return;
  }
  const seconds = (Date.now() - startTime) / 1000;
  logger.info(`Migration ${VERSION} finished in ${seconds} seconds`);
}

async function insertRole(): Promise<void> {
  await TAXONOMIES_COLLECTION.insertOne({
    group: 'role',
    code: 'PLANNER_SE',
    label: {
      fr: "Planificateur du service de l'eau",
      en: "Planificateur du service de l'eau"
    }
  });
}

async function updateShareableRoles(): Promise<void> {
  await Promise.all(
    getShareableRoles().map(shareableRole =>
      TAXONOMIES_COLLECTION.updateOne(
        { group: shareableRole.group, code: shareableRole.code },
        {
          $set: {
            valueString1: shareableRole.valueString1
          }
        }
      )
    )
  );
}

function getShareableRoles(): ITaxonomy[] {
  return [
    {
      group: 'shareableRole',
      code: 'programBook',
      valueString1: 'EXECUTOR,INTERNAL-GUEST-STANDARD,INTERNAL-GUEST-RESTRICTED'
    },
    {
      group: 'shareableRole',
      code: 'annualProgram',
      valueString1: 'EXECUTOR,INTERNAL-GUEST-STANDARD,INTERNAL-GUEST-RESTRICTED'
    }
  ] as ITaxonomy[];
}
