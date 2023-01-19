import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../../../../tests/data/userMocks';
import { opportunityNoticesTestClient } from '../../../../../tests/utils/testClients/opportunityNoticesTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { db } from '../../../database/DB';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { OpportunityNoticeModel } from '../../mongo/opportunityNoticeModel';
import { assertOpportunityNotice, getPlainOpportunityNoticeProps } from '../opportunityNoticeTestHelper';

const CURRENT_YEAR = appUtils.getCurrentYear();
const CURRENT_YEAR_PLUS_FOUR = appUtils.getCurrentYear() + 4;

// tslint:disable:max-func-body-length
describe('CreateOpportunityTestController', () => {
  let opportunityNoticeModel: OpportunityNoticeModel;

  before(() => {
    opportunityNoticeModel = db().models.OpportunityNotice;
  });

  beforeEach(() => {
    userMocker.mock(userMocks.planner);
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  async function arrangeDataForPost() {
    const minimalPlain = getPlainOpportunityNoticeProps();
    const completePlain = getPlainOpportunityNoticeProps();
    const project = await projectDataGenerator.store({
      startYear: CURRENT_YEAR,
      endYear: CURRENT_YEAR_PLUS_FOUR
    });
    return {
      project,
      minimalPlain,
      completePlain
    };
  }

  async function assertDataArrangedForPost(mock: any): Promise<void> {
    const allOpportunityNotice = await opportunityNoticeModel.find().exec();
    assert.isEmpty(allOpportunityNotice);

    const mockgooseDbProject = await projectRepository.findById(mock.project.id);
    assert.deepEqual(mockgooseDbProject, mock.project, 'mockgooseDbProject is not deeply equal with mock.project');
  }

  describe('/v1/opportunityNotices - POST', () => {
    let mock: any;
    const writeAllowedRoles = normalizeUsernames([userMocks.admin, userMocks.pilot, userMocks.planner]);

    beforeEach(async () => {
      mock = await arrangeDataForPost();
    });

    it('C67724 - Positive - Should create minimal notice with its required informations', async () => {
      mock.minimalPlain.projectId = mock.project.id;
      const response = await opportunityNoticesTestClient.post(mock.minimalPlain);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const opportunityNotice: IEnrichedOpportunityNotice = response.body;
      assertOpportunityNotice(opportunityNotice, mock.minimalPlain);
    });

    it('C67726 - Negative - Should not create notice when the user does not have the authorizations', async () => {
      await assertDataArrangedForPost(mock);
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        userMocker.mock(role);
        mock.minimalPlain.projectId = mock.project.id;
        const response = await opportunityNoticesTestClient.post(mock.minimalPlain);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });
  });
});
