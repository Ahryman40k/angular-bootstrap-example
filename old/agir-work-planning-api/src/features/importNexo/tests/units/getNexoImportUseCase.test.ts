import { ErrorCodes, INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { NexoImportLog } from '../../models/nexoImportLog';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { getNexoImportUseCase } from '../../useCases/getNexoImport/getNexoImportUseCase';
import { assertNexoImportLog, getNexoImportLog } from '../nexoTestHelper';

// tslint:disable:max-func-body-length
describe(`GetNexoImportUseCase`, () => {
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    [
      {
        description: 'missing nexo import log id',
        requestError: {
          id: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.MissingValue,
            message: `id is null or undefined`
          }
        ]
      },
      {
        description: 'invalid nexo import log id',
        requestError: {
          id: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: `id has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const getNexoImportCommand: IByUuidCommandProps = {
          id: NOT_FOUND_UUID
        };
        const result = await getNexoImportUseCase.execute(mergeProperties(getNexoImportCommand, test.requestError));
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return notFoundError when given nexo import log id do not exists`, async () => {
    const getNexoImportCommand: IByUuidCommandProps = {
      id: NOT_FOUND_UUID
    };
    const result = await getNexoImportUseCase.execute(getNexoImportCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  describe(`with a pre-populated database`, () => {
    let currentNexoImportLog: NexoImportLog;
    beforeEach(async () => {
      currentNexoImportLog = (await nexoImportLogRepository.save(getNexoImportLog({}))).getValue();
    });

    it(`should retrieve import nexo log by id`, async () => {
      const existingNexoImportLog = await nexoImportLogRepository.findById(currentNexoImportLog.id);
      assert.isDefined(existingNexoImportLog);

      const getNexoImportCommand: IByUuidCommandProps = {
        id: currentNexoImportLog.id.toString()
      };
      const result = await getNexoImportUseCase.execute(getNexoImportCommand);
      assert.isTrue(result.isRight());
      const nexoImportLog = result.value.getValue() as INexoImportLog;
      assertNexoImportLog(nexoImportLog, existingNexoImportLog);
    });
  });
});
