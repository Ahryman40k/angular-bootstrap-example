import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../../../../tests/data/userMocks';
import { opportunityNoticesTestClient } from '../../../../../tests/utils/testClients/opportunityNoticesTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { getInitialAsset } from '../../../asset/tests/assetTestHelper';
import { opportunityNoticeResponseMapperDTO } from '../../mappers/opportunityNoticeResponseMapperDTO';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import {
  assertOpportunityNotice,
  assertOpportunityNoticeResponse,
  getOpportunityNoticeProps,
  getOpportunityNoticeResponse,
  getPlainOpportunityNoticeProps,
  getPlainOpportunityNoticeResponse
} from '../opportunityNoticeTestHelper';

const CURRENT_YEAR = appUtils.getCurrentYear();
const CURRENT_YEAR_PLUS_FOUR = appUtils.getCurrentYear() + 4;
const NEW_OBJECT_TEST = 'new object test';

// tslint:disable:max-func-body-length
describe('UpdateOpportunityNoticeTestController', () => {
  beforeEach(() => {
    userMocker.mock(userMocks.planner);
  });

  describe('/v1/opportunityNotices - PUT', () => {
    const writeAllowedRoles = normalizeUsernames([userMocks.admin, userMocks.pilot, userMocks.planner]);
    let project: IEnrichedProject;
    let opportunityNotice: OpportunityNotice;
    beforeEach(async () => {
      project = await projectDataGenerator.store({
        startYear: CURRENT_YEAR,
        endYear: CURRENT_YEAR_PLUS_FOUR
      });
      const minimalPlain = getOpportunityNoticeProps({ projectId: project.id });
      opportunityNotice = (
        await opportunityNoticeRepository.save(
          OpportunityNotice.create({ ...minimalPlain, status: OpportunityNoticeStatus.new }).getValue()
        )
      ).getValue();
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    it('Positive - Should update opportunity notice with its required informations', async () => {
      const newPlain = getPlainOpportunityNoticeProps({
        projectId: project.id,
        object: NEW_OBJECT_TEST
      });
      const response = await opportunityNoticesTestClient.update(opportunityNotice.id, newPlain);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNoticeResponse: IEnrichedOpportunityNotice = response.body;
      assertOpportunityNotice(opportunityNoticeResponse, getOpportunityNoticeProps(newPlain));
    });

    it('Positive - Should update opportunity notice with a response', async () => {
      const newPlain = getPlainOpportunityNoticeProps({
        projectId: project.id,
        object: NEW_OBJECT_TEST,
        response: getPlainOpportunityNoticeResponse()
      });
      const response = await opportunityNoticesTestClient.update(opportunityNotice.id, newPlain);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNoticeResponse: IEnrichedOpportunityNotice = response.body;
      assertOpportunityNotice(opportunityNoticeResponse, getOpportunityNoticeProps(newPlain));
      const expectedResponse = await opportunityNoticeResponseMapperDTO.getFromModel(getOpportunityNoticeResponse());
      assertOpportunityNoticeResponse(opportunityNoticeResponse.response, expectedResponse);
    });

    it('Negative - Should not create opportunity notice when the user does not have the authorizations', async () => {
      const newPlain = getPlainOpportunityNoticeProps({ projectId: project.id, object: NEW_OBJECT_TEST });
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        userMocker.mock(role);
        const response = await opportunityNoticesTestClient.update(opportunityNotice.id, newPlain);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });

    it('Negative - Should not update opportunity notice when assets list was changed', async () => {
      const newPlain = getPlainOpportunityNoticeProps({
        projectId: project.id,
        object: NEW_OBJECT_TEST,
        assets: [getInitialAsset(), getInitialAsset()]
      });
      const response = await opportunityNoticesTestClient.update(opportunityNotice.id, newPlain);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });
});
