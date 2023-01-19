import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { assertAudit } from '../../../audit/test/auditTestHelper';
import { createBicImportLogUseCase } from '../../useCases/createBicImportLog/createBicImportLogUseCase';

describe(`CreateBicImportLogUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  it(`should create BicImportLog`, async () => {
    const result = await createBicImportLogUseCase.execute();
    assert.isTrue(result.isRight());
    const createdBicImportLog: IBicImportLog = result.value.getValue() as IBicImportLog;
    assert.isDefined(createdBicImportLog.id);
    assertAudit(createdBicImportLog.audit);
  });
});
