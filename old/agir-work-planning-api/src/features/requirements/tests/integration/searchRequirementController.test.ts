import { RequirementTargetType } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { getMinimalInitialIntervention } from '../../../../../tests/data/interventionData';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { createIntervention } from '../../../interventions/tests/interventionTestHelper';
import { IRequirementFindPaginatedOptionsProps } from '../../models/requirementFindPaginatedOptions';
import { requirementRepository } from '../../mongo/requirementRepository';
import { getRequirement } from '../requirementTestHelper';

describe('Search requirement controller', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.REQUIREMENTS, EndpointTypes.API);
  let searchRequirementQuery: IRequirementFindPaginatedOptionsProps;

  beforeEach(async () => {
    const intervention = await createIntervention(getMinimalInitialIntervention());
    await requirementRepository.save(
      await getRequirement({
        items: [
          {
            type: RequirementTargetType.intervention,
            id: intervention.id
          }
        ]
      })
    );
    searchRequirementQuery = {
      criterias: {},
      limit: constants.PaginationDefaults.LIMIT,
      offset: constants.PaginationDefaults.OFFSET
    };
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/requirement > GET', () => {
    it(`Positive - Should get a requirement`, async () => {
      const response = await requestService.get(apiUrl, {}, searchRequirementQuery);

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.property(response.body, 'paging');
      assert.property(response.body, 'items');
      const items = response.body.items[0];
      assert.property(items, 'id');
      assert.property(items, 'audit');
      assert.property(items, 'typeId');
      assert.property(items, 'subtypeId');
      assert.property(items, 'text');
      assert.property(items, 'items');
    });

    [
      {
        description: 'partnerProjectConsultation',
        user: userMocks.partnerProjectConsultation
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} ask to get requirements`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.get(apiUrl, {}, searchRequirementQuery);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
