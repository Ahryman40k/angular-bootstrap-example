import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { rtuExportLogMapperDTO } from '../../../mappers/rtuExportLogMapperDTO';
import { rtuExportLogRepository } from '../../../mongo/rtuExportLogRepository';
import { getRtuExportLogUseCase } from '../../../useCases/getRtuExportLog/getRtuExportLogUseCase';
import { getRtuExportLog } from '../../rtuExportTestHelper';
import { assertDtoRtuExportLog } from '../../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`GetRtuExportLogUseCase`, () => {
  describe(`Positive`, () => {
    const rtuExportLog = getRtuExportLog();
    before(async () => {
      await rtuExportLogRepository.save(rtuExportLog);
    });
    after(async () => {
      await destroyDBTests();
    });

    it(`should retrieve rtu export log by id`, async () => {
      const existingRtuExportLog = await rtuExportLogRepository.findById(rtuExportLog.id);
      assert.isDefined(existingRtuExportLog);

      const getRtuExportLogCommand: IByIdCommandProps = {
        id: rtuExportLog.id
      };
      const result = await getRtuExportLogUseCase.execute(getRtuExportLogCommand);
      assert.isTrue(result.isRight());
      const rtuExportLogFound = result.value.getValue() as IRtuExportLog;
      const existingRtuExportLogDto = await rtuExportLogMapperDTO.getFromModel(existingRtuExportLog);
      assertDtoRtuExportLog(rtuExportLogFound, existingRtuExportLogDto);
    });
  });

  describe(`Negative`, () => {
    it(`should return InvalidParameterError when given rtu export log is not valid uuid`, async () => {
      const getRtuProjectCommand: IByIdCommandProps = {
        id: 'doesNotExist'
      };
      const result = await getRtuExportLogUseCase.execute(getRtuProjectCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
    });

    it(`should return notFoundError when given rtu export log do not exists`, async () => {
      const getRtuProjectCommand: IByIdCommandProps = {
        id: '0a0a0a0a0a0a0a0a0a0a0a0a'
      };
      const result = await getRtuExportLogUseCase.execute(getRtuProjectCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });
  });
});
