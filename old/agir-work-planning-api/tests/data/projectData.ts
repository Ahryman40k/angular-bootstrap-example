import * as turf from '@turf/turf';
import {
  BoroughCode,
  CommentCategory,
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  IEnrichedProjectAnnualPeriod,
  IExternalReferenceId,
  IFeature,
  IGeometry,
  IHistory,
  IPlainProject,
  IProjectDecision,
  ProjectCategory,
  ProjectDecisionType,
  ProjectStatus,
  ProjectSubCategory,
  ProjectType
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as request from 'superagent';

import { getIComment } from '../../src/features/comments/tests/commentTestHelper';
import { db } from '../../src/features/database/DB';
import { historyRepository } from '../../src/features/history/mongo/historyRepository';
import { ImportFlag } from '../../src/features/imports/enums/importFlag';
import { projectService } from '../../src/features/projects/projectService';
import { geolocatedAnnualDistributionService } from '../../src/services/annualDistribution/geolocatedAnnualDistributionService';
import { nonGeolocatedAnnualDistributionService } from '../../src/services/annualDistribution/nonGeolocatedAnnualDistributionService';
import { interventionWorkAreaService } from '../../src/services/interventionWorkAreaService';
import { EXECUTOR_DI } from '../../src/shared/taxonomies/constants';
import { appUtils } from '../../src/utils/utils';
import { normalizeDataTest } from '../utils/normalizeDataTest';
import { requestService } from '../utils/requestService';
import { createAuthorMock } from './author.mocks';
import { getMinimalInitialIntervention } from './interventionData';

export type IEnrichedProjectPatch = Partial<IEnrichedProject>;

export interface IProjectListAppends {
  categories?: boolean;
  subCategories?: boolean;
  status?: boolean;
}

interface IEnrichedProjectAnnualDistributionOptions {
  projectGeoAnnualDistribution?: Partial<IEnrichedProjectAnnualDistribution>;
  projectNonGeoAnnualDistribution?: Partial<IEnrichedProjectAnnualDistribution>;
}

export function getInitialProject(props?: Partial<IEnrichedProject>): IEnrichedProject {
  // geometry used contains queen street
  const startYear = appUtils.getCurrentYear();
  const endYear = startYear + 4;
  const initialProject: IEnrichedProject = {
    projectName: 'project',
    projectTypeId: ProjectType.integrated,
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: EXECUTOR_DI,
    startYear,
    endYear,
    globalBudget: {
      allowance: 0
    },
    geometry: getGeometry(),
    geometryPin: [-73.55532020330429, 45.497742513338316],
    interventionIds: [],
    interventions: [],
    importFlag: ImportFlag.external,
    externalReferenceIds: [],
    isOpportunityAnalysis: false,
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: createAuthorMock()
    },
    ...props
  };
  initialProject.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(initialProject);
  return initialProject;
}

export function getGeometry(): IGeometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.6541998386383, 45.526488825842115],
        [-73.65415155887604, 45.526612846337976],
        [-73.65443855524063, 45.52668425195399],
        [-73.65487307310104, 45.525998378475315],
        [-73.65459948778152, 45.52588751047034],
        [-73.6541998386383, 45.526488825842115]
      ]
    ]
  };
}

export const intersectGeometryTestData: IGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.65474700927734, 45.526296217711796],
      [-73.65479931235313, 45.526201322731936],
      [-73.65436747670172, 45.526069784871304],
      [-73.6543419957161, 45.526162800961735],
      [-73.65474700927734, 45.526296217711796]
    ]
  ]
};

export const invalidIntersectGeometryTestData: IGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.55569839477539, 45.49699237243128],
      [-73.55505466461182, 45.49699237243128],
      [-73.55505466461182, 45.49860170268013],
      [-73.55569839477539, 45.49860170268013]
    ]
  ]
};

