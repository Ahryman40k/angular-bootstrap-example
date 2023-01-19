import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { destroyDBTests, removeEmpty } from '../../../../../tests/utils/testHelper';
import { bicImportLogMapperDTO } from '../../mappers/bicImportLogMapperDTO';
import { BicImportLog } from '../../models/bicImportLog';
import { bicImportLogRepository } from '../../mongo/bicImportLogRepository';
import { bicImportLogsTestClient } from '../bicImportLogTestClient';
import { getBicImportLogFromNSecondsAgo } from '../bicImportLogTestHelper';

// tslint:disable:max-func-body-length
describe('SearchBicImportLogsTestController', () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/v1/imports/bicImportLogs - GET', () => {
    let bicImportLogOldest: BicImportLog;
    let bicImportLogOlder: BicImportLog;
    let bicImportLogOld: BicImportLog;
    let expected: IBicImportLog[];
    beforeEach(async () => {
      bicImportLogOldest = getBicImportLogFromNSecondsAgo(3);
      bicImportLogOlder = getBicImportLogFromNSecondsAgo(2);
      bicImportLogOld = getBicImportLogFromNSecondsAgo(1);

      for (const bicImport of [bicImportLogOldest, bicImportLogOlder, bicImportLogOld]) {
        await bicImportLogRepository.save(bicImport);
      }
      expected = [
        await bicImportLogMapperDTO.getFromModel(bicImportLogOldest),
        await bicImportLogMapperDTO.getFromModel(bicImportLogOlder),
        await bicImportLogMapperDTO.getFromModel(bicImportLogOld)
      ];
    });

    [
      {
        description: 'sort by createdAt DESC',
        orderBy: '-createdAt',
        expectedIndex: 2
      },
      {
        description: 'sort by createdAt ASC',
        orderBy: '+createdAt',
        expectedIndex: 0
      }
    ].forEach(test => {
      it(`should find bic import logs according to ${test.description}`, async () => {
        const response = await bicImportLogsTestClient.search(`orderBy=${test.orderBy}&limit=1`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const bicImportLogs: IBicImportLog[] = response.body.items;
        assert.strictEqual(response.body.paging.totalCount, 3);
        assert.strictEqual(response.body.items.length, 1);
        assert.deepEqual(bicImportLogs[0], removeEmpty(expected[test.expectedIndex]));
      });
    });
  });
});
