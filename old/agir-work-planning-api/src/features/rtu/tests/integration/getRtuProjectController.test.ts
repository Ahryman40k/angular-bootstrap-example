import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { rtuProjectsTestClient } from '../../../../../tests/utils/testClients/rtuProjectsTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { rtuProjectMapperDTO } from '../../mappers/rtuProjectMapperDTO';
import { rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { assertDtoRtuProject, getRtuProject } from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`GetRtuProjectController`, () => {
  after(() => {
    userMocker.reset();
  });
  before(() => {
    userMocker.mock(userMocks.pilot);
  });

  describe('/v1/rtuProjects/{id} - GET', () => {
    const rtuProject = getRtuProject();
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await rtuProjectRepository.save(rtuProject);
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    it('should return rtu project by id', async () => {
      const response = await rtuProjectsTestClient.get(rtuProject.id.toString());
      assert.strictEqual(response.status, HttpStatusCodes.OK);

      const existingRtuProjectDto = await rtuProjectMapperDTO.getFromModel(rtuProject);
      const rtuProjectFound = response.body;
      assertDtoRtuProject(rtuProjectFound, existingRtuProjectDto);
    });
  });
});