export function getAnnualDistribution(): IEnrichedProjectAnnualDistribution {
  const startYear = appUtils.getCurrentYear();
  return {
    distributionSummary: {
      totalAdditionalCosts: 0,
      totalInterventionBudgets: 0,
      totalBudget: 0,
      totalAnnualBudget: { totalAllowance: 0 }
    },
    annualPeriods: [
      {
        rank: 0,
        year: startYear,
        additionalCosts: [
          { type: 'professionalServices', amount: 0 },
          { type: 'contingency', amount: 0 }
        ],
        annualAllowance: 6000,
        annualBudget: 6000,
        categoryId: 'new'
      },
      {
        rank: 1,
        year: startYear + 1,
        additionalCosts: [
          { type: 'others', amount: 0 },
          { type: 'workExpenditures', amount: 0 }
        ],
        annualAllowance: 6000,
        annualBudget: 6000,
        categoryId: 'completing'
      },
      {
        rank: 2,
        year: startYear + 2,
        additionalCosts: [
          { type: 'others', amount: 0 },
          { type: 'workExpenditures', amount: 0 }
        ],
        annualAllowance: 6000,
        annualBudget: 6000,
        categoryId: 'completing'
      },
      {
        rank: 3,
        year: startYear + 3,
        additionalCosts: [
          { type: 'others', amount: 0 },
          { type: 'workExpenditures', amount: 0 }
        ],
        annualAllowance: 6000,
        annualBudget: 6000,
        categoryId: 'completing'
      },
      {
        rank: 4,
        year: startYear + 4,
        additionalCosts: [
          { type: 'others', amount: 0 },
          { type: 'workExpenditures', amount: 0 }
        ],
        annualAllowance: 6000,
        annualBudget: 6000,
        categoryId: 'completing'
      }
    ]
  };
}

export function getInitialPlainProject(): IPlainProject {
  const startYear = appUtils.getCurrentYear();
  const endYear = startYear + 4;
  return {
    geometry: getGeometry(),
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    importFlag: 'import-internal',
    projectName: 'project',
    projectTypeId: ProjectType.integrated,
    startYear,
    status: ProjectStatus.planned,
    boroughId: 'VM',
    endYear,
    executorId: EXECUTOR_DI,
    interventionIds: []
  } as IPlainProject;
}

export function getPlainProject(partial?: Partial<IPlainProject>): IPlainProject {
  const plainProject = getInitialPlainProject();
  Object.assign(plainProject, partial);
  return plainProject;
}

/**
 * Initial project without geometry.
 * @param projectTypeIdOther 'other'
 */
export function getInitialProjectTypeOther(projectTypeIdOther: string): IEnrichedProject {
  const mockEnrichedProjectTypeOther: IEnrichedProject = getInitialProject();
  Object.assign(mockEnrichedProjectTypeOther, {
    status: ProjectStatus.planned,
    projectTypeId: projectTypeIdOther
  });
  delete mockEnrichedProjectTypeOther.interventionIds;
  delete mockEnrichedProjectTypeOther.geometry;
  delete mockEnrichedProjectTypeOther.annualDistribution;

  if (projectService.isProjectNonGeolocated(mockEnrichedProjectTypeOther)) {
    mockEnrichedProjectTypeOther.annualDistribution = nonGeolocatedAnnualDistributionService.createAnnualDistribution(
      mockEnrichedProjectTypeOther as IPlainProject
    );
  } else {
    mockEnrichedProjectTypeOther.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(
      mockEnrichedProjectTypeOther
    );
  }

  return mockEnrichedProjectTypeOther;
}

