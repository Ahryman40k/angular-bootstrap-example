import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { build, IObjectStorageClient } from '@villemontreal/infra-object-storage-client-node-v2';
import { get } from 'lodash';

import { configs } from '../../../config/configs';
import { gluuServiceFactory } from '../../factories/gluuServiceFactory';
import { createLogger } from '../../utils/logger';
import { Result } from '../logic/result';
import { UploadFile } from '../upload/uploadFile';
import {
  IDeleteFileResult,
  IDownloadFileResult,
  IStorageService,
  IUpdateMetadataOptions,
  IUpdateMetadataResults,
  IUploadFileResult
} from './iStorageService';

const logger = createLogger('StorageApiService');

class StorageApiService implements IStorageService {
  private readonly client: IObjectStorageClient;
  constructor() {
    this.client = build({
      apiGateway: configs.storageObject.gateway,
      volumeId: configs.storageObject.volumeId
    });
  }

  // TODO Refacto and remerge with other upload method
  public async create(fileDataToUpload: UploadFile): Promise<Result<IUploadFileResult>> {
    try {
      const uploadedObject = await this.client.uploadObject({
        data: fileDataToUpload.buffer,
        contentType: fileDataToUpload.mimetype,
        objectName: fileDataToUpload.originalname,
        ttl: configs.storageObject.ttl,
        accessToken: await gluuServiceFactory.getAcessToken()
      });
      return Result.ok<IUploadFileResult>(uploadedObject);
    } catch (clientError) {
      const error = this.parseError(clientError);
      logger.error(error, `Error uploadDocument objectName: ${fileDataToUpload.originalname}`);
      return Result.fail<IUploadFileResult>(error);
    }
  }

  public async get(id: string): Promise<Result<IDownloadFileResult>> {
    let downloadedObject: IDownloadFileResult;
    try {
      downloadedObject = await this.client.downloadObject({
        objectId: id,
        accessToken: await gluuServiceFactory.getAcessToken()
      });
      return Result.ok<IDownloadFileResult>(downloadedObject);
    } catch (clientError) {
      const error = this.parseError(clientError);
      if (error.status === HttpStatusCodes.NOT_FOUND) {
        return Result.fail<IDownloadFileResult>(error);
      }
      logger.error(error, `Error downloadFile objectId:  ${id}`);
      return Result.fail<IDownloadFileResult>(error);
    }
  }

  public async delete(id: string): Promise<Result<IDeleteFileResult>> {
    try {
      const deletedResult = await this.client.deleteObject({
        objectId: id,
        accessToken: await gluuServiceFactory.getAcessToken()
      });
      return Result.ok<IDeleteFileResult>(deletedResult);
    } catch (clientError) {
      const error = this.parseError(clientError);
      logger.error(error, `Error deleteDocument objectId: ${id}`);
      return Result.fail<IDeleteFileResult>(error);
    }
  }

  /**
   * Update the document metadata
   * @param options
   */
  public async update(options: IUpdateMetadataOptions): Promise<IUpdateMetadataResults> {
    return this.client.updateObjectMetadata(options);
  }

  private parseError(error: any): any {
    if (error.status) {
      return error;
    }
    return get(error, 'originalError');
  }
}
export const storageApiService: IStorageService = new StorageApiService();
