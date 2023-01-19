import { HttpClient } from '@angular/common/http';

import { uploadFile } from '../files/utils';

export abstract class BaseUploadDownloadService<T> {
  protected uploadUrl: string;

  constructor(protected readonly http: HttpClient, uploadUrl: string) {
    this.uploadUrl = uploadUrl;
  }

  public async uploadFile(body: { [key: string]: string | Blob }, headers?: { [key: string]: string }): Promise<T> {
    const newHeaders = Object.assign({ Accept: 'application/json' }, headers);
    return uploadFile<T>(this.http, this.uploadUrl, body, newHeaders);
  }
}