export function getEnrichedCompleteProject(interventionIds: string[] = []): IEnrichedProject {
  const startYear = appUtils.getCurrentYear();
  const endYear = startYear;
  const project: IEnrichedProject = {
    interventionIds: interventionIds.length ? interventionIds : ['I00001'],
    projectTypeId: 'integrated',
    projectName: 'Intégré / boulevard Marcel-Laurin ',
    boroughId: BoroughCode.SLR,
    status: 'planned',
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    executorId: EXECUTOR_DI,
    startYear,
    endYear,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.6820906386724, 45.5063110670485],
          [-73.6821092549026, 45.5063824930091],
          [-73.6818821300822, 45.5064774275837],
          [-73.6810676552534, 45.5059145042329],
          [-73.6801596668569, 45.5054841526394],
          [-73.6801317346152, 45.5054242702547],
          [-73.6802721550864, 45.5053135635919],
          [-73.6803700977604, 45.5053172933241],
          [-73.6811110248501, 45.5056933182836],
          [-73.6820906386724, 45.5063110670485]
        ]
      ]
    },
    subCategoryIds: ['urgent'],
    comments: [
      {
        id: mongoose.Types.ObjectId().toHexString(),
        categoryId: CommentCategory.information,
        text: 'public comment',
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: createAuthorMock()
        }
      },
      {
        id: mongoose.Types.ObjectId().toHexString(),
        categoryId: CommentCategory.information,
        text: 'private comment',
        isPublic: false,
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: createAuthorMock()
        }
      }
    ],
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: createAuthorMock()
    }
  };
  project.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(project);
  return project;
}

export function getEnrichedNonGeolocatedProject(): IEnrichedProject {
  const startYear = appUtils.getCurrentYear();
  const endYear = startYear;
  const project: IEnrichedProject = {
    interventionIds: ['I00001'],
    projectTypeId: 'integrated',
    projectName: 'Intégré / boulevard Marcel-Laurin ',
    boroughId: BoroughCode.SLR,
    status: 'planned',
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    executorId: EXECUTOR_DI,
    startYear,
    endYear,
    geometry: null,
    subCategoryIds: ['urgent'],
    comments: [
      {
        id: mongoose.Types.ObjectId().toHexString(),
        categoryId: CommentCategory.information,
        text: 'public comment',
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: createAuthorMock()
        }
      },
      {
        id: mongoose.Types.ObjectId().toHexString(),
        categoryId: CommentCategory.information,
        text: 'private comment',
        isPublic: false,
        audit: {
          createdAt: new Date().toISOString(),
          createdBy: createAuthorMock()
        }
      }
    ],
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: createAuthorMock()
    }
  };
  project.annualDistribution = nonGeolocatedAnnualDistributionService.createAnnualDistribution(project);
  return project;
}

export function getSmallGeometriesProject(): IPlainProject {
  return {
    projectName: 'project',
    projectTypeId: ProjectType.integrated,
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: EXECUTOR_DI,
    startYear: 2002,
    endYear: 2050,
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.5627794265747, 45.4954431606125],
          [-73.56192111968994, 45.4954431606125],
          [-73.56192111968994, 45.495683817671726],
          [-73.5627794265747, 45.495683817671726],
          [-73.5627794265747, 45.4954431606125]
        ]
      ]
    },
    interventionIds: []
  };
}

export function getBadGeometriesProject(): IPlainProject {
  return {
    projectName: 'project',
    projectTypeId: ProjectType.integrated,
    boroughId: 'VM',
    status: 'integrated',
    executorId: EXECUTOR_DI,
    startYear: 2002,
    endYear: 2050,
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [-73.553554, 45.49549],
        [-73.554326, 45.495778]
      ]
    },
    interventionIds: []
  };
}

export function getProjectOutsideViewport(): IEnrichedProject {
  return {
    projectName: 'project',
    projectTypeId: ProjectType.integrated,
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: EXECUTOR_DI,
    startYear: 2002,
    endYear: 2050,
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.65796566009521, 45.52102225691326],
          [-73.65275144577026, 45.52102225691326],
          [-73.65275144577026, 45.52455519820205],
          [-73.65796566009521, 45.52455519820205],
          [-73.65796566009521, 45.52102225691326]
        ]
      ]
    },
    interventionIds: [],
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: createAuthorMock()
    }
  };
}

