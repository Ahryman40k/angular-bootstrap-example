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
import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { ConflictError } from '../../../../shared/domainErrors/conflictError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertAudit } from '../../../audit/test/auditTestHelper';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { IUploadNexoFileProps } from '../../useCases/uploadNexoFile/uploadNexoFileCommand';
import { uploadNexoFileUseCase } from '../../useCases/uploadNexoFile/uploadNexoFileUseCase';
import { getNexoImportFile, getNexoImportLog, getUploadFile } from '../nexoTestHelper';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe(`uploadNexoFileUseCase`, () => {
  let uploadNexoImportCommand: IUploadNexoFileProps;

  beforeEach(() => {
    storageApiServiceStub.init(sandbox);
    storageApiServiceStub.initUploadStub(sandbox, getStorageCreateResponse('1111d1ea-111e-11ee-a1f1-2f11f111e1f1'));
    uploadNexoImportCommand = {
      id: NOT_FOUND_UUID,
      fileType: NexoFileType.INTERVENTIONS_BUDGET_SE,
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
        description: 'invalid nexoLog id',
        requestError: {
          id: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: 'id has a bad format'
          }
        ]
      },
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
        uploadNexoImportCommand = mergeProperties(uploadNexoImportCommand, test.requestError);
        const result = await uploadNexoFileUseCase.execute(uploadNexoImportCommand);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return conflictError when given import is not pending`, async () => {
      const nexoImportLog = (
        await nexoImportLogRepository.save(
          getNexoImportLog({
            status: NexoImportStatus.IN_PROGRESS
          })
        )
      ).getValue();

      const result = await uploadNexoFileUseCase.execute({
        ...uploadNexoImportCommand,
        id: nexoImportLog.id
      });
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, ConflictError, 'should be ConflictError');
    });

    it(`should return conflictError when same file type already exists`, async () => {
      const nexoImportLog = (
        await nexoImportLogRepository.save(
          getNexoImportLog({
            status: NexoImportStatus.PENDING,
            files: [
              getNexoImportFile({
                type: NexoFileType.INTERVENTIONS_BUDGET_SE
              })
            ]
          })
        )
      ).getValue();

      const result = await uploadNexoFileUseCase.execute({
        ...uploadNexoImportCommand,
        id: nexoImportLog.id
      });
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, ConflictError, 'should be ConflictError');
    });

    it(`should return notFoundError when given import do not exists`, async () => {
      const result = await uploadNexoFileUseCase.execute(uploadNexoImportCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });
  });

  it(`should upload file`, async () => {
    const nexoImportLog = (
      await nexoImportLogRepository.save(
        getNexoImportLog({
          status: NexoImportStatus.PENDING,
          files: [getNexoImportFile()]
        })
      )
    ).getValue();
    const nexoImportLogResponse = await nexoImportLogMapperDTO.getFromModel(nexoImportLog);
    assert.strictEqual(nexoImportLogResponse.files.length, 1, `should only have interventiosSE file`);
    assertAudit(nexoImportLogResponse.audit);
    assert.isUndefined(nexoImportLogResponse.audit.lastModifiedAt);
    // Run upload
    const result = await uploadNexoFileUseCase.execute({
      ...uploadNexoImportCommand,
      id: nexoImportLog.id
    });
    assert.isTrue(result.isRight());
    const updatedNexoImportLog: INexoImportLog = result.value.getValue() as INexoImportLog;
    assert.strictEqual(updatedNexoImportLog.files.length, 2, `should have interventionsSE and interventionsBudgetSE`);
    assert.isDefined(updatedNexoImportLog.audit.lastModifiedAt);
    assert.isDefined(updatedNexoImportLog.audit.lastModifiedBy);
    const fileNexo: INexoImportFile = updatedNexoImportLog.files.find(
      file => file.type === uploadNexoImportCommand.fileType
    );
    assert.strictEqual(fileNexo.contentType, uploadNexoImportCommand.file.mimetype);
    assert.strictEqual(fileNexo.name, uploadNexoImportCommand.file.originalname);
    assert.strictEqual(fileNexo.type, uploadNexoImportCommand.fileType);
    assert.strictEqual(fileNexo.status, NexoImportStatus.PENDING);
  });
});
