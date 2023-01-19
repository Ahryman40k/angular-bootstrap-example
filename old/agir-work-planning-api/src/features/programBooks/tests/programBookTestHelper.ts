import {
  AnnualProgramStatus,
  IUuid,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { IRestrictionTestData } from '../../../shared/restrictions/tests/restrictionsValidator.test';
import {
  BASE_USER_RESTRICTIONS,
  DEFAULT_BOROUGH,
  DEFAULT_EXECUTOR,
  OTHER_BOROUGH,
  OTHER_EXECUTOR
} from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { IPlainAnnualProgramProps } from '../../annualPrograms/models/plainAnnualProgram';
import { createAndSaveAnnualProgram } from '../../annualPrograms/tests/annualProgramTestHelper';
import { getAudit } from '../../audit/test/auditTestHelper';
import { getPriorityScenario } from '../../priorityScenarios/tests/priorityScenarioTestHelper';
import { IPlainProgramBookProps, PlainProgramBook } from '../models/plainProgramBook';
import { IProgramBookProps, ProgramBook } from '../models/programBook';
import { programBookRepository } from '../mongo/programBookRepository';
import { IUpdateProgramBookCommandProps } from '../useCases/updateProgramBook/updateProgramBookCommand';

const plainProgramBook: IPlainProgramBookProps = {
  name: 'Carnet PI',
  projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
  boroughIds: ['AC', 'IBZSGV', 'SLR'],
  inCharge: 'Olivier Chevrel',
  status: ProgramBookStatus.new,
  description: '123'
};

export function getPlainProgramBookProps(plain?: Partial<IPlainProgramBookProps>): IPlainProgramBookProps {
  const mergedProperties: IPlainProgramBookProps = mergeProperties(plainProgramBook, plain);
  if (plain?.projectTypes) {
    mergedProperties.projectTypes = plain.projectTypes;
  }
  return mergedProperties;
}

export function getPlainProgramBook(props?: Partial<IPlainProgramBookProps>): PlainProgramBook<IPlainProgramBookProps> {
  return PlainProgramBook.create(getPlainProgramBookProps(props)).getValue();
}

const programBookProps: IProgramBookProps = {
  ...getPlainProgramBookProps(),
  sharedRoles: [],
  priorityScenarios: [getPriorityScenario()],
  isAutomaticLoadingInProgress: false,
  audit: getAudit()
};

export function getProgramBookProps(props?: Partial<IProgramBookProps>): IProgramBookProps {
  const returnedProps: IProgramBookProps = mergeProperties(programBookProps, {
    audit: getAudit(),
    ...props
  });
  if (props?.projectTypes?.length) {
    returnedProps.projectTypes = props.projectTypes;
  }
  return returnedProps;
}

export function getProgramBook(props?: Partial<IProgramBookProps>, id?: string): ProgramBook {
  const result = ProgramBook.create(getProgramBookProps(props), id);
  return result.getValue();
}

export async function createAndSaveProgramBook(props?: Partial<IProgramBookProps>, id?: string): Promise<ProgramBook> {
  const programBook = getProgramBook(getProgramBookProps(props), id);
  const programBookResult = await programBookRepository.save(programBook, {
    expand: [ProgramBookExpand.projectsInterventions]
  });
  return programBookResult.getValue();
}

export async function createAndSaveDefaultProgramBook(
  propsAnnualProgram?: Partial<IPlainAnnualProgramProps>,
  propsProgramBook?: Partial<IProgramBookProps>,
  programBookId?: string
): Promise<ProgramBook> {
  const defaultAnnualProgram = propsAnnualProgram || { status: AnnualProgramStatus.programming };
  const defaultProgramBook = propsProgramBook || { status: ProgramBookStatus.submittedPreliminary };

  const annualProgram = await createAndSaveAnnualProgram(defaultAnnualProgram);
  return createAndSaveProgramBook(
    {
      annualProgram,
      ...defaultProgramBook
    },
    programBookId
  );
}

export function getUpdateProgramBookProps(
  id: IUuid,
  props?: Partial<IProgramBookProps>
): IUpdateProgramBookCommandProps {
  return {
    ...getPlainProgramBookProps(props),
    id
  };
}

export const programbookRestrictionsTestData: IRestrictionTestData<{ executorId: string; boroughIds?: string[] }>[] = [
  {
    scenario: 'Positive- should not return Forbidden when all restrictions are correct',
    props: { boroughIds: [DEFAULT_BOROUGH], executorId: DEFAULT_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS
  },
  {
    // user have no restrictions
    scenario: 'Positive- should not return Forbidden when user have no restrictions',
    props: { boroughIds: [OTHER_BOROUGH], executorId: OTHER_EXECUTOR },
    useRestrictions: {}
  },
  {
    // boroughIds is null or undefined
    scenario: 'Negative- should return Forbidden when boroughIds is null or undefined',
    props: { boroughIds: null, executorId: OTHER_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // boroughIds is different
    scenario: "Negative- should return Forbidden when BOROUGH restriction doesn't include programBook boroughIds",
    props: { boroughIds: [OTHER_BOROUGH], executorId: DEFAULT_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  {
    // executorId is different
    scenario: "Negative- should return Forbidden when EXECUTOR restriction doesn't include annualProgram executorId",
    props: { boroughIds: [DEFAULT_BOROUGH], executorId: OTHER_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  }
];
export const updateProgrambookRestrictionsTestData: IRestrictionTestData<{
  executorId: string;
  boroughIds?: string[];
}>[] = [
  {
    scenario: 'Negative- should return Forbidden when restrictions are correct but update props are not',
    props: { boroughIds: [DEFAULT_BOROUGH], executorId: DEFAULT_EXECUTOR },
    updateProps: { boroughIds: [OTHER_BOROUGH], executorId: OTHER_EXECUTOR },
    useRestrictions: BASE_USER_RESTRICTIONS,
    expectForbidden: true
  },
  ...programbookRestrictionsTestData
];
