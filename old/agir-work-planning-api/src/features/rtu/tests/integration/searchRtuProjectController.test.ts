import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IRtuProject, ProjectStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { userMocks } from '../../../../../tests/data/userMocks';
import { rtuProjectsTestClient } from '../../../../../tests/utils/testClients/rtuProjectsTestClient';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { Audit } from '../../../audit/audit';
import { rtuProjectMapperDTO } from '../../mappers/rtuProjectMapperDTO';
import { RtuProject } from '../../models/rtuProject';
import { rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { assertDtoRtuProject, getRtuProject } from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`SearchRtuProjectController`, () => {
  const rtuProjects: RtuProject[] = [];
  after(async () => {
    userMocker.reset();
    await destroyDBTests();
  });
  before(async () => {
    userMocker.mock(userMocks.pilot);

    const rtuProjectsProps = [
      {
        id: '1',
        name: 'project1',
        status: ProjectStatus.programmed
      },
      {
        id: '2',
        name: 'project2',
        status: ProjectStatus.canceled
      },
      {
        id: '3',
        name: 'project3',
        status: ProjectStatus.replanned
      }
    ];

    for (const props of rtuProjectsProps) {
      const rtuProject = await rtuProjectRepository.save(
        getRtuProject(
          {
            ...props,
            audit: Audit.fromCreateContext()
          },
          props.id
        )
      );
      // Delay 1 ms in creation to make sure audit are differents
      await appUtils.delay(1);
      rtuProjects.push(rtuProject.getValue());
    }
  });

  describe('/v1/rtuProjects - GET', () => {
    it('should return a paginated list of rtu projects', async () => {
      const response = await rtuProjectsTestClient.search('orderBy=startDateTime');
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, rtuProjects.length);

      const rtuProjectsFound = response.body.items;
      for (let i = 0; i < rtuProjects.length; i++) {
        const existingRtuProject: IRtuProject = await rtuProjectMapperDTO.getFromModel(rtuProjects[i]);
        assertDtoRtuProject(rtuProjectsFound[i], existingRtuProject);
      }
    });
  });

  describe('/v1/rtuProjects/search - POST', () => {
    it('should return a paginated list of rtu projects', async () => {
      const response = await rtuProjectsTestClient.searchPost({
        orderBy: 'startDateTime'
      });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, rtuProjects.length);

      const rtuProjectsFound = response.body.items;
      for (let i = 0; i < rtuProjects.length; i++) {
        const existingRtuProject: IRtuProject = await rtuProjectMapperDTO.getFromModel(rtuProjects[i]);
        assertDtoRtuProject(rtuProjectsFound[i], existingRtuProject);
      }
    });
  });
});
