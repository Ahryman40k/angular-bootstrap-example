import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';

import { destroyDBTests } from '../../../../tests/utils/testHelper';
import { assertUseCaseRestrictions } from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { IUpdateAnnualProgramCommandProps } from '../useCases/updateAnnualProgram/updateAnnualProgramCommand';
import { updateAnnualProgramUseCase } from '../useCases/updateAnnualProgram/updateAnnualProgramUseCase';
import {
  createAndSaveAnnualProgram,
  getPlainAnnualProgramProps,
  updateAnnualProgramRestrictionsTestData
} from './annualProgramTestHelper';

describe(`UpdateAnnualProgramUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  updateAnnualProgramRestrictionsTestData.forEach(test => {
    it(test.scenario, async () => {
      // create annual program using test.props
      const annualProgram = await createAndSaveAnnualProgram(test.props);
      // update annual program using test.updateProps
      const props: IUpdateAnnualProgramCommandProps = {
        ...getPlainAnnualProgramProps(test.updateProps || test.props),
        id: annualProgram.id
      };
      await assertUseCaseRestrictions<IUpdateAnnualProgramCommandProps, IEnrichedAnnualProgram>(
        test,
        updateAnnualProgramUseCase,
        props
      );
    });
  });
});
