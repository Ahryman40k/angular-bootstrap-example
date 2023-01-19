import { STORAGE_OBJECT_ID } from '../../../src/features/documents/tests/documentsTestHelper';
import { Result } from '../../../src/shared/logic/result';
import {
  IDeleteFileResult,
  IDownloadFileResult,
  IFileMetadata,
  IUploadFileResult,
  STORAGE_OBJECT_STATE_READY
} from '../../../src/shared/storage/iStorageService';
import { storageApiService } from '../../../src/shared/storage/storageApiService';
import { UploadFile } from '../../../src/shared/upload/uploadFile';
import { TimeUnits } from '../../../src/utils/moment/moment.enum';
import { MomentUtils } from '../../../src/utils/moment/momentUtils';
import { appUtils } from '../../../src/utils/utils';

class StorageApiServiceStub {
  private downloadStubEntity: sinon.SinonStub<[string], Promise<Result<IDownloadFileResult>>>;
  private uploadStubEntity: sinon.SinonStub<[UploadFile], Promise<Result<IUploadFileResult>>>;
  private deleteStubEntity: sinon.SinonStub<[string], Promise<Result<IDeleteFileResult>>>;

  public get uploadStub() {
    return this.uploadStubEntity;
  }

  public init(sandbox: sinon.SinonSandbox) {
    this.initDownloadStub(sandbox);
    this.initUploadStub(sandbox, undefined, false);
    this.initDeleteStub(sandbox);
  }

  public initUploadStub(
    sandbox: sinon.SinonSandbox,
    response?: IUploadFileResult,
    restore: boolean = true
  ): sinon.SinonStub<[UploadFile], Promise<Result<IUploadFileResult>>> {
    if (restore && this.uploadStubEntity) {
      this.uploadStubEntity.restore();
    }
    this.uploadStubEntity = sandbox
      .stub(storageApiService, 'create')
      .returns(Promise.resolve(Result.ok(response || getStorageCreateResponse())));
    return this.uploadStubEntity;
  }

  public get downloadStub() {
    return this.downloadStubEntity;
  }

  public initDownloadStub(
    sandbox: sinon.SinonSandbox,
    response?: IDownloadFileResult
  ): sinon.SinonStub<[string], Promise<Result<IDownloadFileResult>>> {
    this.downloadStubEntity = sandbox
      .stub(storageApiService, 'get')
      .returns(Promise.resolve(Result.ok(response || getStorageGetResponse())));
    return this.downloadStubEntity;
  }

  public get deleteStub() {
    return this.deleteStubEntity;
  }

  public initDeleteStub(sandbox: sinon.SinonSandbox): sinon.SinonStub<[string], Promise<Result<IDeleteFileResult>>> {
    this.deleteStubEntity = sandbox
      .stub(storageApiService, 'delete')
      .returns(Promise.resolve(Result.ok(getStorageDeleteResponse())));
    return this.deleteStubEntity;
  }

  public restore(): void {
    this.uploadStubEntity.restore();
  }
}
export const storageApiServiceStub = new StorageApiServiceStub();

export const metadata: IFileMetadata = {
  objectName: 'test',
  contentLength: 1338690,
  contentType: 'image/jpg',
  createdAt: MomentUtils.now().toISOString(),
  createdBy: '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!331A.09D5.4824.1C82',
  lastModifiedAt: MomentUtils.now().toISOString(),
  lastModifiedBy: '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!331A.09D5.4824.1C82',
  contentMD5: '609573586f1de0467efd64fb3dde6c3e',
  expiresAt: MomentUtils.add(MomentUtils.now(), 5, TimeUnits.YEAR).toISOString(),
  links: {
    iconLink: '',
    thumbnailLinks: [''],
    downloadLink:
      'https://agir.storage.ca/8137d3ea-988e-44ee-a7f4-0f55f772e8f6?Expires=1596568725&Signature=Du1Pel8FiWwIp%2By3Un66Cuo0jN%2B2YZIGRSU5tw%3D%3D',
    uploadLink: ''
  },
  state: STORAGE_OBJECT_STATE_READY
};

export const metadataPdf: IFileMetadata = {
  objectName: 'test',
  contentLength: 1338690,
  contentType: 'application/pdf',
  createdAt: MomentUtils.now().toISOString(),
  createdBy: '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!331A.09D5.4824.1C82',
  lastModifiedAt: MomentUtils.now().toISOString(),
  lastModifiedBy: '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!331A.09D5.4824.1C82',
  contentMD5: 'f8bdb1aa55c111940e66479b07bfed96',
  expiresAt: MomentUtils.add(MomentUtils.now(), 5, TimeUnits.YEAR).toISOString(),
  links: {
    iconLink: '',
    thumbnailLinks: [''],
    downloadLink:
      'https://agir.storage.ca/8137d3ea-988e-44ee-a7f4-0f55f772e8f6?Expires=1596568725&Signature=Du1Pel8FiWwIp%2By3Un66Cuo0jN%2B2YZIGRSU5tw%3D%3D',
    uploadLink: ''
  },
  state: STORAGE_OBJECT_STATE_READY
};

export function getStorageCreateResponse(objectId?: string): IUploadFileResult {
  return {
    metadata,
    objectId: objectId ? objectId : STORAGE_OBJECT_ID
  };
}

export function getStorageDeleteResponse(): IDeleteFileResult {
  return {
    metadata
  };
}

export function getStorageGetResponse(data?: Buffer): IDownloadFileResult {
  return {
    metadata,
    data: data ? data : appUtils.readFile(__dirname, './../../data/assets/testFile.png')
  };
}
