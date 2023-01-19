// ==========================================
// Simple controller tests
// ==========================================
import { assert } from 'chai';
import * as express from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../config/constants';
import { createApp } from '../../src/core/app';
import { HttpMethods } from '../../src/models/core/route';
import { appUtils } from '../../src/utils/utils';

describe(`HTTP related libraries`, () => {
  it(`HttpHeaderNames and HttpStatusCodes`, async () => {
    const testApp = await createApp([
      {
        method: HttpMethods.GET,
        path: '/test',
        handler: (req: express.Request, res: express.Response, next: express.NextFunction): void => {
          assert.strictEqual(req.get(httpHeaderFieldsTyped.ACCEPT), constants.mediaTypes.JSON);
          assert.strictEqual(req.header(httpHeaderFieldsTyped.ACCEPT), constants.mediaTypes.JSON);
          res.sendStatus(HttpStatusCodes.OK);
        }
      }
    ]);

    const path = appUtils.createPublicFullPath('/test', EndpointTypes.API);
    const response = await request(testApp)
      .get(path)
      .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON) // all typed!
      .send();
    assert.strictEqual(response.type, constants.mediaTypes.PLAIN_TEXT);
    assert.strictEqual(response.status, HttpStatusCodes.OK);
  });
});
