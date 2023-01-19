import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { deleteProgramBookUseCase } from '../../useCases/deleteProgramBook/deleteProgramBookUseCase';
import { createAndSaveDefaultProgramBook, programbookRestrictionsTestData } from '../programBookTestHelper';

// tslint:disable:max-func-body-length
describe(`deleteProgramBookUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });
  describe(`UserRestrictions`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const pb = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId },
          { boroughIds: test.props.boroughIds }
        );
        const props: IByIdCommandProps = {
          id: pb.id
        };
        await assertUseCaseRestrictions<IByIdCommandProps, void>(test, deleteProgramBookUseCase, props);
      });
    });
  });
});
