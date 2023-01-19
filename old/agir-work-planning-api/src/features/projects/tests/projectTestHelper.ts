import {
  BoroughCode,
  IDrmProject,
  IEnrichedProject,
  IPlainProject,
  ProjectStatus,
  ProjectSubCategory,
  ProjectType
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { geolocatedAnnualDistributionService } from '../../../services/annualDistribution/geolocatedAnnualDistributionService';
import { IRestrictionTestData } from '../../../shared/restrictions/tests/restrictionsValidator.test';
import {
  BASE_USER_RESTRICTIONS,
  DEFAULT_BOROUGH,
  DEFAULT_EXECUTOR,
  OTHER_BOROUGH,
  OTHER_EXECUTOR
} from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { EXECUTOR_DI } from '../../../shared/taxonomies/constants';
import { appUtils } from '../../../utils/utils';
import { getAudit } from '../../audit/test/auditTestHelper';
import { getLength } from '../../length/tests/lengthTestHelper';
import { IPlainProjectProps, PlainProject } from '../models/plainProject';
import { IProjectProps, Project } from '../models/project';
import { projectRepository } from '../mongo/projectRepository';

const CURRENT_YEAR = appUtils.getCurrentYear();

// ASSERT
// TODO project input should be a class instance
export function assertProjectNotCompleting(project: IEnrichedProject): void {
  assert.isTrue(CURRENT_YEAR <= project.startYear);
}

export function assertProjectOtherTypeThanIntegrated(project: IEnrichedProject): void {
  assert.isTrue(project.projectTypeId !== ProjectType.integrated);
}

export function assertProjectCompleting(project: IEnrichedProject): void {
  assert.isTrue(CURRENT_YEAR > project.startYear);
}

export function assertProjectIntegratedType(project: IEnrichedProject): void {
  assert.strictEqual(project.projectTypeId, ProjectType.integrated);
}

export function assertProjectNotToItsFirstPlanificationYear(project: IEnrichedProject): void {
  assert.isTrue(project.startYear !== CURRENT_YEAR);
}

// project functions to set and save a project.

const plainProject: IPlainProject = {
  projectTypeId: ProjectType.nonIntegrated,
  projectName: 'plain project name',
  boroughId: BoroughCode.VM,
  status: ProjectStatus.planned,
  executorId: EXECUTOR_DI,
  startYear: appUtils.getCurrentYear(),
  endYear: appUtils.getCurrentYear() + 5,
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
  subCategoryIds: [ProjectSubCategory.urgent]
};

const projectProps: IProjectProps = {
  ...getPlainProjectsProps(),
  length: getLength(),
  interventions: [],
  moreInformationAudit: getAudit(),
  audit: getAudit()
};

export function getPlainProjectsProps(plain?: Partial<IPlainProjectProps>): IPlainProjectProps {
  return mergeProperties(plainProject, plain);
}

export function getPlainProject(props?: Partial<IPlainProjectProps>): PlainProject<IPlainProjectProps> {
  return PlainProject.create(getPlainProjectsProps(props)).getValue();
}

export function getProjectProps(props?: Partial<IProjectProps>): IProjectProps {
  return mergeProperties(projectProps, props);
}

export function getProject(props?: Partial<IProjectProps>, id?: string): Project<IProjectProps> {
  const result = Project.create(getProjectProps(props), id ? id : props.id);
  return result.getValue();
}

// TODO: to return a Result<Project> we must update projectRepository.
export async function createAndSaveProject(
  props?: Partial<IProjectProps>,
  programBookId?: string
): Promise<IEnrichedProject> {
  const projectProperties = getProjectProps(props);
  if (!props?.annualDistribution) {
    projectProperties.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(
      projectProperties
    );
  }
  if (programBookId) {
    projectProperties.annualDistribution.annualPeriods.find(ap => ap).programBookId = programBookId;
  }
  return (await projectRepository.save(getProject(projectProperties))).getValue() as Project<IProjectProps>;
}

export function assertDrmNumbers(actualDrmProjects: IDrmProject[], expectedDrmProjects: IDrmProject[]) {
  actualDrmProjects.forEach(actualProject => {
    const expectedProject = expectedDrmProjects.find(project => project.projectId === actualProject.projectId);
    assert.strictEqual(actualProject.projectId, expectedProject.projectId);
    assert.strictEqual(actualProject.drmNumber, expectedProject.drmNumber);
  });
}

// scenarios to test userRestrictions
export const projectRestrictionsTestData: IRestrictionTestData<IPlainProject>[] = [
  {
    scenario: 'Positive should not return Forbidden when all restrictions are correct',
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR },
    // used to test validation for many projects
    multipleProps: [
      { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR },
      { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR }
    ],
    useRestrictions: BASE_USER_RESTRICTIONS
  },
  {
    // user have no restrictions
    scenario: 'Positive should not return Forbidden when user have no restrictions',
    props: { boroughId: OTHER_BOROUGH, executorId: OTHER_EXECUTOR },
    multipleProps: [
      { boroughId: OTHER_BOROUGH, executorId: DEFAULT_EXECUTOR },
      { boroughId: DEFAULT_BOROUGH, executorId: OTHER_EXECUTOR }
    ],
    useRestrictions: {}
  },
  {
    // BOROUGH is different
    scenario: "Negative- should return Forbidden when BOROUGH restriction doesn't include project boroughId",
    props: { boroughId: OTHER_BOROUGH, executorId: DEFAULT_EXECUTOR },
    multipleProps: [
      { boroughId: OTHER_BOROUGH, executorId: DEFAULT_EXECUTOR },
      { boroughId: OTHER_BOROUGH, executorId: DEFAULT_EXECUTOR }
    ],
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // EXECUTOR is different
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include project executorId",
    props: { boroughId: DEFAULT_BOROUGH, executorId: OTHER_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    multipleProps: [
      { boroughId: DEFAULT_BOROUGH, executorId: OTHER_EXECUTOR },
      { boroughId: DEFAULT_BOROUGH, executorId: OTHER_EXECUTOR }
    ],
    expectForbidden: true
  }
];
export const updateProjectRestrictionsTestData: IRestrictionTestData<IPlainProject>[] = [
  {
    scenario: 'Negative- should return Forbidden when all restrictions are correct but update props are not',
    updateProps: { boroughId: OTHER_BOROUGH, executorId: OTHER_EXECUTOR },
    props: { boroughId: DEFAULT_BOROUGH, executorId: DEFAULT_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  ...projectRestrictionsTestData
];
