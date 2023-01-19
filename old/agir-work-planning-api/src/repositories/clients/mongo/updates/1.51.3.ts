import * as _ from 'lodash';
import * as MongoDb from 'mongodb';
import * as mongoose from 'mongoose';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { appUtils } from '../../../../utils/utils';

const logger = createLogger('mongo/1.51.3');
let annualProgramCollection: MongoDb.Collection<any> = null;
let programBookCollection: MongoDb.Collection<any> = null;
let projectCollection: MongoDb.Collection<any> = null;
let interventionCollection: MongoDb.Collection<any> = null;

let annualProgramIds: mongoose.Types.ObjectId[];
let programBookIds: mongoose.Types.ObjectId[];
let interventionIds: string[];
/**
 * For V1.51.3 We need to update statuses of past projects and interventions.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  annualProgramCollection = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);
  programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  projectCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  interventionCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

  const currentYear = appUtils.getCurrentYear();

  await getPastAnnualProgramIds(currentYear);
  await getPastProgramBookIds();
  await updatePastProject(currentYear);
  await updatePastIntervention();

  const milliseconds = Date.now() - startTime;
  logger.info(`Past projects, past interventions statuses updated in  ${milliseconds} milliseconds`);
}

async function getPastAnnualProgramIds(currentYear: number) {
  const annualPrograms = await annualProgramCollection.find({ year: { $lt: currentYear } }).toArray();
  annualProgramIds = annualPrograms.map(annualProgram => annualProgram._id);
}

async function getPastProgramBookIds() {
  const programBooks = await programBookCollection.find({ annualProgramId: { $in: annualProgramIds } }).toArray();
  programBookIds = programBooks.map(programBook => programBook._id);
}

async function updatePastProject(currentYear: number) {
  const projects = await projectCollection
    .find({
      $and: [
        { 'annualDistribution.annualPeriods.programBookId': { $in: programBookIds } },
        { endYear: { $lt: currentYear } }
      ]
    })
    .toArray();
  const projectIds = projects.map(project => project._id);
  interventionIds = _.flatten(projects.map(project => project.interventionIds));
  await projectCollection.updateMany({ _id: { $in: projectIds } }, { $set: { status: 'worked' } });
}

async function updatePastIntervention() {
  await interventionCollection.updateMany({ _id: { $in: interventionIds } }, { $set: { status: 'worked' } });
}
