// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// tslint:disable:cyclomatic-complexity
// tslint:disable:no-string-literal
// ==========================================
import { httpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import { assert } from 'chai';
import * as superagent from 'superagent';

import { configs } from '../../config/configs';
import { constants, EndpointTypes, globalConstants } from '../../config/constants';
import { appUtils, utils } from '../../src/utils/utils';
import { startServer, stopServer } from './server';

// ==========================================
// Unlisted routes
// ==========================================
describe('Unlisted routes', () => {
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

  it('GET /favicon.ico', async () => {
    const url = appUtils.createPublicUrl('/favicon.ico', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, 'image/png');
    assert.strictEqual(response.status, 200);
  });

  it('GET /apple-touch-icon.png', async () => {
    const url = appUtils.createPublicUrl('/apple-touch-icon.png', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, 'image/png');
    assert.strictEqual(response.status, 200);
  });

  it('GET /tile.png', async () => {
    const url = appUtils.createPublicUrl('/tile.png', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, 'image/png');
    assert.strictEqual(response.status, 200);
  });

  it('GET /tile-wide.png', async () => {
    const url = appUtils.createPublicUrl('/tile-wide.png', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, 'image/png');
    assert.strictEqual(response.status, 200);
  });

  it('GET /robots.txt', async () => {
    const url = appUtils.createPublicUrl('/robots.txt', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, constants.mediaTypes.PLAIN_TEXT);
    assert.strictEqual(response.status, 200);
  });

  it('GET /humans.txt', async () => {
    const url = appUtils.createPublicUrl('/humans.txt', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, constants.mediaTypes.PLAIN_TEXT);
    assert.strictEqual(response.status, 200);
  });

  it('GET /browserconfig.xml', async () => {
    const url = appUtils.createPublicUrl('/browserconfig.xml', EndpointTypes.NONE, serverPort);
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.type, constants.mediaTypes.PLAIN_TEXT);
    assert.strictEqual(response.status, 200);
  });

  // ==========================================
  // Info pages
  // ==========================================
  describe('Info pages', () => {
    it('GET - Root index responds with 200 and some HTML', async () => {
      const url = appUtils.createPublicUrl('/', EndpointTypes.NONE, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, 'text/html');
      assert.strictEqual(response.status, 200);
    });

    it('GET - Readme page responds with 200 and some HTML', async () => {
      const url = appUtils.createPublicUrl('/readme', EndpointTypes.NONE, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, 'text/html');
      assert.strictEqual(response.status, 200);
    });

    it('GET - Open API page responds with 200 and some HTML', async () => {
      const url = appUtils.createPublicUrl('/open-api', EndpointTypes.NONE, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, 'text/html');
      assert.strictEqual(response.status, 200);
    });

    it('GET - Health page responds with 200 and some HTML', async () => {
      const url = appUtils.createPublicUrl('/health', EndpointTypes.NONE, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, 'text/html');
      assert.strictEqual(response.status, 200);
    });

    it('GET - Metrics page responds with 200 and some HTML', async () => {
      const url = appUtils.createPublicUrl('/metrics', EndpointTypes.NONE, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, constants.mediaTypes.PLAIN_TEXT);
      assert.strictEqual(response.status, 200);
    });

    it('POST - Index responds with 404 and a text message', async () => {
      const url = appUtils.createPublicUrl('/', EndpointTypes.NONE, serverPort);
      const request = superagent
        .post(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 404);

      const body = response.body;
      assert.isOk(body);
      assert.isOk(body.error);
      assert.isOk(body.error.code);
      assert.strictEqual(body.error.code, globalConstants.errors.apiGeneralErrors.codes.NOT_FOUND);
    });

    it('GET - API index responds with 404 and a text message', async () => {
      const url = appUtils.createPublicUrl('/', EndpointTypes.API, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 404);

      const body = response.body;
      assert.isOk(body);
      assert.isOk(body.error);
      assert.isOk(body.error.code);
      assert.strictEqual(body.error.code, globalConstants.errors.apiGeneralErrors.codes.NOT_FOUND);
    });

    it('GET - Documentation index responds with 404 and a text message', async () => {
      const url = appUtils.createPublicUrl('/', EndpointTypes.DOCUMENTATION, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 404);

      const body = response.body;
      assert.isOk(body);
      assert.isOk(body.error);
      assert.isOk(body.error.code);
      assert.strictEqual(body.error.code, globalConstants.errors.apiGeneralErrors.codes.NOT_FOUND);
    });

    it('GET - Diagnostics index responds with 404 and a text message', async () => {
      const url = appUtils.createPublicUrl('/', EndpointTypes.DIAGNOSTICS, serverPort);
      const request = superagent
        .get(url)
        .timeout(120000)
        .send();
      const response = await httpUtils.send(request);

      assert.strictEqual(response.type, constants.mediaTypes.JSON);
      assert.strictEqual(response.status, 404);

      const body = response.body;
      assert.isOk(body);
      assert.isOk(body.error);
      assert.isOk(body.error.code);
      assert.strictEqual(body.error.code, globalConstants.errors.apiGeneralErrors.codes.NOT_FOUND);
    });
  });
});