export function getProjectInsideViewport(): IEnrichedProject {
  return {
    projectName: 'project',
    projectTypeId: ProjectType.integrated,
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: EXECUTOR_DI,
    startYear: 2002,
    endYear: 2050,
    globalBudget: {
      allowance: 20,
      burnedDown: 25,
      balance: 30
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.672062, 45.523886],
          [-73.671977, 45.524017],
          [-73.67191, 45.524111],
          [-73.671862, 45.524169],
          [-73.671838, 45.524202],
          [-73.671637, 45.524517],
          [-73.671636, 45.524519],
          [-73.671688, 45.524534],
          [-73.671817, 45.524322],
          [-73.671884, 45.524217],
          [-73.67191, 45.524185],
          [-73.671966, 45.524129],
          [-73.672006, 45.524082],
          [-73.672039, 45.524037],
          [-73.672093, 45.523954],
          [-73.672148, 45.523868],
          [-73.67216, 45.523861],
          [-73.672175, 45.523857],
          [-73.672093, 45.523839],
          [-73.672062, 45.523886]
        ]
      ]
    },
    interventionIds: [],
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: createAuthorMock()
    }
  };
}

export async function getEnrichedProjectAndIntervention(
  intervention?: IEnrichedIntervention
): Promise<IEnrichedProject> {
  const year = appUtils.getCurrentYear();
  const interventionModel = db().models.Intervention;
  const mockIntervention = intervention || getMinimalInitialIntervention();
  const interventionResult = await interventionModel.create(mockIntervention);
  const project: IEnrichedProject = {
    interventionIds: [interventionResult.id],
    projectTypeId: 'integrated',
    projectName: 'Intégré / boulevard Marcel-Laurin ',
    boroughId: 'SLR',
    status: 'planned',
    executorId: EXECUTOR_DI,
    startYear: year,
    endYear: 2050,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.6820906386724, 45.5063110670485],
          [-73.6821092549026, 45.5063824930091],
          [-73.6818821300822, 45.5064774275837],
          [-73.6810676552534, 45.5059145042329],
          [-73.6801596668569, 45.5054841526394],
          [-73.6801317346152, 45.5054242702547],
          [-73.6802721550864, 45.5053135635919],
          [-73.6803700977604, 45.5053172933241],
          [-73.6811110248501, 45.5056933182836],
          [-73.6820906386724, 45.5063110670485]
        ]
      ]
    },
    subCategoryIds: ['urgent'],
    comments: [
      getIComment({
        text: 'test 1',
        categoryId: CommentCategory.information,
        isPublic: true
      })
    ],
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: createAuthorMock()
    }
  };
  project.annualDistribution = nonGeolocatedAnnualDistributionService.createAnnualDistribution(project);
  return project;
}

/**
 * Creates an EnrichedProject with specified attribute to add variation
 * between created PlainProject
 * @param attributes attributes that exists in a PlainProject
 */
export function createEnrichedProject(partial?: Partial<IEnrichedProject>): IEnrichedProject {
  const projectModel: IEnrichedProject = getInitialProject();
  if (partial) {
    Object.assign(projectModel, partial);
  }

  if (partial?.startYear) {
    projectModel.startYear = partial.startYear;
  }

  if (partial?.endYear) {
    projectModel.endYear = partial.endYear;
  }

  if (!partial?.annualDistribution) {
    geolocatedAnnualDistributionService.updateAnnualDistribution(projectModel);
  }

  if (partial?.annualDistribution) {
    projectModel.annualDistribution = partial.annualDistribution;
  }

  return projectModel;
}

export function createNonGeolocatedProject(attributes?: IEnrichedProject): IEnrichedProject {
  const projectModel: IEnrichedProject = getEnrichedNonGeolocatedProject();
  Object.assign(projectModel, attributes);
  if (!attributes?.annualDistribution) {
    nonGeolocatedAnnualDistributionService.updateAnnualDistribution(projectModel);
  }
  return projectModel;
}

/**
 * Creates a list of PlainProject to insert for testing
 */
