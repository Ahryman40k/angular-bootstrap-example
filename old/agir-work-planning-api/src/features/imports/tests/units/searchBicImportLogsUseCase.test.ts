import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { IPaginatedResult } from '../../../../utils/utils';
import { bicImportLogMapperDTO } from '../../mappers/bicImportLogMapperDTO';
import { BicImportLog } from '../../models/bicImportLog';
import { bicImportLogRepository } from '../../mongo/bicImportLogRepository';
import { searchBicImportLogsUseCase } from '../../useCases/searchBicImportLogs/searchBicImportLogsUseCase';
import { getBicImportLogFromNSecondsAgo } from '../bicImportLogTestHelper';

describe(`SearchBicImportLogUseCase`, () => {
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

  afterEach(async () => {
    await destroyDBTests();
  });

  [
    {
      description: 'sort by createdAt DESC',
      orderBy: '-createdAt',
      expectedOrderIndex: [2, 1]
    },
    {
      description: 'sort by createdAt ASC',
      orderBy: '+createdAt',
      expectedOrderIndex: [0, 1]
    }
  ].forEach(test => {
    it(`should return expected paginated BicImportLogs when ${test.description} `, async () => {
      const limit = 2;
      const result = await searchBicImportLogsUseCase.execute({
        orderBy: test.orderBy,
        offset: 0,
        limit
      });
      assert.isTrue(result.isRight());
      const createdBicImportLogsPaginated: IPaginatedResult<IBicImportLog> = result.value.getValue() as IPaginatedResult<
        IBicImportLog
      >;
      assert.strictEqual(createdBicImportLogsPaginated.paging.totalCount, 3);
      assert.strictEqual(createdBicImportLogsPaginated.items.length, limit);
      assert.deepEqual(createdBicImportLogsPaginated.items[0], expected[test.expectedOrderIndex[0]]);
      assert.deepEqual(createdBicImportLogsPaginated.items[1], expected[test.expectedOrderIndex[1]]);
    });
  });
});
