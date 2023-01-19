import { ProgramBookPriorityScenarioStatus, ProjectCategory } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { Types } from 'mongoose';
import { constants } from '../../../../../config/constants';
import { Audit } from '../../../../features/audit/audit';
import { PriorityLevel } from '../../../../features/priorityScenarios/models/priorityLevel';
import { PriorityScenario } from '../../../../features/priorityScenarios/models/priorityScenario';
import { IPriorityScenarioMongoAttributes } from '../../../../features/priorityScenarios/mongo/priorityScenarioSchema';
import { ProgramBookModel } from '../../../../features/programBooks/mongo/programBookModel';
import { createLogger } from '../../../../utils/logger';

/**
 * For V2.4.3 we create programBook's priorityScenarios
 */
const logger = createLogger('mongo/2.4.3');
let programBookCollection: MongoDb.Collection<ProgramBookModel>;
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  await updateAndPersistProgramBooks();
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.4.3 executed in ${milliseconds} milliseconds`);
}

async function updateAndPersistProgramBooks(): Promise<void> {
  const priorityScenarios: IPriorityScenarioMongoAttributes[] = createInitialPriorityScenarios().map(ps =>
    PriorityScenario.toPersistence(ps)
  );
  await programBookCollection.updateMany(
    {
      priorityScenarios: { $exists: false }
    },
    {
      $set: {
        priorityScenarios
      }
    }
  );
}

function createInitialPriorityScenarios(): PriorityScenario[] {
  const priorityLevelResult = PriorityLevel.create({
    rank: 1,
    isSystemDefined: true,
    criteria: {
      projectCategory: [{ category: ProjectCategory.completing }]
    },
    projectCount: 0
  });

  const priorityLevel = priorityLevelResult.getValue();
  const priorityScenarioResult = PriorityScenario.create({
    id: Types.ObjectId().toString(),
    name: 'scenario1',
    priorityLevels: [priorityLevel],
    orderedProjects: [],
    isOutdated: true,
    status: ProgramBookPriorityScenarioStatus.pending,
    audit: Audit.fromCreateContext()
  });
  return [priorityScenarioResult.getValue()];
}
