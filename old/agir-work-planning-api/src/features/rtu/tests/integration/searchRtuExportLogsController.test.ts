import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isEqual } from 'lodash';
import moment = require('moment');

import { userMocks } from '../../../../../tests/data/userMocks';
import { rtuExportLogsTestClient } from '../../../../../tests/utils/testClients/rtuExportLogsTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { appUtils } from '../../../../utils/utils';
import { Audit } from '../../../audit/audit';
import { RtuExportError, RtuExportTarget } from '../../models/rtuExportError';
import { RtuExportLog, RtuExportStatus } from '../../models/rtuExportLog';
import { rtuExportLogRepository } from '../../mongo/rtuExportLogRepository';
import { getRtuExportLog } from '../rtuExportTestHelper';

// tslint:disable:max-func-body-length
describe(`SearchRtuExportLogsController`, () => {
  after(() => {
    userMocker.reset();
  });
  before(() => {
    userMocker.mock(userMocks.pilot);
  });

  describe('/v1/rtuExportLogs - GET', () => {
    const rtuExportLogs: RtuExportLog[] = [];
    let rtuExportLogsProps;
    before(async () => {
      const startDate = moment();
      const endDate = moment();

      rtuExportLogsProps = [
        {
          startDateTime: moment(startDate).toDate(),
          endDateTime: moment(endDate).toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(1, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(1, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(9, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(9, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(2, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(2, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(7, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(7, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(4, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(4, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(3, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(3, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(5, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(5, 'd')
            .toDate()
        },
        {
          startDateTime: moment(startDate)
            .add(6, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(6, 'd')
            .toDate()
        },
        {
          status: RtuExportStatus.FAILURE,
          startDateTime: moment(startDate)
            .add(8, 'd')
            .toDate(),
          endDateTime: moment(endDate)
            .add(8, 'd')
            .toDate(),
          errorDetail: RtuExportError.create({
            code: ErrorCode.FORBIDDEN as string,
            target: RtuExportTarget.SESSION as string
          }).getValue()
        }
      ];

      for (const props of rtuExportLogsProps) {
        const rtuExportLog = await rtuExportLogRepository.save(
          getRtuExportLog({
            ...props,
            audit: Audit.fromCreateContext()
          })
        );
        // Delay 1 ms in creation to make sure audit are differents
        await appUtils.delay(1);
        rtuExportLogs.push(rtuExportLog.getValue());
      }
    });

    after(async () => {
      await destroyDBTests();
    });

    it(`Should return a list of export logs`, async () => {
      const response = await rtuExportLogsTestClient.search('');
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, rtuExportLogs.length);
    });

    [
      {
        description: 'startDateTime',
        orderBy: 'startDateTime',
        expectedOrder: [0, 1, 3, 6, 5, 7, 8, 4, 9, 2]
      },
      {
        description: 'startDateTime in reverse order',
        orderBy: '-startDateTime',
        expectedOrder: [2, 9, 4, 8, 7, 5, 6, 3, 1, 0]
      },
      {
        description: 'endDateTime',
        orderBy: 'endDateTime',
        expectedOrder: [0, 1, 3, 6, 5, 7, 8, 4, 9, 2]
      },
      {
        description: 'status',
        orderBy: 'status',
        expectedOrder: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      }
    ].forEach(test => {
      it(`Should order export logs by ${test.description} as mentioned in the orderBy request parameter`, async () => {
        const response = await rtuExportLogsTestClient.search(`orderBy=${test.orderBy}`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const found: IRtuExportLog[] = response.body.items;
        assert.isTrue(
          isEqual(
            found.map(item => item.id),
            test.expectedOrder.map(rank => rtuExportLogs[rank].id)
          )
        );
      });
    });

    [
      {
        fields: ['status']
      },
      {
        fields: ['status', 'errorDetail']
      },
      {
        fields: ['startDateTime']
      },
      {
        fields: ['endDateTime']
      }
    ].forEach(test => {
      it(`Should only return ${test.fields.join(',')} as mentionned in fields request parameters`, async () => {
        const response = await rtuExportLogsTestClient.search(`fields=${test.fields.join(',')}`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const foundExportLogs: IRtuExportLog[] = response.body.items;
        for (const exportLog of foundExportLogs) {
          assert.exists(exportLog.id);
          test.fields.forEach(field => {
            // API returns a generated error description with a different name
            const fieldToCheck = field === 'errorDetail' ? 'errorDescription' : field;
            assert.exists(exportLog[fieldToCheck], `${fieldToCheck} not found`);
          });
          assert.lengthOf(Object.keys(exportLog), test.fields.length + 1);
        }
      });
    });
  });
});
