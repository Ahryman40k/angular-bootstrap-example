import { ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { convertIdsToObjectIds } from '../../../middlewares/convertIdsToObjectIdsMiddleware';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { getProjectsLookup } from '../../projects/mongo/projectModel';
import { IProgramBookProps } from '../models/programBook';
import { programBookSchema } from './programBookSchema';

export type IProgramBookMongoDocument = IProgramBookProps & Document;
export type ProgramBookModel = CustomModel<IProgramBookProps>;

const PROJECTS_ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID = 'annualDistribution.annualPeriods.programBookId';

export const programBookModelFactory = (mongoose: Connection) => {
  programBookSchema.plugin(convertIdsToObjectIds, [
    'annualProgramId',
    `projects.${PROJECTS_ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID}`
  ]);

  const programBookModel = mongoose.model<IProgramBookMongoDocument>(
    constants.mongo.collectionNames.PROGRAM_BOOKS,
    programBookSchema
  ) as ProgramBookModel;
  programBookModel.schema = programBookSchema;

  // Set lookups with expands
  programBookModel.lookups = (aggregate, expand: ProgramBookExpand[] = []) => {
    if (expand.includes(ProgramBookExpand.projectsInterventions)) {
      aggregate.lookup(getProgramBookProjectsLookup());

      aggregate.unwind({
        path: '$projects',
        preserveNullAndEmptyArrays: true
      });
      aggregate.lookup({
        from: 'interventions',
        localField: 'projects.interventionIds',
        foreignField: '_id',
        as: 'interventions'
      });
      aggregate.addFields({
        'projects.interventions': {
          $cond: [{ $gte: [{ $size: '$interventions' }, 1] }, '$interventions', null]
        }
      });
      aggregate.group({
        _id: '$_id',
        myProjects: { $addToSet: '$projects' },
        root: { $mergeObjects: '$$ROOT' }
      });
      aggregate.replaceRoot({
        $mergeObjects: ['$root', '$$ROOT']
      });
      aggregate.addFields({
        projects: { $cond: ['$projects._id', '$myProjects', null] }
      });
      aggregate.project({
        interventions: 0,
        root: 0,
        myProjects: 0
      });
    }

    if (expand.includes(ProgramBookExpand.projects)) {
      aggregate.lookup(getProgramBookProjectsLookup());
    }
    if (expand.includes(ProgramBookExpand.removedProjects)) {
      aggregate.lookup({
        ...getProjectsLookup(),
        localField: 'removedProjectsIds',
        as: 'removedProjects'
      });
    }
    if (expand.includes('annualProgram' as ProgramBookExpand)) {
      aggregate.lookup({
        from: constants.mongo.collectionNames.ANNUAL_PROGRAMS,
        localField: 'annualProgramId',
        foreignField: '_id',
        as: 'annualProgram'
      });
      aggregate.unwind({
        path: '$annualProgram',
        preserveNullAndEmptyArrays: true
      });
    }
  };
  return programBookModel;
};

const getProgramBookProjectsLookup = () => {
  return {
    ...getProjectsLookup(),
    localField: '_id',
    foreignField: PROJECTS_ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID,
    as: 'projects'
  };
};
