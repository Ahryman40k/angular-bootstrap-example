import { NexoFileType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as uuid from 'uuid';
import { getStorageGetResponse } from '../../../../../tests/utils/stub/storageApiService.stub';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { Result } from '../../../../shared/logic/result';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { NexoImportLog } from '../../models/nexoImportLog';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { getNexoImportFileUseCase } from '../../useCases/getNexoImportFile/getNexoImportFileUseCase';
import { getNexoImportFile, getNexoImportLog, getNexoXLXSFile } from '../nexoTestHelper';

const sandbox = sinon.createSandbox();
const INTERVENTIONS_SE_FILE_STORAGE_ID = uuid();

// tslint:disable:max-func-body-length
describe(`getNexoImportFileUseCase`, () => {
  let log: NexoImportLog;
  function stubDownload(response?: any, success = true) {
    const method = 'get';
    if (!success) {
      sandbox.stub(storageApiService, method).rejects();
    }
    sandbox.stub(storageApiService, method).resolves(response);
  }

  before(async () => {
    log = getNexoImportLog({
      status: NexoImportStatus.PENDING,
      files: [
        getNexoImportFile({
          type: NexoFileType.INTERVENTIONS_SE,
          storageId: INTERVENTIONS_SE_FILE_STORAGE_ID
        })
      ]
    });
    await nexoImportLogRepository.save(log);
  });

  after(async () => {
    await destroyDBTests();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it(`should retrieve file from first nexo log`, async () => {
    const file = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE);
    const stubbedStorageResponse = getStorageGetResponse(file.buffer);
    stubDownload(Result.ok(stubbedStorageResponse));
    const result = await getNexoImportFileUseCase.execute({
      nexoLogId: log.id,
      nexoFileId: log.files[0].storageId
    });
    assert.isTrue(result.isRight());
    assert.strictEqual(result.value.isSuccess, true);
    const resultValue = result.value.getValue() as IDownloadFileResult;
    assert.strictEqual(resultValue.metadata.objectName, stubbedStorageResponse.metadata.objectName);
  });

  describe(`Negative`, () => {
    [
      {
        description: 'return error if the log id is invalid',
        props: { nexoLogId: '123', nexoFileId: null },
        errorInstance: InvalidParameterError
      },
      {
        description: 'return error if the file id is invalid',
        props: { nexoLogId: null, nexoFileId: 123 as any },
        errorInstance: InvalidParameterError
      },
      {
        description: 'return error if the log id is not found',
        props: { nexoLogId: '60c3585ad1c2dd0010f04bfc', nexoFileId: null },
        errorInstance: NotFoundError
      },
      {
        description: 'return error if the file id is invalid',
        props: { nexoLogId: null, nexoFileId: '123' },
        errorInstance: NotFoundError
      }
    ].forEach(test => {
      it(`should ${test.description}`, async () => {
        if (!test.props.nexoFileId) {
          test.props.nexoFileId = log.files[0].storageId;
        }
        if (!test.props.nexoLogId) {
          test.props.nexoLogId = log.id;
        }
        const result = await getNexoImportFileUseCase.execute(test.props);
        assert.isFalse(result.isRight());
        assert.isTrue(!!result.value.error);
        assert.instanceOf(result.value, test.errorInstance);
      });
    });

    it(`should return error if the storage api returns an error`, async () => {
      const error = 'test';
      stubDownload(Result.fail({ error }));
      const result = await getNexoImportFileUseCase.execute({
        nexoLogId: log.id,
        nexoFileId: log.files[0].storageId
      });
      assert.isTrue(result.isLeft());
      assert.instanceOf(result.value, UnexpectedError);
      assert.strictEqual(
        (result.value.error as any).error,
        `An error occured during the download from storage api: ${error}`
      );
    });
  });
});
