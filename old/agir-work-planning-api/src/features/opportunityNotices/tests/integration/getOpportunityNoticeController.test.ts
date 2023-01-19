import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import sinon = require('sinon');

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { opportunityNoticesTestClient } from '../../../../../tests/utils/testClients/opportunityNoticesTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { assetService } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { Result } from '../../../../shared/logic/result';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { appUtils } from '../../../../utils/utils';
import { getFeature, getWorkAreaFeature } from '../../../asset/tests/assetTestHelper';
import { getAudit, getDateUnitsAgo } from '../../../audit/test/auditTestHelper';
import { opportunityNoticeMapperDTO } from '../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import {
  assertOpportunityNotice,
  assertOpportunityNoticeExpandedAssets,
  DAYS_AGO,
  getOpportunityNotice
} from '../opportunityNoticeTestHelper';

const sandbox = sinon.createSandbox();
// tslint:disable:max-func-body-length
describe('GetOpportunityTestController', () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe('/v1/opportunityNotices/:id - GET', () => {
    const projectProps = {
      startYear: appUtils.getCurrentYear(),
      endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
    };

    let projectWithON: IEnrichedProject;
    let existingOpportunityNotice: OpportunityNotice;
    beforeEach(async () => {
      projectWithON = await projectDataGenerator.store(projectProps);
      await projectDataGenerator.store(projectProps);
      existingOpportunityNotice = (
        await opportunityNoticeRepository.save(
          getOpportunityNotice({
            projectId: projectWithON.id
          })
        )
      ).getValue();
    });

    it('should get opportunity notice with given id', async () => {
      const response = await opportunityNoticesTestClient.get(existingOpportunityNotice.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNotice: IEnrichedOpportunityNotice = response.body;
      const expectedResult = await opportunityNoticeMapperDTO.getFromModel(existingOpportunityNotice);
      assertOpportunityNotice(opportunityNotice, expectedResult);
    });

    it('should get opportunity notice created seven days ago and change it status from new to inProgress', async () => {
      const opportunityNoticeCreatedSevenDaysOld = getOpportunityNotice({
        projectId: projectWithON.id,
        audit: getAudit({ createdAt: getDateUnitsAgo(DAYS_AGO, TimeUnits.DAY) })
      });
      await opportunityNoticeRepository.save(opportunityNoticeCreatedSevenDaysOld);

      const response = await opportunityNoticesTestClient.get(opportunityNoticeCreatedSevenDaysOld.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNotice: IEnrichedOpportunityNotice = response.body;
      assert.strictEqual(opportunityNotice.status, OpportunityNoticeStatus.inProgress);
    });

    it('Negative - should get opportunity notice created less than seven days ago and do not change it status', async () => {
      const opportunityNoticeCreatedSixDaysOld = getOpportunityNotice({
        projectId: projectWithON.id,
        audit: getAudit({ createdAt: getDateUnitsAgo(6, TimeUnits.DAY) })
      });
      await opportunityNoticeRepository.save(opportunityNoticeCreatedSixDaysOld);

      const response = await opportunityNoticesTestClient.get(opportunityNoticeCreatedSixDaysOld.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const opportunityNotice: IEnrichedOpportunityNotice = response.body;
      assert.strictEqual(opportunityNotice.status, OpportunityNoticeStatus.new);
    });

    describe('with expand asset', () => {
      afterEach(() => {
        sandbox.restore();
      });

      it('should get opportunity notice with expanded assets when parameter expand is "assets"', async () => {
        const featureMock = getFeature({
          properties: {
            id: existingOpportunityNotice.assets.find(a => a).id
          }
        });
        sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));
        sandbox.stub(assetService, 'getWorkArea').resolves(getWorkAreaFeature());

        const response = await opportunityNoticesTestClient.get(existingOpportunityNotice.id, 'expand=assets');
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const opportunityNotice: IEnrichedOpportunityNotice = response.body;
        assertOpportunityNoticeExpandedAssets(opportunityNotice);
      });
    });
  });
});
