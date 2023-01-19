import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { rtuImportLogsTestClient } from '../../../../../tests/utils/testClients/rtuImportLogsTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { rtuImportLogMapperDTO } from '../../mappers/rtuImportLogMapperDTO';
import { rtuImportLogRepository } from '../../mongo/rtuImportLogRepository';
import { assertDtoRtuImportLog, getRtuImportLog } from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`GetRtuImportLogController`, () => {
  afterEach(() => {
    userMocker.reset();
  });
  beforeEach(() => {
    userMocker.mock(userMocks.pilot);
  });

  describe('/v1/rtuImportLog/{id} - GET', () => {
    describe(`Positive`, () => {
      const rtuImportLog = getRtuImportLog();
      before(async () => {
        await rtuImportLogRepository.save(rtuImportLog);
      });
      after(async () => {
        await destroyDBTests();
      });

      it(`should retrieve rtu import log by id`, async () => {
        const existingRtuImportLog = await rtuImportLogRepository.findById(rtuImportLog.id);
        assert.isDefined(existingRtuImportLog);

        const response = await rtuImportLogsTestClient.get(rtuImportLog.id.toString());
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const rtuImportLogFound: IRtuImportLog = response.body;
        const existingRtuImportLogDto = await rtuImportLogMapperDTO.getFromModel(existingRtuImportLog);
        assertDtoRtuImportLog(rtuImportLogFound, existingRtuImportLogDto);
      });
    });

    describe(`Negative`, () => {
      it(`should return invalidParameterError when given rtu import log is not valid uuid`, async () => {
        const response = await rtuImportLogsTestClient.get(`doesNotExist`);
        assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      });

      it(`should return notFoundError when given rtu import log do not exists`, async () => {
        const response = await rtuImportLogsTestClient.get(`0a0a0a0a0a0a0a0a0a0a0a0a`);
        assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
      });
    });
  });
});
