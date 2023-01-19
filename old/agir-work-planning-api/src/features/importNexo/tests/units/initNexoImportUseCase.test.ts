import {
  ErrorCodes,
  INexoImportFile,
  INexoImportLog,
  NexoFileType,
  NexoImportStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import * as sinon from 'sinon';
import {
  getStorageCreateResponse,
  storageApiServiceStub
} from '../../../../../tests/utils/stub/storageApiService.stub';
import { assertFailures, destroyDBTests, mergeProperties } from '../../../../../tests/utils/testHelper';
import { AlreadyExistsError } from '../../../../shared/domainErrors/alreadyExistsError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertAudit } from '../../../audit/test/auditTestHelper';
import { NexoImportLog } from '../../models/nexoImportLog';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { IImportNexoFileProps } from '../../useCases/initNexoImport/importNexoFileCommand';
import { initNexoImportUseCase } from '../../useCases/initNexoImport/initNexoImportUseCase';
import { getNexoImportLog, getUploadFile } from '../nexoTestHelper';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe(`initNexoImportUseCase`, () => {
  let initNexoImportCommand: IImportNexoFileProps;

  beforeEach(() => {
    storageApiServiceStub.init(sandbox);
    storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('1111d1ea-111e-11ee-a1f1-2f11f111e1f1'));
    initNexoImportCommand = {
      fileType: NexoFileType.INTERVENTIONS_SE,
      file: getUploadFile()
    };
  });

  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
  });

  describe(`Negative`, () => {
    [
      {
        description: 'Missing file on request',
        requestError: {
          file: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'file',
            code: ErrorCodes.MissingValue,
            message: 'file is null or undefined'
          }
        ]
      },
      {
        description: 'Missing fileType',
        requestError: {
          fileType: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'fileType',
            code: ErrorCodes.MissingValue,
            message: 'fileType is null or undefined'
          }
        ]
      },
      {
        description: 'Invalid fileType',
        requestError: {
          fileType: 'Invalid'
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'fileType',
            code: ErrorCodes.InvalidInput,
            message: `fileType isn't oneOf the correct values in ["interventionsSE","interventionsBudgetSE","rehabAqConception","rehabEgConception"]. Got "Invalid".`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        initNexoImportCommand = mergeProperties(initNexoImportCommand, test.requestError);
        const result = await initNexoImportUseCase.execute(initNexoImportCommand);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return alreadyExistsError when an import already is running`, async () => {
      const pendingImportLog: NexoImportLog = getNexoImportLog({
        status: NexoImportStatus.PENDING
      });
      await nexoImportLogRepository.save(pendingImportLog);

      const result = await initNexoImportUseCase.execute(initNexoImportCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, AlreadyExistsError, 'should be AlreadyExistsError');
    });
  });

  it(`should init NexoImportLog`, async () => {
    const result = await initNexoImportUseCase.execute(initNexoImportCommand);
    assert.isTrue(result.isRight());
    const createdNexoImportLog: INexoImportLog = result.value.getValue() as INexoImportLog;
    assert.isDefined(createdNexoImportLog.id);
    assert.strictEqual(createdNexoImportLog.files.length, 1);
    assert.strictEqual(createdNexoImportLog.status, NexoImportStatus.PENDING);
    assertAudit(createdNexoImportLog.audit);
    const fileNexo: INexoImportFile = createdNexoImportLog.files[0];
    assert.strictEqual(fileNexo.contentType, initNexoImportCommand.file.mimetype);
    assert.strictEqual(fileNexo.name, initNexoImportCommand.file.originalname);
    assert.strictEqual(fileNexo.type, initNexoImportCommand.fileType);
    assert.strictEqual(fileNexo.status, NexoImportStatus.PENDING);
  });
});
