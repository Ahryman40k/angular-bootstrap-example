import {
  IDeleteObjectOptions,
  IDeleteObjectResult,
  IDownloadObjectOptions,
  IDownloadObjectResult,
  IObjectMetadata,
  IUpdateObjectMetadataOptions,
  IUploadObjectFromBufferOptions,
  IUploadObjectResult
} from '@villemontreal/infra-object-storage-client-node-v2';
import { IUpdateMetadataResult } from '@villemontreal/infra-object-storage-client-node-v2/dist/cjs/src/common/protocols';
import { Result } from '../logic/result';
import { UploadFile } from '../upload/uploadFile';

// tslint:disable:no-empty-interface
export interface IUploadFileResult extends IUploadObjectResult {}
export interface IDownloadFileResult extends IDownloadObjectResult {}
export interface IDownloadFileOptions extends IDownloadObjectOptions {}
export interface IDeleteFileResult extends IDeleteObjectResult {}
export interface IDeleteFileOptions extends IDeleteObjectOptions {}
export interface IFileMetadata extends IObjectMetadata {}
export interface IUploadFromBufferOptions extends IUploadObjectFromBufferOptions {}
export interface IUpdateMetadataOptions extends IUpdateObjectMetadataOptions {}
export interface IUpdateMetadataResults extends IUpdateMetadataResult {}

export const STORAGE_OBJECT_STATE_READY = 'Ready' as any;
export const STORAGE_OBJECT_STATE_DELETED = 'Deleted' as any;

export interface IStorageService {
  create(fileDataToUpload: UploadFile): Promise<Result<IUploadFileResult>>;
  get(id: string): Promise<Result<IDownloadFileResult>>;
  delete(id: string): Promise<Result<IDeleteFileResult>>;
  update(options: IUpdateMetadataOptions): Promise<IUpdateMetadataResult>;
}
