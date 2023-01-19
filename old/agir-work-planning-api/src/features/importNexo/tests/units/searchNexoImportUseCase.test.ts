import { ErrorCodes, INexoImportLog, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { assertFailures, destroyDBTests } from '../../../../../tests/utils/testHelper';
import { IGuardResult } from '../../../../shared/logic/guard';
import { enumValues } from '../../../../utils/enumUtils';
import { IPaginatedResult } from '../../../../utils/utils';
import { NexoImportLog } from '../../models/nexoImportLog';
import { INexoImportLogPaginatedFindOptionsProps } from '../../models/nexoImportSearchOptions';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { searchNexoImportUseCase } from '../../useCases/searchNexoImport/searchNexoImportUseCase';
import { getNexoImportLog } from '../nexoTestHelper';

// tslint:disable:max-func-body-length
describe(`searchNexoImportUseCase`, () => {
  let importLogs: NexoImportLog[];
  let failureImportLog: NexoImportLog;
  beforeEach(async () => {
    failureImportLog = getNexoImportLog({ status: NexoImportStatus.FAILURE });
    importLogs = [getNexoImportLog({}), failureImportLog, getNexoImportLog({}), getNexoImportLog({})];
    await nexoImportLogRepository.saveBulk(importLogs);
  });
  afterEach(async () => {
    await destroyDBTests();
  });

  [
    {
      description: 'retrieve paginated import nexo logs',
      props: { limit: 100, offset: 0, criterias: {} },
      expectedLength: 4
    },
    {
      description: 'retrieve paginated import nexo logs with a offset and a limit',
      props: { limit: 3, offset: 1, criterias: {} },
      expectedLength: 3
    },
    {
      description: 'retrieve paginated import nexo logs based on status',
      props: { limit: 100, offset: 0, criterias: { status: NexoImportStatus.FAILURE } },
      expectedLength: 1
    }
  ].forEach(test => {
    it(`should ${test.description}`, async () => {
      const result = await searchNexoImportUseCase.execute(test.props as INexoImportLogPaginatedFindOptionsProps);
      assert.isTrue(result.isRight());
      const paginatedNexoImportLog = result.value.getValue() as IPaginatedResult<INexoImportLog>;
      assert.strictEqual(paginatedNexoImportLog.items.length, test.expectedLength);
      assert.strictEqual(paginatedNexoImportLog.paging.offset, test.props.offset);
      assert.strictEqual(paginatedNexoImportLog.paging.limit, test.props.limit);
    });
  });

  it(`should return error if the status in invalid`, async () => {
    const invalidStatus = 'invalidStatus';
    const expectedErrors = [
      {
        succeeded: false,
        target: 'status',
        code: ErrorCodes.InvalidInput,
        message: `status isn't oneOf the correct values in [${enumValues(NexoImportStatus)
          .map(value => `"${value}"`)
          .join(',')}]. Got "${invalidStatus}".`
      }
    ];
    const result = await searchNexoImportUseCase.execute({
      limit: 100,
      offset: 0,
      criterias: { status: [invalidStatus] }
    });
    assert.isFalse(result.isRight());
    const failures: IGuardResult[] = (result.value as any).error.error;
    assertFailures(failures, expectedErrors);
  });
});
