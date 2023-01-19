import {
  IEnrichedProgramBook,
  ITaxonomy,
  ProgramBookObjectiveType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { CustomModel } from '../../../mongo/customModel';

const logger = createLogger('mongo/2.5.1');
let taxonomiesCollection: MongoDb.Collection<any> = null;
let programBookCollection: MongoDb.Collection<any> = null;
/**
 * For V2.5.1 Update objective type taxonomies and update program book objectives
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  await deleteObjectiveTypeTaxonomy();
  await insertObjectiveTypeTaxonomy();

  const programBooks = await getProgramBooks();
  updateProgramBookObjectives(programBooks);
  await persistProgramBooks(programBooks);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.5.1 executed in ${milliseconds} milliseconds`);
}

async function deleteObjectiveTypeTaxonomy() {
  await taxonomiesCollection.deleteMany({ group: TaxonomyGroup.objectiveType });
}

async function insertObjectiveTypeTaxonomy() {
  const taxonomies: ITaxonomy[] = [
    {
      group: TaxonomyGroup.objectiveType,
      code: ProgramBookObjectiveType.threshold,
      label: {
        fr: `Seuil`,
        en: `Threshold`
      }
    },
    {
      group: TaxonomyGroup.objectiveType,
      code: ProgramBookObjectiveType.performanceIndicator,
      label: {
        fr: `Indicateur de performance`,
        en: `Performance indicator`
      }
    }
  ];
  await taxonomiesCollection.insertMany(taxonomies);
}

function updateProgramBookObjectives(programBooks: any[]) {
  for (const programBook of programBooks) {
    for (const objective of programBook.objectives) {
      objective.targetType = objective.type;
      objective.objectiveType = ProgramBookObjectiveType.threshold;
      delete objective.type;
    }
  }
}

async function getProgramBooks(): Promise<CustomModel<IEnrichedProgramBook>[]> {
  return programBookCollection.find({}).toArray();
}

async function persistProgramBooks(programBooks: CustomModel<IEnrichedProgramBook>[]): Promise<void> {
  for (const programBook of programBooks) {
    try {
      await programBookCollection.replaceOne(
        {
          _id: (programBook as any)._id
        },
        programBook
      );
    } catch (e) {
      throw e;
    }
  }
}
