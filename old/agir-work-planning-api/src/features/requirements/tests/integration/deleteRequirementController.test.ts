import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import { constants, EndpointTypes } from '../../../../../config/constants';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { Requirement } from '../../models/requirement';
import { RequirementFindOptions } from '../../models/requirementFindOptions';
import { requirementRepository } from '../../mongo/requirementRepository';
import { getRequirement } from '../requirementTestHelper';

describe('Delete requirement controller', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.REQUIREMENTS, EndpointTypes.API);
  let requirement: Requirement;

  beforeEach(async () => {
    requirement = (await requirementRepository.save(await getRequirement())).getValue();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/requirement > DELETE', () => {
    it(`Positive - Should delete a requirement`, async () => {
      const allRequirementsBefore = await requirementRepository.findAll(
        RequirementFindOptions.create({ criterias: {} }).getValue()
      );

      const response = await requestService.delete(`${apiUrl}/${requirement.id}`);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);

      const allRequirementsAfter = await requirementRepository.findAll(
        RequirementFindOptions.create({ criterias: {} }).getValue()
      );

      assert.strictEqual(allRequirementsBefore.length, allRequirementsAfter.length + 1);

      const requirementFromDatabase = await requirementRepository.findById(requirement.id);

      assert.isNull(requirementFromDatabase);
    });

    [
      {
        description: 'partnerProjectConsultation',
        user: userMocks.partnerProjectConsultation
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} ask to delete a requirement`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.delete(`${apiUrl}/${requirement.id}`);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
