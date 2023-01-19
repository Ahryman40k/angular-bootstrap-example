import { destroyDBTests } from '../../../../tests/utils/testHelper';
import { IByIdCommandProps } from '../../../shared/domain/useCases/byIdCommand';
import { assertUseCaseRestrictions } from '../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { deleteAnnualProgramUseCase } from '../useCases/deleteAnnualProgram/deleteAnnualProgramUseCase';
import { annualProgramRestrictionsTestData, createAndSaveAnnualProgram } from './annualProgramTestHelper';

describe(`DeleteAnnualProgramUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  annualProgramRestrictionsTestData.forEach(test => {
    it(test.scenario, async () => {
      const annualProgram = await createAndSaveAnnualProgram(test.props);
      const props: IByIdCommandProps = { id: annualProgram.id };
      await assertUseCaseRestrictions<IByIdCommandProps, void>(test, deleteAnnualProgramUseCase, props);
    });
  });
});
