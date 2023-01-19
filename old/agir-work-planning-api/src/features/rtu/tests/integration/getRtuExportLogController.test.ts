import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { rtuExportLogsTestClient } from '../../../../../tests/utils/testClients/rtuExportLogsTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { rtuExportLogMapperDTO } from '../../mappers/rtuExportLogMapperDTO';
import { rtuExportLogRepository } from '../../mongo/rtuExportLogRepository';
import { getRtuExportLog } from '../rtuExportTestHelper';
import { assertDtoRtuExportLog } from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`GetRtuExportLogController`, () => {
  afterEach(() => {
    userMocker.reset();
  });
  beforeEach(() => {
    userMocker.mock(userMocks.pilot);
  });

  describe('/v1/rtuExportLog/{id} - GET', () => {
    describe(`Positive`, () => {
      const rtuExportLog = getRtuExportLog();
      before(async () => {
        await rtuExportLogRepository.save(rtuExportLog);
      });
      after(async () => {
        await destroyDBTests();
      });

      it(`should retrieve rtu Export log by id`, async () => {
        const existingRtuExportLog = await rtuExportLogRepository.findById(rtuExportLog.id);
        assert.isDefined(existingRtuExportLog);

        const response = await rtuExportLogsTestClient.get(rtuExportLog.id.toString());
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const rtuExportLogFound: IRtuExportLog = response.body;
        const existingRtuExportLogDto = await rtuExportLogMapperDTO.getFromModel(existingRtuExportLog);
        assertDtoRtuExportLog(rtuExportLogFound, existingRtuExportLogDto);
      });
    });

    describe(`Negative`, () => {
      it(`should return invalidParameterError when given rtu Export log is not valid uuid`, async () => {
        const response = await rtuExportLogsTestClient.get(`doesNotExist`);
        assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      });

      it(`should return notFoundError when given rtu Export log do not exists`, async () => {
        const response = await rtuExportLogsTestClient.get(`0a0a0a0a0a0a0a0a0a0a0a0a`);
        assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
      });
    });
  });
});
