// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// tslint:disable:cyclomatic-complexity
// tslint:disable:no-string-literal
// ==========================================
import { httpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import { assert } from 'chai';
import * as express from 'express';
import * as superagent from 'superagent';
import * as supertest from 'supertest';

import { configs } from '../../../config/configs';
import { constants, EndpointTypes } from '../../../config/constants';
import { createApp } from '../../../src/core/app';
import { startServer, stopServer } from '../../core/server';
import { HttpMethods } from '../../models/core/route';
import { appUtils, utils } from '../../utils/utils';

// ==========================================
// Global errors
// ==========================================
describe('Global errors', () => {
  let serverPort: number;
  let serverPortOriginal: number;
  let apiPortOriginal: number;

  before(async function() {
    this.timeout(10000);

    // ==========================================
    // Uses a free port to start the server
    // ==========================================
    serverPort = await utils.findFreePort();
    serverPortOriginal = configs['cache'].set(`server.port`, serverPort);
    apiPortOriginal = configs['cache'].set(`api.port`, serverPort);
    await startServer();
  });

  after(() => {
    // ==========================================
    // Resets everything and stops the server
    // ==========================================
    try {
      configs['cache'].set(`server.port`, serverPortOriginal);
      configs['cache'].set(`api.port`, apiPortOriginal);
    } catch (err) {
      // ok
    }
    try {
      stopServer();
    } catch (err) {
      // ok
    }
  });

  it('Non existing resource', async () => {
    const url = appUtils.createPublicUrl('/nope', EndpointTypes.API, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.status, 404);
  });

  it('Server error - must return a Json structured error', async () => {
    // ==========================================
    // This is an example of testing
    // custom test routes.
    // ==========================================
    const testApp = await createApp([
      // Server error simulation route
      {
        method: HttpMethods.GET,
        path: '/error',
        handler: (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
          const nope: any = undefined;
          // tslint:disable-next-line: comment-format no-unused-expression
          nope.booooom; //NOSONAR // NPE!
          return null;
        }
      }
    ]);

    const path = appUtils.createPublicFullPath('/error', EndpointTypes.API);
    const response = await supertest(testApp)
      .get(path)
      .send();
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.type, constants.mediaTypes.JSON);
    assert.isOk(response.body);
    assert.isOk(response.body.error);
    assert.isOk(response.body.error.code);
    assert.strictEqual(response.body.error.code, 'serverError');
    assert.isOk(response.body.error.message);
    assert.isTrue(!utils.isBlank(response.body.error.message));
  });
});
