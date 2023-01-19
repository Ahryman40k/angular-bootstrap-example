import {
  BoroughCode,
  ExternalReferenceType,
  IEnrichedProject,
  MedalType,
  ProjectCategory,
  ProjectDecisionType,
  ProjectStatus,
  ProjectSubCategory,
  RoadNetworkType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import {
  EXECUTOR_DI,
  REQUESTOR_BELL,
  RISK_AGREEMENT,
  SERVICE_SE,
  SERVICE_SUM
} from '../../../../../shared/taxonomies/constants';

export const partiallyEnrichedProjects: Partial<IEnrichedProject>[] = [
  {
    boroughId: BoroughCode.VM,
    status: ProjectStatus.programmed,
    projectName: 'project1',
    contact: 'Contact1',
    startYear: 2022,
    endYear: 2023,
    interventionIds: ['intervention1', 'intervention2'],
    globalBudget: { allowance: 100 },
    annualDistribution: {
      annualPeriods: [
        { year: 2022, programBookId: 'programBook1' },
        { year: 2023, programBookId: 'programBook2' }
      ]
    }
  },
  {
    boroughId: BoroughCode.VM,
    status: ProjectStatus.replanned,
    projectName: 'project2',
    contact: 'Contact2',
    startYear: 2021,
    endYear: 2023,
    interventionIds: ['intervention3'],
    globalBudget: { allowance: 22.2 }
  },
  {
    boroughId: BoroughCode.ANJ,
    status: ProjectStatus.programmed,
    projectName: 'project3',
    contact: 'Contact3',
    startYear: 2022,
    endYear: 2022,
    interventionIds: ['intervention4', 'intervention5', 'intervention6'],
    globalBudget: { allowance: 33.33 },
    annualDistribution: {
      annualPeriods: [{ year: 2022, programBookId: 'programBook1' }]
    }
  },
  {
    boroughId: BoroughCode.PFDROX,
    status: ProjectStatus.replanned,
    projectName: 'project0',
    contact: 'Contact0',
    startYear: 2018,
    endYear: 2018
  },
  {
    boroughId: BoroughCode.VM,
    status: ProjectStatus.replanned,
    projectName: 'project4',
    contact: 'Contact4',
    startYear: 2010,
    endYear: 2010
  },
  {
    boroughId: BoroughCode.ANJ,
    status: ProjectStatus.replanned,
    projectName: 'project5',
    contact: 'Contact5',
    startYear: 2010,
    endYear: 2010,
    decisions: [{ typeId: ProjectDecisionType.postponed, text: 'decision text' }]
  },
  {
    boroughId: BoroughCode.AC,
    status: ProjectStatus.replanned,
    projectName: 'project6',
    contact: 'Contact6',
    startYear: 2010,
    endYear: 2010,
    decisions: [
      { typeId: ProjectDecisionType.replanned, text: 'decision text' },
      { typeId: ProjectDecisionType.postponed, text: 'decision text' }
    ]
  },
  {
    boroughId: BoroughCode.SO,
    status: ProjectStatus.postponed,
    projectName: 'project7',
    contact: 'Contact7',
    startYear: 2000,
    endYear: 2002,
    decisions: [
      { typeId: ProjectDecisionType.replanned, text: 'decision text' },
      { typeId: ProjectDecisionType.postponed, text: 'decision text', audit: { createdAt: '2022-12-12T12:12:12.000Z' } }
    ],
    projectTypeId: 'integrated',
    annualDistribution: {
      annualPeriods: [
        { year: 2000, programBookId: 'programBook3', categoryId: ProjectCategory.new },
        { year: 2001, programBookId: 'programBook4', categoryId: ProjectCategory.postponed },
        { year: 2002, categoryId: ProjectCategory.completing }
      ]
    },
    subCategoryIds: [ProjectSubCategory.priority, ProjectSubCategory.urgent, ProjectSubCategory.successive],
    globalBudget: { allowance: 2 },
    length: { value: 4, unit: 'ft' },
    inChargeId: REQUESTOR_BELL,
    executorId: EXECUTOR_DI,
    medalId: MedalType.platinum,
    streetName: 'Nom de la rue',
    streetFrom: 'Nom amont',
    streetTo: 'Nom aval',
    interventionIds: ['intervention1', 'intervention2', 'intervention3'],
    drmNumber: '12',
    submissionNumber: undefined,
    riskId: RISK_AGREEMENT,
    roadNetworkTypeId: RoadNetworkType.local,
    servicePriorities: [
      { service: SERVICE_SE, priorityId: '2' },
      { service: SERVICE_SUM, priorityId: '3' },
      { service: SERVICE_SE, priorityId: '4' }
    ],
    externalReferenceIds: [
      {
        type: ExternalReferenceType.infoRtuId,
        value: 'infoRtuId'
      },
      {
        type: ExternalReferenceType.nexoReferenceNumber,
        value: 'nexoReferenceNumber'
      }
    ]
  }
];
