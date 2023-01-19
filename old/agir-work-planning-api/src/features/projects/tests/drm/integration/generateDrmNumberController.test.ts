import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IDrmProject, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { getInitialProject } from '../../../../../../tests/data/projectData';
import { userMocks } from '../../../../../../tests/data/userMocks';
import { projectTestClient } from '../../../../../../tests/utils/testClients/projectTestClient';
import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../../tests/utils/userUtils';
import { ICounter } from '../../../../counters/models/counter';
import { counterRepository } from '../../../../counters/mongo/counterRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { getInputDrmNumberProps } from '../../drmCounterTestHelper';
import { assertDrmNumbers } from '../../projectTestHelper';

// tslint:disable:max-func-body-length
describe(`GenerateDrmNumberController`, () => {
  after(() => {
    userMocker.reset();
  });
  before(() => {
    userMocker.mock(userMocks.pilot);
  });

  describe('/v1/projects/generateDrmNumber - POST', () => {
    let mockDrmCounter: ICounter;
    let mockProjects: IEnrichedProject[];
    beforeEach(async () => {
      mockDrmCounter = await counterRepository.findOne({ key: 'drm', prefix: undefined });
      mockProjects = (
        await Promise.all([getInitialProject(), getInitialProject()].map(p => projectRepository.save(p)))
      ).map(p => p.getValue());
    });
    afterEach(async () => {
      await destroyDBTests();
    });

    it('Should generate Drm numbers', async () => {
      const expectedDrmNumbers: IDrmProject[] = [
        {
          projectId: mockProjects[0].id,
          drmNumber: '5000'
        },
        {
          projectId: mockProjects[1].id,
          drmNumber: '5001'
        }
      ];
      const projectIds = mockProjects.map(p => p.id);
      const response = await projectTestClient.generateDrmNumberPost(
        getInputDrmNumberProps({
          projectIds,
          isCommonDrmNumber: false
        })
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assertDrmNumbers(response.body, expectedDrmNumbers);

      const drmCounter = await counterRepository.findOne({ key: 'drm', prefix: undefined });
      assert.strictEqual(drmCounter.sequence, parseInt(expectedDrmNumbers.map(p => p.drmNumber).pop(), 10));
      assert.isEmpty(drmCounter.availableValues);
      assert.strictEqual(drmCounter.__v, mockDrmCounter.__v + 1);
    });
  });
});
