import {
  IEnrichedProject,
  IPlainPriorityLevel,
  ProgramBookPriorityScenarioStatus,
  ProjectCategory,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { Types } from 'mongoose';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { getAudit } from '../../audit/test/auditTestHelper';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { IPlainPriorityLevelProps } from '../models/plainPriorityLevel';
import { IPriorityLevelProps, PriorityLevel } from '../models/priorityLevel';
import { IPriorityLevelCriteriaProps } from '../models/priorityLevelCriteria';
import { OrderBy } from '../models/priorityLevelSortCriteria';
import { IPriorityScenarioProps, PriorityScenario } from '../models/priorityScenario';
import { IProjectCategoryCriteriaProps } from '../models/projectCategoryCriteria';

const priorityLevelCriteria: IPriorityLevelCriteriaProps = {
  projectCategory: [getProjectCategoryCriteriaProps({ category: ProjectCategory.completing })],
  workTypeId: [],
  requestorId: [],
  assetTypeId: []
};

export function getProjectCategoryCriteriaProps(
  props?: Partial<IProjectCategoryCriteriaProps>
): IProjectCategoryCriteriaProps {
  return mergeProperties(
    {
      category: ProjectCategory.new
    },
    props
  );
}

function getPriorityLevelCriteriaProps(props?: Partial<IPriorityLevelCriteriaProps>): IPriorityLevelCriteriaProps {
  return mergeProperties(priorityLevelCriteria, props);
}

const plainPriorityLevelProps: IPlainPriorityLevelProps = {
  rank: 1,
  criteria: priorityLevelCriteria
};

export function getPlainPriorityLevelProps(props?: Partial<IPlainPriorityLevelProps>): IPlainPriorityLevelProps {
  return mergeProperties(
    {
      ...plainPriorityLevelProps,
      ...getPriorityLevelCriteriaProps(props?.criteria)
    },
    props
  );
}

function getPriorityLevelProps(props?: Partial<IPriorityLevelProps>): IPriorityLevelProps {
  return mergeProperties(
    {
      ...getPlainPriorityLevelProps(props),
      projectCount: 0,
      isSystemDefined: true
    },
    props
  );
}

export function getPriorityLevel(props?: Partial<IPriorityLevelProps>): PriorityLevel {
  return PriorityLevel.create(getPriorityLevelProps(props)).getValue();
}

const priorityScenario: IPriorityScenarioProps = {
  id: Types.ObjectId().toString(),
  name: `Scenario 1`,
  orderedProjects: [],
  status: ProgramBookPriorityScenarioStatus.pending,
  priorityLevels: [getPriorityLevel()],
  isOutdated: false,
  audit: getAudit()
};

export function getPriorityScenarioProps(plain?: Partial<IPriorityScenarioProps>): IPriorityScenarioProps {
  return mergeProperties(priorityScenario, plain);
}

export function getPriorityScenario(props?: Partial<IPriorityScenarioProps>): PriorityScenario {
  const result = PriorityScenario.create(getPriorityScenarioProps(props), props?.id);
  return result.getValue();
}

export function getPlainPriorityLevel(partial?: Partial<IPriorityLevelProps>): IPlainPriorityLevel {
  if (partial.rank !== 1) {
    partial.isSystemDefined = false;
  }
  return getPriorityLevelProps({ ...partial }) as IPlainPriorityLevel;
}

export async function orderByDefaultSortCriterias(projects: IEnrichedProject[]): Promise<IEnrichedProject[]> {
  const roadNetworkTypes = await taxonomyService.getGroup(TaxonomyGroup.roadNetworkType);
  return orderBy(
    projects,
    [
      (project: IEnrichedProject) => project.interventionIds.length,
      (project: IEnrichedProject) => roadNetworkTypes?.find(rn => rn.code === project.roadNetworkTypeId)?.displayOrder,
      'globalBudget.allowance',
      'id'
    ],
    [OrderBy.DESC, OrderBy.ASC, OrderBy.DESC, OrderBy.ASC]
  );
}
