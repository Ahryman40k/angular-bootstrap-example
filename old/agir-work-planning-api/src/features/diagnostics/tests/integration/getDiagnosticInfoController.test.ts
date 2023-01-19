import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { assert } from 'chai';
import sinon = require('sinon');
import { diagnosticInfoTestClient } from '../../../../../tests/utils/testClients/getDiagnosticInfoTestClient';
import { IDiagnosticsInfo } from '../../../../models/core/diagnosticsInfo';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { Result } from '../../../../shared/logic/result';
import { appUtils } from '../../../../utils/utils';

describe('GetDiagnosticInfoController', () => {
  let sandbox: sinon.SinonSandbox;
  let currentPackageJson: any;
  before(async () => {
    sandbox = sinon.createSandbox();
    currentPackageJson = (await appUtils.getPackageJson()).getValue();
  });
  describe('/v1/info - GET', () => {
    it(`should get unexpected error when package json could not be fetched`, async () => {
      sandbox
        .stub(appUtils, 'getPackageJson')
        .resolves(Result.fail(UnexpectedError.create('error', `An error occured while getting package.json`)));
      const response = await diagnosticInfoTestClient.get();
      assert.strictEqual(response.status, HttpStatusCodes.INTERNAL_SERVER_ERROR);
      sandbox.restore();
    });

    it(`should get diagnostic info`, async () => {
      const response = await diagnosticInfoTestClient.get();
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const diagnosticInfo: IDiagnosticsInfo = response.body;
      assert.strictEqual(diagnosticInfo.description, currentPackageJson.description);
      assert.strictEqual(diagnosticInfo.name, currentPackageJson.name);
      assert.strictEqual(diagnosticInfo.version, currentPackageJson.version);
    });
  });
});
