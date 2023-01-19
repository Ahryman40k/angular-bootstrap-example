import { IEnrichedProjectAnnualPeriod, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import * as MongoDb from 'mongodb';
import * as mongoose from 'mongoose';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { appUtils } from '../../../../utils/utils';

const logger = createLogger('mongo/1.51.0');
let annualProgramCollection: MongoDb.Collection<any> = null;
let programBookCollection: MongoDb.Collection<any> = null;
let projectCollection: MongoDb.Collection<any> = null;
let interventionCollection: MongoDb.Collection<any> = null;

let annualProgramIds: mongoose.Types.ObjectId[];
let programBookIds: mongoose.Types.ObjectId[];
let projectIds: string[];
let interventionIds: string[];
let completingInterventionIds: string[];
/**
 * For V1.51.0 We need to update statuses of past annual programs, program books, project and interventions.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  annualProgramCollection = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);
  programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  projectCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  interventionCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

  const currentYear = appUtils.getCurrentYear();

  await updatePastAnnualPrograms(currentYear);
  await updatePastProgramBooks();
  await updatePastProject(currentYear);
  await updateCompletingProject(currentYear);
  await updatePastIntervention();
  await updateCompletingIntervention();

  const seconds = Date.now() - startTime;
  logger.info(
    `Past annual Program, past program book, past projects, past interventions statuses updated in  ${seconds} milliseconds`
  );
}

async function updatePastAnnualPrograms(currentYear: number) {
  const annualPrograms = await annualProgramCollection.find({ year: { $lt: currentYear } }).toArray();
  annualProgramIds = annualPrograms.map(annualProgram => annualProgram._id);
  await annualProgramCollection.updateMany({ _id: { $in: annualProgramIds } }, { $set: { status: 'done' } });
}

async function updatePastProgramBooks() {
  const programBooks = await programBookCollection.find({ annualProgramId: { $in: annualProgramIds } }).toArray();
  programBookIds = programBooks.map(programBook => programBook._id);
  await programBookCollection.updateMany(
    { _id: { $in: programBookIds } },
    { $set: { status: ProgramBookStatus.submittedFinal } }
  );
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
  projectIds = projects.map(project => project._id);
  interventionIds = _.flatten(projects.map(project => project.interventionIds));
  await projectCollection.updateMany(
    { _id: { $in: projectIds } },
    { $set: { status: 'worked', 'annualDistribution.annualPeriods.$[].status': 'worked' } }
  );
}

async function updateCompletingProject(currentYear: number) {
  const projects = await projectCollection
    .find({
      $and: [
        { 'annualDistribution.annualPeriods.programBookId': { $in: programBookIds } },
        { startYear: { $lt: currentYear } },
        { endYear: { $gte: currentYear } }
      ]
    })
    .toArray();
  updateAnnualPeriodsStatus(projects, currentYear);
  projectIds = projects.map(project => project._id);
  completingInterventionIds = _.flatten(projects.map(project => project.interventionIds));
  for (const updatedProject of projects) {
    await projectCollection.updateOne(
      { _id: updatedProject._id },
      { $set: { 'annualDistribution.annualPeriods': updatedProject.annualDistribution.annualPeriods } }
    );
  }
}

async function updatePastIntervention() {
  await interventionCollection.updateMany({ _id: { $in: interventionIds } }, { $set: { status: 'worked' } });
}

async function updateCompletingIntervention() {
  await interventionCollection.updateMany(
    { _id: { $in: completingInterventionIds } },
    { $set: { status: 'inRealization' } }
  );
}

function updateAnnualPeriodsStatus(projects: any[], currentYear: number): void {
  projects.forEach(project => {
    project.annualDistribution.annualPeriods.map((ap: IEnrichedProjectAnnualPeriod) => {
      if (ap.year < currentYear) {
        ap.status = 'worked';
      }
      return ap;
    });
  });
}