export function createProjectList(): IEnrichedProject[] {
  const list: IEnrichedProject[] = [];
  list.push(
    createEnrichedProject({
      boroughId: 'SAME',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 },
      comments: [
        {
          id: mongoose.Types.ObjectId().toHexString(),
          categoryId: CommentCategory.information,
          text: 'public comment',
          audit: {
            createdAt: new Date().toISOString(),
            createdBy: createAuthorMock()
          }
        },
        {
          id: mongoose.Types.ObjectId().toHexString(),
          categoryId: CommentCategory.information,
          text: 'private comment',
          isPublic: false,
          audit: {
            createdAt: new Date().toISOString(),
            createdBy: createAuthorMock()
          }
        }
      ]
    })
  );
  list.push(
    createEnrichedProject({
      boroughId: 'SAME',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 },
      drmNumber: '5000',
      submissionNumber: '123456'
    })
  );
  list.push(
    createEnrichedProject({
      boroughId: 'SAME',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 }
    })
  );
  list.push(
    createEnrichedProject({
      boroughId: 'SAME',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 }
    })
  );
  list.push(
    createEnrichedProject({
      boroughId: 'SAME',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 }
    })
  );
  list.push(
    createEnrichedProject({
      projectTypeId: '2999',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 }
    })
  );
  list.push(
    createEnrichedProject({
      projectTypeId: '5757',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 }
    })
  );
  list.push(
    createEnrichedProject({
      projectTypeId: '1234',
      status: ProjectStatus.planned,
      globalBudget: { allowance: 10 }
    })
  );
  list.push(createEnrichedProject({ status: ProjectStatus.planned, globalBudget: { allowance: 10 } }));
  list.push(createEnrichedProject({ projectName: 'test libellé', globalBudget: { allowance: 10 } }));
  list.push(createEnrichedProject({ projectName: 'P00002', globalBudget: { allowance: 10 } }));
  list.push(createNonGeolocatedProject());
  return list;
}

export function projectListOrderdByProjectTypeAndStatus() {
  const list: IEnrichedProject[] = [];
  list.push(createEnrichedProject({ boroughId: 'SAME', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ boroughId: 'SAME', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ boroughId: 'SAME', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ projectTypeId: '2999', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ projectTypeId: '5757', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ projectTypeId: '1234', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ boroughId: 'SAME', status: ProjectStatus.planned }));
  list.push(createEnrichedProject({ boroughId: 'SAME', status: ProjectStatus.planned }));
  return list;
}

export function getMockProjectHistory(
  id: string,
  actionId: 'create' | 'update' | 'delete',
  comments: string
): IHistory {
  return {
    objectTypeId: 'intervention',
    referenceId: id,
    actionId,
    summary: {
      statusFrom: '',
      statusTo: 'planned',
      comments
    }
  };
}

export function getProjectDecisionMock(projectDecision: Partial<IProjectDecision>): IProjectDecision {
  const decision = {
    typeId: ProjectDecisionType.replanned,
    startYear: 2024,
    endYear: 2025,
    text: 'project text'
  };
  Object.assign(decision, projectDecision);
  return decision;
}

export function getProjectDecision(typeId: string, startYear?: number, endYear?: number): IProjectDecision {
  const isDateRequired = typeId === ProjectDecisionType.postponed || typeId === ProjectDecisionType.replanned;
  const dt = new Date();
  const defaultStartYear = isDateRequired ? dt.getFullYear() : null;
  const defaultEndYear = isDateRequired ? startYear + 2 : null;
  return {
    typeId,
    startYear: startYear || defaultStartYear,
    endYear: endYear || defaultEndYear,
    text: 'project text'
  };
}

export async function createMockProject(
  partial: Partial<IEnrichedProject>,
  annualDistributionOpts?: IEnrichedProjectAnnualDistributionOptions
): Promise<IEnrichedProject> {
  const mockResult = createEnrichedProject(partial);
  addCustomAnnualDistribution(mockResult, annualDistributionOpts);
  const docs = await db().models.Project.create([mockResult]);
  const doc = normalizeDataTest.normalizeData(docs[0].toObject());
  return doc;
}

