import {
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  IPlainProject,
  ProjectType
} from '../..';
import { ProjectStatus } from '../../projects/project-status';
import { getInterventionAnnualDistribution, getInterventionAsset, getInterventionEstimate } from './interventionData';

// tslint:disable-next-line: max-func-body-length
export function getEnrichedProject(options: { projectType: ProjectType }): IEnrichedProject {
  const project = getInitialProject() as IEnrichedProject;
  project.startYear = 2021;
  project.endYear = 2022;

  project.annualDistribution = getProjectAnnualDistribution();

  if (options.projectType === ProjectType.integrated) {
    project.interventions = [
      {
        id: 'I00001',
        annualDistribution: getInterventionAnnualDistribution(),
        estimate: getInterventionEstimate(),
        assets: [getInterventionAsset()]
      },
      {
        id: 'I00002',
        annualDistribution: getInterventionAnnualDistribution(),
        estimate: getInterventionEstimate(),
        assets: [getInterventionAsset()]
      }
    ] as IEnrichedIntervention[];
  }

  return project;
}

export function getProjectAnnualDistribution(): IEnrichedProjectAnnualDistribution {
  return {
    distributionSummary: {
      totalAdditionalCosts: 0,
      totalInterventionBudgets: 0,
      totalBudget: 0,
      totalAnnualBudget: { totalAllowance: 0 },
      additionalCostTotals: [
        { type: 'professionalServices', amount: 0 },
        { type: 'contingency', amount: 0 },
        { type: 'others', amount: 0 },
        { type: 'workExpenditures', amount: 0 }
      ]
    },
    annualPeriods: [
      {
        year: 2021,
        additionalCosts: [
          { type: 'professionalServices', amount: 4000 },
          { type: 'contingency', amount: 5000 }
        ],
        annualAllowance: 6000
      },
      {
        year: 2022,
        additionalCosts: [
          { type: 'others', amount: 3000 },
          { type: 'workExpenditures', amount: 6000 }
        ],
        annualAllowance: 6000
      }
    ]
  };
}

export function getInitialProject(): IPlainProject {
  // geometry used contains queen street
  return {
    projectName: 'project',
    projectTypeId: 'nonIntegrated',
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: 'other',
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
          [-73.69285583496094, 45.4577225021236],
          [-73.55552673339842, 45.4577225021236],
          [-73.55552673339842, 45.53376986898192],
          [-73.69285583496094, 45.53376986898192],
          [-73.69285583496094, 45.4577225021236]
        ]
      ]
    },
    interventionIds: []
  };
}

export function getSmallGemetriesProject(): IPlainProject {
  return {
    projectName: 'project',
    projectTypeId: 'nonIntegrated',
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: 'other',
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
    projectTypeId: 'nonIntegrated',
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: 'other',
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

/**
 * Project with a CShaped geometry.
 */
export function getCShapedProject(): IPlainProject {
  return {
    projectName: 'project',
    projectTypeId: 'nonIntegrated',
    boroughId: 'VM',
    status: ProjectStatus.planned,
    executorId: 'other',
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
          [-73.75288367271423, 45.47010073062655],
          [-73.75288367271423, 45.47093588098785],
          [-73.75561952590942, 45.47090578569427],
          [-73.75569462776184, 45.46797141740441],
          [-73.75265836715698, 45.467948844748555],
          [-73.75269055366516, 45.46878402699461],
          [-73.75487923622131, 45.46873135820955],
          [-73.75476121902464, 45.470108254558916],
          [-73.75288367271423, 45.47010073062655]
        ]
      ]
    },
    interventionIds: []
  };
}
