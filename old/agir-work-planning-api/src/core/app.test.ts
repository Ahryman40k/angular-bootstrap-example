// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// tslint:disable:cyclomatic-complexity
// tslint:disable:no-string-literal
// tslint:disable: no-async-without-await
// ==========================================
import { correlationIdService } from '@villemontreal/core-correlation-id-nodejs-lib';
import { createServerError } from '@villemontreal/core-utils-general-nodejs-lib';
import * as autobind from 'autobind-decorator';
import { assert } from 'chai';
import * as express from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as httpMocks from 'node-mocks-http';
import * as supertest from 'supertest';

import { constants, EndpointTypes, globalConstants } from '../../config/constants';
import { appUtils, utils } from '../../src/utils/utils';
import { HttpMethods } from '../models/core/route';
import { createApp, createDefaultApp, wrapAsyncHandler } from './app';

const uuidMatcher = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ERROR_MESSAGE = 'error message';

// ==========================================
// App
// ==========================================
describe('App tests', () => {
  // ==========================================
  // Creates a default test app
  // ==========================================
  let testApp: express.Express;
  before(async function() {
    this.timeout(10000);
    testApp = await createDefaultApp();
  });

  // ==========================================
  // wrapAsyncHandler()
  // ==========================================
  describe('wrapAsyncHandler()', () => {
    it('Sends a response', async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        nextFnt: express.NextFunction
      ): Promise<void> => {
        res.send('ok');
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const next = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, next);
      assert.isUndefined(error);
    });

    it("Calls 'next()'", async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        next();
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isUndefined(error);
    });

    it("No response sent and 'next()' not called", async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        // nothing!
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isDefined(error);
    });

    it('Using a promise and awaiting it', async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        await Promise.resolve().then(async () => {
          await utils.sleep(50);
          res.send('ok');
        });
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isUndefined(error);
    });

    it('Using a promise and returning it', async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        return Promise.resolve().then(async () => {
          await utils.sleep(50);
          res.send('ok');
        });
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isUndefined(error);
    });

    it('Using a promise but without awaiting or returning it', async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        // tslint:disable-next-line:no-floating-promises
        Promise.resolve().then(async () => {
          await utils.sleep(50);
          res.send('oups!');
        });
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isDefined(error);
    });

    it('Throws a sync error', async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        throw new Error(ERROR_MESSAGE);
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isDefined(error);
      assert.strictEqual(error.message, ERROR_MESSAGE);
    });

    it('Throws an async error - await', async () => {
      const handler = async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ): Promise<void> => {
        await Promise.resolve().then(async () => {
          await utils.sleep(50);
          throw new Error(ERROR_MESSAGE);
        });
      };

      const wrappedHandler = wrapAsyncHandler(handler);

      let error: any;
      const nextFnt = (err?: any) => {
        error = err;
      };

      const request = httpMocks.createRequest({ method: 'GET', url: '/' });
      const response = httpMocks.createResponse();

      await wrappedHandler(request, response, nextFnt);
      assert.isDefined(error);
      assert.strictEqual(error.message, ERROR_MESSAGE);
    });
  });

  it('Throws an async error - return', async () => {
    const handler = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
      return Promise.resolve().then(async () => {
        await utils.sleep(50);
        throw new Error(ERROR_MESSAGE);
      });
    };

    const wrappedHandler = wrapAsyncHandler(handler);

    let error: any;
    const nextFnt = (err?: any) => {
      error = err;
    };

    const request = httpMocks.createRequest({ method: 'GET', url: '/' });
    const response = httpMocks.createResponse();

    await wrappedHandler(request, response, nextFnt);
    assert.isDefined(error);
    assert.strictEqual(error.message, ERROR_MESSAGE);
  });

  it('Throws an async error - without await or return', async () => {
    const handler = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
      // tslint:disable-next-line:no-floating-promises
      Promise.resolve().then(async () => {
        await utils.sleep(50);
        throw new Error(ERROR_MESSAGE);
      });
    };

    const wrappedHandler = wrapAsyncHandler(handler);

    let error: any;
    const nextFnt = (err?: any) => {
      error = err;
    };

    const request = httpMocks.createRequest({ method: 'GET', url: '/' });
    const response = httpMocks.createResponse();

    await wrappedHandler(request, response, nextFnt);
    assert.isDefined(error);
    assert.notEqual(error.message, ERROR_MESSAGE); // not equals!
  });

  it("The 'this' object is the controller itself inside the handler when @autobind is used", async () => {
    @autobind
    class TestController {
      private readonly testString = 'titi';
      public async handler(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        next(this ? this.testString : this);
      }
    }

    const controller: TestController = new TestController();

    const wrappedHandler = wrapAsyncHandler(controller.handler);

    let nextResult: any;
    const nextFnt = (result?: any) => {
      nextResult = result;
    };

    const request = httpMocks.createRequest({ method: 'GET', url: '/' });
    const response = httpMocks.createResponse();

    await wrappedHandler(request, response, nextFnt);
    assert.isDefined(nextResult);
    assert.equal(nextResult, 'titi');
  });

  it("The 'this' object is not the controller itself without @autobind", async () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      public async handler(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        next(this);
      }
    }

    const controller: TestController = new TestController();

    const wrappedHandler = wrapAsyncHandler(controller.handler);

    let nextResult: any;
    const nextFnt = (result?: any) => {
      nextResult = result;
    };

    const request = httpMocks.createRequest({ method: 'GET', url: '/' });
    const response = httpMocks.createResponse();

    await wrappedHandler(request, response, nextFnt);
    assert.isUndefined(nextResult);
  });

  // ==========================================
  // Catch error in BodyParser
  // ==========================================
  describe('Catch error in BodyParser', async () => {
    it('Malformed JSON should return [400] Bad request', async () => {
      const app: express.Express = await createApp([
        {
          method: HttpMethods.POST,
          path: '/test',
          async handler(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.send({
              status: 'ok'
            });
          },
          endpointType: EndpointTypes.NONE
        }
      ]);

      const fullPath = appUtils.createPublicFullPath('/test', EndpointTypes.NONE);
      const response = await supertest(app)
        .post(fullPath)
        .send('{"invalid"}')
        .type('json');

      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.error.code, globalConstants.errors.apiGeneralErrors.codes.INVALID_JSON_BODY);
      assert.strictEqual(response.body.error.target, 'body');
    });
  });

  // ==========================================
  // Route specific middlewares
  // ==========================================
  describe('Route specific middlewares', async () => {
    it('Both middlewares are called', async () => {
      const middlewaresCalled: number[] = [];

      const app: express.Express = await createApp([
        {
          method: HttpMethods.GET,
          path: '/test',
          middlewares: [
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
              middlewaresCalled.push(1);
              next();
            },
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
              middlewaresCalled.push(2);
              next();
            }
          ],
          async handler(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.send({
              status: 'ok'
            });
          },
          endpointType: EndpointTypes.NONE
        }
      ]);

      const fullPath = appUtils.createPublicFullPath('/test', EndpointTypes.NONE);
      const response = await supertest(app)
        .get(fullPath)
        .send();
      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 200);
      assert.deepEqual(response.body, {
        status: 'ok'
      });

      assert.strictEqual(middlewaresCalled.length, 2);
      assert.strictEqual(middlewaresCalled[0], 1);
      assert.strictEqual(middlewaresCalled[1], 2);
    });

    it('Middleware errors are managed properly', async () => {
      const app: express.Express = await createApp([
        {
          method: HttpMethods.GET,
          path: '/test',
          middlewares: [
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
              throw createServerError('error');
            }
          ],
          async handler(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.send({
              status: 'ok'
            });
          },
          endpointType: EndpointTypes.NONE
        }
      ]);

      const fullPath = appUtils.createPublicFullPath('/test', EndpointTypes.NONE);
      const response = await supertest(app)
        .get(fullPath)
        .send();
      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 500);
    });

    it("Middleware that doesn't call next() is managed", async () => {
      const app: express.Express = await createApp([
        {
          method: HttpMethods.GET,
          path: '/test',
          middlewares: [
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
              // no next() called!
            }
          ],
          async handler(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.send({
              status: 'ok'
            });
          },
          endpointType: EndpointTypes.NONE
        }
      ]);

      const fullPath = appUtils.createPublicFullPath('/test', EndpointTypes.NONE);
      const response = await supertest(app)
        .get(fullPath)
        .send();
      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 500);
    });
  });

  // ==========================================
  // Correlation ID
  // ==========================================
  describe('Correlation ID', () => {
    it('/api - cid in request', async () => {
      testApp = await createApp([
        {
          method: HttpMethods.GET,
          path: '/ok',
          handler: async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            res.send({
              cidInRequest: req.get(httpHeaderFieldsTyped.X_CORRELATION_ID),
              cidInScope: correlationIdService.getId()
            });
          }
        }
      ]);

      const cidSent = correlationIdService.createNewId();
      assert.match(cidSent, uuidMatcher);

      const path = appUtils.createPublicFullPath('/ok', EndpointTypes.API);
      const response = await supertest(testApp)
        .get(path)
        .set(httpHeaderFieldsTyped.X_CORRELATION_ID, cidSent)
        .send();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.type, constants.mediaTypes.JSON);

      assert.strictEqual(response.body.cidInRequest, cidSent);
      assert.match(response.body.cidInScope, uuidMatcher);
      assert.strictEqual(response.body.cidInScope, cidSent);
    });

    it('/api - cid not in request', async () => {
      testApp = await createApp([
        {
          method: HttpMethods.GET,
          path: '/ok',
          handler: async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            res.send({
              cidInRequest: req.get(httpHeaderFieldsTyped.X_CORRELATION_ID),
              cidInScope: correlationIdService.getId()
            });
          }
        }
      ]);

      const path = appUtils.createPublicFullPath('/ok', EndpointTypes.API);
      const response = await supertest(testApp)
        .get(path)
        .send();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.type, constants.mediaTypes.JSON);

      assert.isUndefined(response.body.cidInRequest);
      assert.match(response.body.cidInScope, uuidMatcher);
    });

    it('not an /api endpoint ', async () => {
      testApp = await createApp([
        {
          method: HttpMethods.GET,
          path: '/dia',
          handler: async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            res.send({
              cidInRequest: req.get(httpHeaderFieldsTyped.X_CORRELATION_ID),
              cidInScope: correlationIdService.getId()
            });
          },
          endpointType: EndpointTypes.DIAGNOSTICS
        },
        {
          method: HttpMethods.GET,
          path: '/docu',
          handler: async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            res.send({
              cidInRequest: req.get(httpHeaderFieldsTyped.X_CORRELATION_ID),
              cidInScope: correlationIdService.getId()
            });
          },
          endpointType: EndpointTypes.DOCUMENTATION
        },
        {
          method: HttpMethods.GET,
          path: '/none',
          handler: async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            res.send({
              cidInRequest: req.get(httpHeaderFieldsTyped.X_CORRELATION_ID),
              cidInScope: correlationIdService.getId()
            });
          },
          endpointType: EndpointTypes.NONE
        }
      ]);

      const cidSent = correlationIdService.createNewId();
      assert.match(cidSent, uuidMatcher);

      let path = appUtils.createPublicFullPath('/dia', EndpointTypes.DIAGNOSTICS);
      let response = await supertest(testApp)
        .get(path)
        .set(httpHeaderFieldsTyped.X_CORRELATION_ID, cidSent)
        .send();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.body.cidInRequest, cidSent);
      assert.isUndefined(response.body.cidInScope);

      path = appUtils.createPublicFullPath('/docu', EndpointTypes.DOCUMENTATION);
      response = await supertest(testApp)
        .get(path)
        .set(httpHeaderFieldsTyped.X_CORRELATION_ID, cidSent)
        .send();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.body.cidInRequest, cidSent);
      assert.isUndefined(response.body.cidInScope);

      path = appUtils.createPublicFullPath('/none', EndpointTypes.NONE);
      response = await supertest(testApp)
        .get(path)
        .set(httpHeaderFieldsTyped.X_CORRELATION_ID, cidSent)
        .send();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.body.cidInRequest, cidSent);
      assert.isUndefined(response.body.cidInScope);
    });
  });

  // ==========================================
  // Request start/end logging
  // ==========================================
  describe('Request start/end logging', () => {
    before(async () => {
      // ==========================================
      // App with a "catch all" route that returns
      // the timer, if any.
      // ==========================================
      testApp = await createApp([
        {
          method: HttpMethods.GET,
          path: '*',
          async handler(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.send({
              // tslint:disable-next-line:no-string-literal
              timer: req['_startTimer']
            });
          },
          endpointType: EndpointTypes.NONE
        }
      ]);
    });

    it('rootDiagnostics /diagnostics/v1/ping - not logged!', async () => {
      const response = await supertest(testApp).get('/diagnostics/v1/ping');
      assert.strictEqual(response.status, 200);
      assert.isNotOk(response.body.timer);
    });

    it('rootDiagnostics /diagnostics/v1/metrics - not logged!', async () => {
      const response = await supertest(testApp).get('/diagnostics/v1/metrics');
      assert.strictEqual(response.status, 200);
      assert.isNotOk(response.body.timer);
    });

    it('root html page - not logged!', async () => {
      const response = await supertest(testApp).get('/open-api');
      assert.strictEqual(response.status, 200);
      assert.isNotOk(response.body.timer);
    });
  });
});