export function addCustomAnnualDistribution(
  mockProject: IEnrichedProject,
  annualDistributionOpts: IEnrichedProjectAnnualDistributionOptions
) {
  if (!annualDistributionOpts) {
    return;
  }

  const projectAnnualDistribution = mockProject.annualDistribution;
  let annualDistribution: Partial<IEnrichedProjectAnnualDistribution | IEnrichedProjectAnnualDistribution>;
  if (projectService.isProjectNonGeolocated(mockProject)) {
    annualDistribution = annualDistributionOpts.projectNonGeoAnnualDistribution;
  } else {
    annualDistribution = annualDistributionOpts.projectGeoAnnualDistribution;
  }
  mergeAnnualDistribution(projectAnnualDistribution, annualDistribution);
}

function mergeAnnualDistribution(
  projectAnnualDistribution: IEnrichedProjectAnnualDistribution | IEnrichedProjectAnnualDistribution,
  partialProjectAnnualDistribution: Partial<IEnrichedProjectAnnualDistribution | IEnrichedProjectAnnualDistribution>
) {
  const objAnnualDistributionAnnualPeriods: IEnrichedProjectAnnualPeriod[] = projectAnnualDistribution.annualPeriods;
  if (partialProjectAnnualDistribution.annualPeriods) {
    const valueAnnualPeriods: IEnrichedProjectAnnualPeriod[] = partialProjectAnnualDistribution.annualPeriods;

    if (valueAnnualPeriods.every(valueAp => valueAp.hasOwnProperty('year'))) {
      projectAnnualDistribution.annualPeriods = objAnnualDistributionAnnualPeriods.map(ap => {
        const valueAnnualPeriod = valueAnnualPeriods.find(vap => vap.year === ap.year);
        return valueAnnualPeriod || ap;
      });
    } else {
      valueAnnualPeriods.forEach((vap, index) => {
        projectAnnualDistribution.annualPeriods[index] = Object.assign(
          {},
          objAnnualDistributionAnnualPeriods[index],
          vap
        );
      });
    }
  }
}

export async function updateMockProject(project: IEnrichedProject): Promise<IEnrichedProject> {
  await db()
    .models.Project.updateOne({ _id: project.id }, project)
    .exec();
  return project;
}

export function enrichedToPlain(input: IEnrichedProject): IPlainProject {
  const project: IPlainProject = {
    geometry: input.geometry,
    globalBudget: input.globalBudget,
    importFlag: input.importFlag,
    projectName: input.projectName,
    projectTypeId: input.projectTypeId,
    subCategoryIds: input.subCategoryIds || undefined,
    startYear: input.startYear,
    status: input.status,
    boroughId: input.boroughId,
    endYear: input.endYear,
    executorId: input.executorId
  };
  if (input.id) {
    project.id = input.id;
  }
  if (input.interventionIds) {
    project.interventionIds = input.interventionIds;
  }
  if (input.inChargeId) {
    project.inChargeId = input.inChargeId;
  }
  if (input.subCategoryIds) {
    project.subCategoryIds = input.subCategoryIds;
  }
  if (input.externalReferenceIds) {
    project.externalReferenceIds = input.externalReferenceIds;
  }
  if (input.riskId) {
    project.riskId = input.riskId;
  }
  return project;
}

export async function createMockProjectList(appends?: IProjectListAppends) {
  const projectList: IEnrichedProject[] = createProjectList();
  if (appends.categories) {
    createProjectsCategories(projectList);
  }
  if (appends.subCategories) {
    createProjectsSubCategories(projectList);
  }
  if (appends.status) {
    createProjectsStatus(projectList);
  }
  const docs = await db().models.Project.create(projectList);
  const list: any[] = [];
  for (const doc of docs) {
    list.push(normalizeDataTest.normalizeData(doc.toObject()));
  }
  return list;
}

export function createProjectsCategories(projectList: IEnrichedProject[]): IEnrichedProject[] {
  const categories: string[] = [ProjectCategory.new, ProjectCategory.completing, ProjectCategory.postponed];
  let i = 0;
  return projectList.map(project => {
    createProjectCategories(project, categories[i]);
    i++;
    if (i >= categories.length) i = 0;
    return project;
  });
}

