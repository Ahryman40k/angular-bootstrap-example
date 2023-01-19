import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedOpportunityNotice, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import sinon = require('sinon');

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { opportunityNoticesTestClient } from '../../../../../tests/utils/testClients/opportunityNoticesTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { Result } from '../../../../shared/logic/result';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { appUtils } from '../../../../utils/utils';
import { getFeature } from '../../../asset/tests/assetTestHelper';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import {
  assertOpportunityNoticeExpandedAssets,
  assertOpportunityNoticesStatus,
  CONTACT_INFO,
  createOpportunityNoticesForTest,
  DAYS_AGO,
  getOpportunityNotice,
  NUMBER_OF_OPPORTUNITY_BY_PROJECT,
  NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO
} from '../opportunityNoticeTestHelper';

const sandbox = sinon.createSandbox();

let existingOpportunityNotice: OpportunityNotice;

function assertOpportunityNoticesWithProjectId(opportunityNotices: IEnrichedOpportunityNotice[], projectId: string) {
  opportunityNotices.forEach(found => {
    assert.strictEqual(found.projectId, projectId);
  });
}

// tslint:disable:max-func-body-length
describe('SearchOpportunityTestController', () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/v1/opportunityNotices - GET', () => {
    const projectProps = {
      startYear: appUtils.getCurrentYear(),
      endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
    };

    let projectWithON: IEnrichedProject;

    beforeEach(async () => {
      projectWithON = await projectDataGenerator.store(projectProps);
      await projectDataGenerator.store(projectProps);
      existingOpportunityNotice = getOpportunityNotice({
        projectId: projectWithON.id
      });
      await opportunityNoticeRepository.save(existingOpportunityNotice);
      await createOpportunityNoticesForTest({ projectId: projectWithON.id }, NUMBER_OF_OPPORTUNITY_BY_PROJECT - 1);
      await createOpportunityNoticesForTest(
        { projectId: projectWithON.id },
        NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO,
        DAYS_AGO
      );
    });

    it('should find opportunity notices according to given project id', async () => {
      const queryParams = `projectId=${projectWithON.id}`;
      const response = await opportunityNoticesTestClient.search(queryParams);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNotices: IEnrichedOpportunityNotice[] = response.body.items;
      assert.strictEqual(
        response.body.paging.totalCount,
        NUMBER_OF_OPPORTUNITY_BY_PROJECT + NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO
      );
      assertOpportunityNoticesWithProjectId(opportunityNotices, projectWithON.id);
    });

    it('should get opportunity notice created seven days ago and change it status from new to inProgress', async () => {
      const queryParams = `projectId=${projectWithON.id}`;
      const response = await opportunityNoticesTestClient.search(queryParams);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNotices: IEnrichedOpportunityNotice[] = response.body.items;
      assertOpportunityNoticesStatus(opportunityNotices, CONTACT_INFO);
    });

    describe('with expand asset', () => {
      afterEach(() => {
        sandbox.restore();
      });

      it('should find opportunity notice with expanded assets when parameter expand is "assets"', async () => {
        const featureMock = getFeature({
          properties: {
            id: existingOpportunityNotice.assets.find(a => a).id
          }
        });
        sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));

        const queryParams = `projectId=${projectWithON.id}&expand=assets`;
        const response = await opportunityNoticesTestClient.search(queryParams);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const opportunityNotices: IEnrichedOpportunityNotice[] = response.body.items;
        for (const found of opportunityNotices) {
          assertOpportunityNoticeExpandedAssets(found);
        }
      });
    });
  });
});
