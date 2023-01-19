import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { rtuImportLogMapperDTO } from '../../../mappers/rtuImportLogMapperDTO';
import { rtuImportLogRepository } from '../../../mongo/rtuImportLogRepository';
import { getRtuImportLogUseCase } from '../../../useCases/getRtuImportLog/getRtuImportLogUseCase';
import { assertDtoRtuImportLog, getRtuImportLog } from '../../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`GetRtuImportLogUseCase`, () => {
  describe(`Positive`, () => {
    const rtuImportLog = getRtuImportLog();
    before(async () => {
      await rtuImportLogRepository.save(rtuImportLog);
    });
    after(async () => {
      await destroyDBTests();
    });

    it(`should retrieve rtu import log by id`, async () => {
      const existingRtuImportLog = await rtuImportLogRepository.findById(rtuImportLog.id);
      assert.isDefined(existingRtuImportLog);

      const getRtuImportLogCommand: IByIdCommandProps = {
        id: rtuImportLog.id
      };
      const result = await getRtuImportLogUseCase.execute(getRtuImportLogCommand);
      assert.isTrue(result.isRight());
      const rtuImportLogFound = result.value.getValue() as IRtuImportLog;
      const existingRtuImportLogDto = await rtuImportLogMapperDTO.getFromModel(existingRtuImportLog);
      assertDtoRtuImportLog(rtuImportLogFound, existingRtuImportLogDto);
    });
  });

  describe(`Negative`, () => {
    it(`should return InvalidParameterError when given rtu import log is not valid uuid`, async () => {
      const getRtuProjectCommand: IByIdCommandProps = {
        id: 'doesNotExist'
      };
      const result = await getRtuImportLogUseCase.execute(getRtuProjectCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
    });

    it(`should return notFoundError when given rtu import log do not exists`, async () => {
      const getRtuProjectCommand: IByIdCommandProps = {
        id: '0a0a0a0a0a0a0a0a0a0a0a0a'
      };
      const result = await getRtuImportLogUseCase.execute(getRtuProjectCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });
  });
});
