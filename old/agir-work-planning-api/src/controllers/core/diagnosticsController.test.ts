// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// tslint:disable:cyclomatic-complexity
// tslint:disable:no-string-literal
// ==========================================
import { httpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import { assert } from 'chai';
import * as superagent from 'superagent';

import { configs } from '../../../config/configs';
import { constants, EndpointTypes } from '../../../config/constants';
import { startServer, stopServer } from '../../core/server';
import { IDiagnosticsInfo } from '../../models/core/diagnosticsInfo';
import { appUtils, utils } from '../../utils/utils';

describe('Diagnostics endpoints', () => {
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

  it('Ping', async () => {
    const url = appUtils.createPublicUrl(
      configs.routing.routes.diagnostics.ping,
      EndpointTypes.DIAGNOSTICS,
      serverPort
    );
    const request = superagent
      .get(url)
      .timeout(120000)
      .send();
    const response = await httpUtils.send(request);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.type, 'text/plain');
    assert.strictEqual(response.text, 'pong');
  });

  it('Info', async () => {
    const url = appUtils.createPublicUrl(
      configs.routing.routes.diagnostics.info,
      EndpointTypes.DIAGNOSTICS,
      serverPort
    );

    const request = superagent
      .get(url)
      .timeout(120000)
      .send();

    const response = await httpUtils.send(request);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.type, constants.mediaTypes.JSON);
    assert.isNotNull(response.body);
    const info: IDiagnosticsInfo = response.body;

    const packageJson = require(`${configs.root}/package.json`);
    assert.strictEqual(info.name, packageJson.name);
    assert.strictEqual(info.description, packageJson.description);
    assert.strictEqual(info.version, packageJson.version);
  });
});
