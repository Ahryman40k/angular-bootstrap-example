import {
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  ProjectStatus,
  RequirementTargetType
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { interventionDataGenerator } from '../../../../../tests/data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { IPlainRequirementProps } from '../../models/plainRequirement';
import { getPlainRequirementProps } from '../requirementTestHelper';

// tslint:disable-next-line: max-func-body-length
describe('Requirement controller', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.REQUIREMENTS, EndpointTypes.API);
  let intervention: IEnrichedIntervention;
  let project: IEnrichedProject;
  let plainRequirementProps: IPlainRequirementProps;

  beforeEach(async () => {
    const interventionResult = await interventionRepository.save(
      interventionDataGenerator.createEnriched({ status: InterventionStatus.integrated })
    );
    intervention = interventionResult.getValue();
    const projectResult = await projectRepository.save(
      projectDataGenerator.createEnriched({ status: ProjectStatus.planned })
    );
    project = projectResult.getValue();
    plainRequirementProps = await getPlainRequirementProps({
      items: [
        {
          type: RequirementTargetType.intervention,
          id: intervention.id
        },
        {
          type: RequirementTargetType.project,
          id: project.id
        }
      ]
    });
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/requirement > POST', () => {
    it(`Positive - Should create a requirement`, async () => {
      const response = await requestService.post(apiUrl, { body: plainRequirementProps });

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.property(response.body, 'id');
      assert.property(response.body, 'audit');
      assert.property(response.body, 'typeId');
      assert.property(response.body, 'subtypeId');
      assert.property(response.body, 'text');
      assert.property(response.body, 'items');
    });

    [
      {
        description: 'partnerProjectConsultation',
        user: userMocks.partnerProjectConsultation
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} creating a requirement`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.post(apiUrl, { body: plainRequirementProps });
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
