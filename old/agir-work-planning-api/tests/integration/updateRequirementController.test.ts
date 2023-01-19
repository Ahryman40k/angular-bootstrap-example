import {
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  IRequirement,
  ProjectStatus,
  RequirementTargetType
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../config/constants';
import { interventionRepository } from '../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../src/features/projects/mongo/projectRepository';
import { requirementMapperDTO } from '../../src/features/requirements/mappers/requirementMapperDTO';
import { IPlainRequirementProps } from '../../src/features/requirements/models/plainRequirement';
import { Requirement } from '../../src/features/requirements/models/requirement';
import { RequirementFindOptions } from '../../src/features/requirements/models/requirementFindOptions';
import { requirementRepository } from '../../src/features/requirements/mongo/requirementRepository';
import { getPlainRequirementProps, getRequirement } from '../../src/features/requirements/tests/requirementTestHelper';
import { appUtils } from '../../src/utils/utils';
import { interventionDataGenerator } from '../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../data/dataGenerators/projectDataGenerator';
import { userMocks } from '../data/userMocks';
import { requestService } from '../utils/requestService';
import { destroyDBTests } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';

describe('Update requirement controller', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.REQUIREMENTS, EndpointTypes.API);
  let intervention: IEnrichedIntervention;
  let project: IEnrichedProject;
  let plainRequirementProps: IPlainRequirementProps;
  let requirement: Requirement;

  after(async () => {
    await destroyDBTests();
  });

  beforeEach(async () => {
    intervention = (
      await interventionRepository.save(
        interventionDataGenerator.createEnriched({ status: InterventionStatus.integrated })
      )
    ).getValue();
    project = (
      await projectRepository.save(projectDataGenerator.createEnriched({ status: ProjectStatus.planned }))
    ).getValue();
    requirement = (await requirementRepository.save(await getRequirement())).getValue();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/requirement > PUT', () => {
    it(`Positive - Should update a requirement`, async () => {
      const allRequirementsBefore = await requirementRepository.findAll(
        RequirementFindOptions.create({ criterias: {} }).getValue()
      );
      plainRequirementProps = await getPlainRequirementProps({
        text: 'modified text',
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

      const response = await requestService.put(`${apiUrl}/${requirement.id}`, { body: plainRequirementProps });
      const allRequirementsAfter = await requirementRepository.findAll(
        RequirementFindOptions.create({ criterias: {} }).getValue()
      );

      assert.strictEqual(allRequirementsBefore.length, allRequirementsAfter.length);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      ['id', 'audit', 'typeId', 'subtypeId', 'text', 'items'].forEach(property => {
        assert.property(response.body, property);
      });

      const requirementFromDatabase: IRequirement = await requirementMapperDTO.getFromModel(
        await requirementRepository.findById(requirement.id)
      );

      assert.notStrictEqual(response.body.text, requirement.text);
      assert.notDeepEqual(response.body.items, requirement.items);
      assert.notStrictEqual(requirementFromDatabase.text, requirement.text);
      assert.notDeepEqual(requirementFromDatabase.items, requirement.items);
    });

    [
      {
        description: 'partnerProjectConsultation',
        user: userMocks.partnerProjectConsultation
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} ask to update a requirement`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.put(`${apiUrl}/${requirement.id}`, { body: plainRequirementProps });
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
