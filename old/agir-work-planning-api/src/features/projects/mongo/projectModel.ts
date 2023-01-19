import {
  IBudget,
  IEnrichedProjectAnnualDistribution,
  IGeometry,
  IPoint,
  IProjectDecision,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { alphaNumericIdIncPlugin } from '../../../middlewares/alphaNumericIdIncPlugin';
import { convertIdsToObjectIds } from '../../../middlewares/convertIdsToObjectIdsMiddleware';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IExternalReferenceIdAttributes } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { ICommentAttributes } from '../../comments/mongo/commentSchema';
import { IDocumentMongoAttributes } from '../../documents/mongo/documentSchema';
import { ILengthAttributes } from '../../length/mongo/lengthSchemas';
import { IServicePriorityAttributes } from '../../servicePriority/mongo/servicePrioritySchema';
import { projectSchema } from './projectSchemas';

export type IProjectMongoDocument = IProjectAttributes & Document;
export type ProjectModel = CustomModel<IProjectAttributes>;

export const PROJECT_ID = 'project.id';
export const ANNUAL_DISTRIBUTION_ANNUAL_PERIODS = 'annualDistribution.annualPeriods';

export interface IRtuExportMongoAttributes {
  status: string;
  exportAt: string;
}

export interface IProjectAttributes {
  _id: string;
  boroughId: string;
  endYear: number;
  executorId: string;
  geometry: IGeometry;
  globalBudget: IBudget;
  importFlag: string;
  inChargeId: string;
  interventionIds: string[];
  servicePriorities: IServicePriorityAttributes[];
  projectName: string;
  projectTypeId: string;
  riskId: string;
  startYear: number;
  status: string;
  streetName: string;
  subCategoryIds: string[];
  annualDistribution: IEnrichedProjectAnnualDistribution;
  contact: string;
  decisions: IProjectDecision[];
  documents: IDocumentMongoAttributes[];
  geometryPin: IPoint;
  length: ILengthAttributes;
  medalId: string;
  roadNetworkTypeId: string;
  streetFrom: string;
  streetTo: string;
  isOpportunityAnalysis: boolean;
  comments: ICommentAttributes[];
  externalReferenceIds?: IExternalReferenceIdAttributes[];
  moreInformationAudit: IAuditAttributes;
  audit: IAuditAttributes;
  drmNumber?: string;
  submissionNumber?: string;
  rtuExport: IRtuExportMongoAttributes;
}

export const getProjectsInterventionsLookup = () => {
  return {
    from: constants.mongo.collectionNames.INTERVENTIONS,
    localField: 'interventionIds',
    foreignField: '_id',
    as: 'interventions'
  };
};

export const getProjectsLookup = () => {
  return {
    from: constants.mongo.collectionNames.PROJECTS,
    localField: PROJECT_ID,
    foreignField: '_id',
    as: 'project'
  };
};

export const projectModelFactory = (mongoose: Connection) => {
  /**
   * We add a plugin to convert guid to custom Project Id
   * ex: 5ef100f54ba31549740f19ee to P00001
   */
  projectSchema.plugin(alphaNumericIdIncPlugin, {
    key: constants.mongo.collectionNames.PROJECTS,
    prefix: 'P'
  });
  projectSchema.plugin(convertIdsToObjectIds, ['annualDistribution.annualPeriods.programBookId']);

  const projectModel = mongoose.model<IProjectMongoDocument>(
    constants.mongo.collectionNames.PROJECTS,
    projectSchema
  ) as ProjectModel;
  projectModel.schema = projectSchema;
  projectModel.hasObjectId = false;

  // Set lookups with expands
  projectModel.lookups = (aggregate, expand: ProjectExpand[] = []) => {
    if (expand.includes(ProjectExpand.programBook) || expand.includes(ProjectExpand.annualProgram)) {
      const programLookup: any = {
        from: constants.mongo.collectionNames.PROGRAM_BOOKS,
        let: { programBookId: '$annualDistribution.annualPeriods.programBookId' },
        as: 'programBookRelation'
      };

      let pipeline: any[] = [{ $match: { $expr: { $in: ['$_id', '$$programBookId'] } } }];
      if (expand.includes(ProjectExpand.annualProgram)) {
        pipeline = [...pipeline, ...getAnnualProgramAsLookupPipeline()];
      }
      aggregate.lookup({
        ...programLookup,
        pipeline
      });
      // recreate the annual period array with merge current element + found programBook elements
      aggregate.addFields({
        'annualDistribution.annualPeriods': {
          $map: {
            input: '$annualDistribution.annualPeriods',
            in: {
              $mergeObjects: [
                '$$this',
                {
                  programBook: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$programBookRelation',
                          as: 'pbr',
                          cond: { $eq: ['$$this.programBookId', '$$pbr._id'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      });
      aggregate.project({ programBookRelation: 0 });
    }
    if (expand.includes(ProjectExpand.interventions)) {
      aggregate.lookup(getProjectsInterventionsLookup());
    }
  };

  return projectModel;
};

function getAnnualProgramAsLookupPipeline(): any[] {
  return [
    {
      $lookup: {
        from: constants.mongo.collectionNames.ANNUAL_PROGRAMS,
        let: { annualProgramId: '$annualProgramId' },
        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$annualProgramId'] } } }],
        // Create a temporaray lis with lookups
        as: 'annualProgramTemp'
      }
    },
    // a lookup always return an array so just set the desired field as first element of lookup array
    {
      $addFields: {
        annualProgram: {
          $arrayElemAt: ['$annualProgramTemp', 0]
        }
      }
    },
    // Remove the temporary object
    {
      $project: { annualProgramTemp: 0 }
    }
  ];
}
