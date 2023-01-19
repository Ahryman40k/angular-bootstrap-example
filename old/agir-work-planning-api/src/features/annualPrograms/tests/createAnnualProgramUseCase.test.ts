import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';

import { destroyDBTests } from '../../../../tests/utils/testHelper';
import { assertUseCaseRestrictions } from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { ICreateAnnualProgramCommandProps } from '../useCases/createAnnualProgram/createAnnualProgramCommand';
import { createAnnualProgramUseCase } from '../useCases/createAnnualProgram/createAnnualProgramUseCase';
import { annualProgramRestrictionsTestData, getPlainAnnualProgramProps } from './annualProgramTestHelper';

describe(`CreateAnnualProgramUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  annualProgramRestrictionsTestData.forEach(test => {
    it(test.scenario, async () => {
      const props: ICreateAnnualProgramCommandProps = getPlainAnnualProgramProps(test.props);
      await assertUseCaseRestrictions<ICreateAnnualProgramCommandProps, IEnrichedAnnualProgram>(
        test,
        createAnnualProgramUseCase,
        props
      );
    });
  });
});
