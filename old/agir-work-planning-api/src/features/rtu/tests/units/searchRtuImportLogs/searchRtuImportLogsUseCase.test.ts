import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IPaginatedResult } from '@villemontreal/core-utils-general-nodejs-lib/dist/src';
import { assert } from 'chai';
import { isEqual } from 'lodash';
import moment = require('moment');

import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { ErrorCode } from '../../../../../shared/domainErrors/errorCode';
import { appUtils } from '../../../../../utils/utils';
import { Audit } from '../../../../audit/audit';
import { RtuImportError, RtuImportTarget } from '../../../models/rtuImportError';
import { RtuImportLog, RtuImportStatus } from '../../../models/rtuImportLog';
import { RtuImportLogFindOptions } from '../../../models/rtuImportLogFindOptions';
import { IRtuImportLogsPaginatedFindOptionsProps } from '../../../models/rtuImportLogFindPaginatedOptions';
import { rtuImportLogRepository } from '../../../mongo/rtuImportLogRepository';
import { searchRtuImportLogsUseCase } from '../../../useCases/searchRtuImportLogs/searchRtuImportLogsUseCase';
import { getRtuImportLog, IRankAndLog } from '../../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`SearchRtuImportLogsUseCase`, () => {
  describe(`Positive`, () => {
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

    it(`Should return a list of import logs`, async () => {
      const allImportLogs = await rtuImportLogRepository.findAll(
        RtuImportLogFindOptions.create({
          criterias: {}
        }).getValue()
      );
      assert.strictEqual(allImportLogs.length, rtuImportLogsProps.length);

      const findOptions: IRtuImportLogsPaginatedFindOptionsProps = {
        criterias: {},
        limit: 100,
        offset: 0
      };
      const result = await searchRtuImportLogsUseCase.execute(findOptions);
      assert.isTrue(result.isRight());
      const found: IRtuImportLog[] = (result.value.getValue() as IPaginatedResult<IRtuImportLog>).items;
      assert.strictEqual(found.length, rtuImportLogsProps.length);
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
        const findOptions: IRtuImportLogsPaginatedFindOptionsProps = {
          criterias: {},
          orderBy: test.orderBy,
          limit: 100,
          offset: 0
        };
        const result = await searchRtuImportLogsUseCase.execute(findOptions);
        assert.isTrue(result.isRight());
        const found: IRtuImportLog[] = (result.value.getValue() as IPaginatedResult<IRtuImportLog>).items;
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
        const findOptions: IRtuImportLogsPaginatedFindOptionsProps = {
          criterias: {},
          limit: 100,
          offset: 0,
          fields: test.fields
        };
        const result = await searchRtuImportLogsUseCase.execute(findOptions);
        assert.isTrue(result.isRight());
        const foundImportLog: IRtuImportLog[] = (result.value.getValue() as IPaginatedResult<IRtuImportLog>).items;
        for (const importLog of foundImportLog) {
          assert.exists(importLog.id);
          test.fields.forEach(field => {
            assert.exists(importLog[field], `${field} not found`);
          });
          assert.lengthOf(Object.keys(importLog), test.fields.length + 1);
        }
      });
    });
  });
});
