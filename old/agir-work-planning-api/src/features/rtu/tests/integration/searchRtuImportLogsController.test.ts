import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isEqual } from 'lodash';
import moment = require('moment');

import { userMocks } from '../../../../../tests/data/userMocks';
import { rtuImportLogsTestClient } from '../../../../../tests/utils/testClients/rtuImportLogsTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { appUtils } from '../../../../utils/utils';
import { Audit } from '../../../audit/audit';
import { RtuImportError, RtuImportTarget } from '../../models/rtuImportError';
import { RtuImportLog, RtuImportStatus } from '../../models/rtuImportLog';
import { rtuImportLogRepository } from '../../mongo/rtuImportLogRepository';
import { getRtuImportLog, IRankAndLog } from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe('SearchRtuImportLogsTestController', () => {
  afterEach(() => {
    userMocker.reset();
  });
  beforeEach(() => {
    userMocker.mock(userMocks.pilot);
  });

  describe('/v1/rtuImportLogs - GET', () => {
    const rtuImportLogs: RtuImportLog[] = [];
    let rtuImportLogsProps: IRankAndLog[];
    before(async () => {
      const startDate = moment();
      const endDate = moment();

      rtuImportLogsProps = [
        {
          rank: 0,
          log: {
            startDateTime: moment(startDate).toDate(),
            endDateTime: moment(endDate).toDate()
          }
        },
        {
          rank: 1,
          log: {
            startDateTime: moment(startDate)
              .add(1, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(1, 'd')
              .toDate()
          }
        },
        {
          rank: 2,
          log: {
            startDateTime: moment(startDate)
              .add(9, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(9, 'd')
              .toDate()
          }
        },
        {
          rank: 3,
          log: {
            startDateTime: moment(startDate)
              .add(2, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(2, 'd')
              .toDate()
          }
        },
        {
          rank: 4,
          log: {
            startDateTime: moment(startDate)
              .add(7, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(7, 'd')
              .toDate()
          }
        },
        {
          rank: 5,
          log: {
            startDateTime: moment(startDate)
              .add(4, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(4, 'd')
              .toDate()
          }
        },
        {
          rank: 6,
          log: {
            startDateTime: moment(startDate)
              .add(3, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(3, 'd')
              .toDate()
          }
        },
        {
          rank: 7,
          log: {
            startDateTime: moment(startDate)
              .add(5, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(5, 'd')
              .toDate()
          }
        },
        {
          rank: 8,
          log: {
            startDateTime: moment(startDate)
              .add(6, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(6, 'd')
              .toDate()
          }
        },
        {
          rank: 9,
          log: {
            status: RtuImportStatus.FAILURE,
            startDateTime: moment(startDate)
              .add(8, 'd')
              .toDate(),
            endDateTime: moment(endDate)
              .add(8, 'd')
              .toDate(),
            errorDetail: RtuImportError.create({
              code: ErrorCode.FORBIDDEN as string,
              target: RtuImportTarget.SESSION as string
            }).getValue()
          }
        }
      ];
      for (const rtuImportLogProps of rtuImportLogsProps) {
        const savedRtuImport = await rtuImportLogRepository.save(
          getRtuImportLog({
            ...rtuImportLogProps.log,
            audit: Audit.fromCreateContext()
          })
        );
        // Delay 1 ms in creation to make sure audit are differents
        await appUtils.delay(1);
        rtuImportLogs.push(savedRtuImport.getValue());
      }
    });

    after(async () => {
      await destroyDBTests();
    });

    it('Positive - Should return a list of import logs', async () => {
      const response = await rtuImportLogsTestClient.search('');
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, rtuImportLogs.length);
    });

    [
      {
        description: 'Should order by startDateTime as mentionned in the orderby request parameter',
        orderBy: 'startDateTime',
        expectedOrder: [0, 1, 3, 6, 5, 7, 8, 4, 9, 2]
      },
      {
        description:
          'Should order import logs by startDateTime in reverse order as mentionned in the orderby request parameter',
        orderBy: '-startDateTime',
        expectedOrder: [2, 9, 4, 8, 7, 5, 6, 3, 1, 0]
      },
      {
        description: 'Should order import logs by endDateTime as mentionned in the orderby request parameter',
        orderBy: 'endDateTime',
        expectedOrder: [0, 1, 3, 6, 5, 7, 8, 4, 9, 2]
      },
      {
        description: 'Should order import logs by status as mentionned in the orderby request parameter',
        orderBy: 'status',
        expectedOrder: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      }
    ].forEach(test => {
      it(test.description, async () => {
        const response = await rtuImportLogsTestClient.search(`orderBy=${test.orderBy}`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const found: IRtuImportLog[] = response.body.items;
        assert.isTrue(
          isEqual(
            found.map(item => item.id),
            test.expectedOrder.map(rank => rtuImportLogs[rank].id)
          )
        );
      });
    });

    [
      {
        description: 'Should only return the status field as mentionned in fields request parameters',
        fields: ['status']
      },
      {
        description: 'Should only return status and errorDetail as mentionned in fields request parameters',
        fields: ['status', 'errorDetail']
      },
      {
        description: 'Should only return startDateTime as mentionned in fields request parameters',
        fields: ['startDateTime']
      },
      {
        description: 'Should only return endDateTime as mentionned in fields request parameters',
        fields: ['endDateTime']
      }
    ].forEach(test => {
      it(test.description, async () => {
        const response = await rtuImportLogsTestClient.search(`fields=${test.fields.join(',')}`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const foundImportLog: IRtuImportLog[] = response.body.items;
        for (const importLog of foundImportLog) {
          assert.exists(importLog.id);
          test.fields.forEach(field => {
            // API returns a generated error description with a different name
            const fieldToCheck = field === 'errorDetail' ? 'errorDescription' : field;
            assert.exists(importLog[fieldToCheck], `${fieldToCheck} not found`);
          });
          assert.lengthOf(Object.keys(importLog), test.fields.length + 1);
        }
      });
    });
  });
});
