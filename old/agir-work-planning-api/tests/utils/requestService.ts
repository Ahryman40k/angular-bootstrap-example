import * as express from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as request from 'supertest';

import { constants } from '../../config/constants';
import { createDefaultApp } from '../../src/core/app';
import { createLogger } from '../../src/utils/logger';

const autobind = require('autobind-decorator');

export interface IRequestServiceOptions {
  body?: string | object;
  lang?: string;
}

export type HttpVerb = 'post' | 'put';

const logger = createLogger('Request service');

@autobind
export class RequestService {
  public testApp: express.Express;

  constructor() {
    createDefaultApp()
      .then(x => {
        this.testApp = x;
      })
      .catch(err => {
        logger.error(err);
      });
  }

  public async post(url: string, options: IRequestServiceOptions): Promise<request.Response> {
    return request(this.testApp)
      .post(url)
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
      .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, options.lang || 'fr')
      .send(options.body);
  }

  public upload(verb: HttpVerb, url: string): request.Request {
    return request(this.testApp)
      [verb](url)
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.MULTI_PART_FORM_DATA)
      .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr');
  }

  public async put(url: string, options: IRequestServiceOptions): Promise<request.Response> {
    return request(this.testApp)
      .put(url)
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
      .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, options.lang || 'fr')
      .send(options.body);
  }

  public async patch(url: string, options: IRequestServiceOptions): Promise<request.Response> {
    return request(this.testApp)
      .patch(url)
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
      .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, options.lang || 'fr')
      .send(options.body);
  }

  public async get(url: string, options?: IRequestServiceOptions, query?: any): Promise<request.Response> {
    return request(this.testApp)
      .get(url)
      .query(query ? query : {})
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
      .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, options?.lang || 'fr')
      .send();
  }

  public async delete(url: string, options?: IRequestServiceOptions, query?: any): Promise<request.Response> {
    return request(this.testApp)
      .delete(url)
      .query(query ? query : {})
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
      .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, options?.lang || 'fr')
      .send();
  }
}
export let requestService: RequestService = new RequestService();
