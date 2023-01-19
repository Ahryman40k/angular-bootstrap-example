import { AnnualProgramStatus, Role } from '@villemontreal/agir-work-planning-lib/dist/src';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { IRestrictionTestData } from '../../../shared/restrictions/tests/restrictionsValidator.test';
import {
  BASE_USER_RESTRICTIONS,
  DEFAULT_EXECUTOR,
  OTHER_EXECUTOR
} from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { appUtils } from '../../../utils/utils';
import { getAudit } from '../../audit/test/auditTestHelper';
import { AnnualProgram, IAnnualProgramProps } from '../models/annualProgram';
import { IPlainAnnualProgramProps, PlainAnnualProgram } from '../models/plainAnnualProgram';
import { annualProgramRepository } from '../mongo/annualProgramRepository';

const plainAnnualProgramProps: IPlainAnnualProgramProps = {
  executorId: 'di',
  year: appUtils.getCurrentYear(),
  budgetCap: 10,
  description: 'test',
  sharedRoles: [],
  status: AnnualProgramStatus.new
};

export function getPlainAnnualProgramProps(props?: Partial<IPlainAnnualProgramProps>): IPlainAnnualProgramProps {
  return mergeProperties(plainAnnualProgramProps, props);
}

const shareableRolesCombinations: Role[][] = [
  null,
  [],
  [Role.EXECUTOR],
  [Role.INTERNAL_GUEST_RESTRICTED],
  [Role.INTERNAL_GUEST_STANDARD],
  [Role.INTERNAL_GUEST_STANDARD, Role.EXECUTOR]
];

const annualProgramProps: IAnnualProgramProps = {
  ...plainAnnualProgramProps,
  budgetCap: 25000,
  status: AnnualProgramStatus.new,
  sharedRoles: [Role.INTERNAL_GUEST_STANDARD, Role.EXECUTOR],
  audit: getAudit()
};

export function getAnnualProgramProps(props?: Partial<IAnnualProgramProps>): IAnnualProgramProps {
  return mergeProperties(
    {
      ...annualProgramProps,
      ...getPlainAnnualProgramProps(props)
    },
    props
  );
}

export function getAnnualProgram(props?: Partial<IAnnualProgramProps>, id?: string): AnnualProgram {
  return AnnualProgram.create(
    {
      ...getAnnualProgramProps(props)
    },
    id
  ).getValue();
}

export function getManyAnnualProgram(count: number): AnnualProgram[] {
  const annualPrograms: AnnualProgram[] = [];
  for (let i = 0; i < count; i++) {
    annualPrograms.push(getAnnualProgram());
  }
  return annualPrograms;
}

export function getAnnualProgramShareableRolesCombinations(): AnnualProgram[] {
  const annualPrograms: AnnualProgram[] = [];
  for (const sharedRoles of shareableRolesCombinations) {
    annualPrograms.push(getAnnualProgram({ sharedRoles }));
  }
  return annualPrograms;
}

export async function createAndSaveAnnualProgram(props?: Partial<IPlainAnnualProgramProps>): Promise<AnnualProgram> {
  const annualProgram = getAnnualProgram(getAnnualProgramProps(props));
  return (await annualProgramRepository.save(annualProgram)).getValue();
}

export const annualProgramRestrictionsTestData: IRestrictionTestData<PlainAnnualProgram<any>>[] = [
  {
    scenario: 'Positive- should not return Forbidden when all restrictions are correct',
    props: { executorId: DEFAULT_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS
  },
  {
    // user have no restrictions
    scenario: 'Positive- should not return Forbidden when user have no restrictions',
    props: { executorId: OTHER_EXECUTOR },
    useRestrictions: {}
  },
  {
    // EXECUTOR is different
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include annualProgram executorId",
    props: { executorId: OTHER_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  }
];
export const updateAnnualProgramRestrictionsTestData: IRestrictionTestData<PlainAnnualProgram<any>>[] = [
  {
    // EXECUTOR is different from request body
    // props are valid but updateProps are not
    // use this to ensure that use case test data coming from request body
    scenario:
      "Negative- should return Forbidden when EXECUTOR restriction doesn't include annualProgram executorId coming from request body",
    props: { executorId: DEFAULT_EXECUTOR },
    updateProps: { executorId: OTHER_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  ...annualProgramRestrictionsTestData
];