export function createProjectsSubCategories(projectList: IEnrichedProject[]): void {
  const subCategories: string[] = [
    ProjectSubCategory.priority,
    ProjectSubCategory.recurrent,
    ProjectSubCategory.successive,
    ProjectSubCategory.urgent
  ];
  let idx = 0;
  const length = subCategories.length;
  projectList.forEach(project => {
    if (idx >= length) {
      idx = 0;
    }
    const subCategory = subCategories[idx];
    project.subCategoryIds = [subCategory];
    idx++;
  });
}

export function createProjectsStatus(projectList: IEnrichedProject[]): void {
  const statuses: string[] = [
    ProjectStatus.planned,
    ProjectStatus.planned,
    ProjectStatus.programmed,
    ProjectStatus.finalOrdered,
    ProjectStatus.postponed,
    ProjectStatus.replanned,
    ProjectStatus.canceled
  ];
  let idx = 0;
  projectList.forEach(project => {
    if (idx >= statuses.length) {
      idx = 0;
    }
    project.subCategoryIds = [statuses[idx]];
    idx++;
  });
}

export function createProjectCategories(project: IEnrichedProject, category: string): void {
  (project.annualDistribution.annualPeriods as IEnrichedProjectAnnualPeriod[]).map(annualPeriod => {
    if (category === ProjectCategory.postponed) {
      annualPeriod.categoryId = ProjectCategory.postponed;
    } else if (project.startYear <= annualPeriod.year && project.endYear >= annualPeriod.year) {
      annualPeriod.categoryId = category;
    } else {
      annualPeriod.categoryId = ProjectCategory.new;
    }
    return annualPeriod;
  });
}

export function getProjectsSearch(apiUrl: string, projectSearchRequest: {} | string): Promise<request.Response> {
  return requestService.get(`${apiUrl}`, undefined, projectSearchRequest);
}

export async function createMockProjectHistory(data: IHistory) {
  return (await historyRepository.save(data)).getValue();
}

export function getMoreInformationProject(partial?: Partial<IEnrichedProject>): IEnrichedProject {
  const project: IEnrichedProject = getInitialProject();
  Object.assign(
    project,
    {
      status: ProjectStatus.planned,
      projectTypeId: ProjectType.other
    },
    _.omit(partial, ['projectTypeId'])
  );
  return project;
}

export function getBadCommentProject(partial?: Partial<IEnrichedProject>): IEnrichedProject {
  const project = getMoreInformationProject();
  Object.assign(project, partial, {
    comments: [
      {
        id: mongoose.Types.ObjectId().toHexString(),
        text: 'test 1',
        categoryId: 'wrong taxo',
        isPublic: true
      }
    ]
  });
  return project;
}

export function getBadExternalReferenceTaxoProject(partial?: Partial<IEnrichedProject>): IEnrichedProject {
  const project = getMoreInformationProject();
  Object.assign(project, partial, {
    externalReferenceIds: [
      {
        type: 'wrong taxonomy',
        value: '1'
      }
    ] as IExternalReferenceId[]
  });
  return project;
}

export function getBadExternalReferenceCountProject(
  type: string,
  partial?: Partial<IEnrichedProject>
): IEnrichedProject {
  const project = getMoreInformationProject();
  Object.assign(project, partial, {
    externalReferenceIds: [
      {
        type,
        value: '1'
      },
      {
        type,
        value: '2e de trop'
      }
    ] as IExternalReferenceId[]
  });
  return project;
}

export function appendProjectGeometryFromInterventions(
  project: IPlainProject | IEnrichedProject,
  interventions: IEnrichedIntervention[]
) {
  if (!interventions.length) {
    return;
  }
  const interventionGeometries = interventions.map(i => {
    if (i.interventionArea?.geometry) {
      return { type: 'Feature', geometry: i.interventionArea.geometry } as IFeature;
    }
    return null;
  });
  const workArea = interventionWorkAreaService.generateImportWorkArea(interventionGeometries.filter(x => x));
  project.geometry = workArea.geometry as turf.Polygon;
}
