import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { assertAudit } from '../../../audit/test/auditTestHelper';
import { bicImportLogsTestClient } from '../bicImportLogTestClient';

describe('CreateBicImportLogsTestController', () => {
  afterEach(async () => {
    await destroyDBTests();
    userMocker.reset();
  });
  beforeEach(() => {
    userMocker.mock(userMocks.pilot);
  });
  describe('/v1/import/bicImportLogs - POST', () => {
    it(`should return bic import log `, async () => {
      const response = await bicImportLogsTestClient.post();
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const bicImportLog: IBicImportLog = response.body;
      assert.isDefined(bicImportLog.id);
      assertAudit(bicImportLog.audit);
    });
  });
});
