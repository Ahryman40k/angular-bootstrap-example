import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  BoroughCode,
  ICountBy,
  IEnrichedProject,
  InterventionStatus,
  IProjectCountBySearchRequest,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { createEnrichedInterventionModel } from '../../../scripts/load_data/outils/interventionDataOutils';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { EXECUTOR_OTHER } from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { createEnrichedProject } from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { createMany, destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

// tslint:disable-next-line:max-func-body-length
describe('Project controller (Count By)', () => {
  const apiUrlProjects: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);

  after(async () => {
    await integrationAfter();
  });

  async function createProjects(): Promise<void> {
    const intervention1 = (
      await interventionRepository.save(
        createEnrichedInterventionModel({
          boroughId: BoroughCode.ANJ,
          status: InterventionStatus.integrated,
          estimate: { allowance: 2500 }
        })
      )
    ).getValue();
    const intervention2 = (
      await interventionRepository.save(
        createEnrichedInterventionModel({
          boroughId: BoroughCode.VRD,
          status: InterventionStatus.integrated,
          estimate: { allowance: 2550 }
        })
      )
    ).getValue();
    const intervention3 = (
      await interventionRepository.save(
        createEnrichedInterventionModel({
          boroughId: BoroughCode.VRD,
          programId: 'pcpr',
          status: InterventionStatus.integrated,
          estimate: { allowance: 1900 }
        })
      )
    ).getValue();

    const projectsTests: IEnrichedProject[] = [
      createEnrichedProject({
        boroughId: 'VRD',
        startYear: 2017,
        executorId: EXECUTOR_OTHER,
        submissionNumber: 'abcdef'
      }),
      createEnrichedProject({ boroughId: 'VRD', startYear: 2017, executorId: EXECUTOR_OTHER }),
      createEnrichedProject({
        boroughId: 'VRD',
        startYear: 2021,
        interventionIds: [intervention3.id],
        submissionNumber: 'abcdef'
      }),
      createEnrichedProject({ boroughId: 'VRD', startYear: 2020, interventionIds: [intervention2.id] }),
      createEnrichedProject({ boroughId: 'VRD', startYear: 2017 }),
      createEnrichedProject({ boroughId: 'VRD', startYear: 2017 }),
      createEnrichedProject({ boroughId: 'PMR', startYear: 2021 }),
      createEnrichedProject({ boroughId: 'PMR', startYear: 2017 }),
      createEnrichedProject({ boroughId: 'PMR', startYear: 2018, endYear: 2018, status: ProjectStatus.planned }),
      createEnrichedProject({ boroughId: 'PMR', startYear: 2018, endYear: 2019, status: ProjectStatus.planned }),
      createEnrichedProject({ boroughId: 'PMR', startYear: 2021, endYear: 2019, status: ProjectStatus.planned }),
      createEnrichedProject({
        boroughId: 'ANJ',
        startYear: 2019,
        endYear: 2020,
        status: ProjectStatus.planned,
        interventionIds: [intervention1.id]
      }),
      createEnrichedProject({
        boroughId: 'ANJ',
        startYear: 2020,
        endYear: 2020,
        status: ProjectStatus.programmed,
        submissionNumber: 'abcdef'
      }),
      createEnrichedProject({ boroughId: 'ANJ', startYear: 2020, endYear: 2020, status: ProjectStatus.programmed }),
      createEnrichedProject({ boroughId: 'ANJ', startYear: 2021, endYear: 2021, status: ProjectStatus.programmed }),
      createEnrichedProject({ boroughId: 'ANJ', startYear: 2021, endYear: 2022, status: ProjectStatus.programmed }),
      createEnrichedProject({ boroughId: 'CDNNDG', startYear: 2022, endYear: 2023, status: ProjectStatus.programmed }),
      createEnrichedProject({ boroughId: 'CDNNDG', startYear: 2022, endYear: 2023 }),
      createEnrichedProject({ boroughId: 'CDNNDG', startYear: 2020 })
    ];
    await createMany(projectsTests, projectRepository);
  }

  interface ICountByProjectCase {
    request: IProjectCountBySearchRequest;
    response: ICountBy[];
  }

  function getCountByProjectCases(): ICountByProjectCase[] {
    return [
      {
        request: { countBy: 'boroughId' },
        response: [
          { id: 'ANJ', count: 5 },
          { id: 'CDNNDG', count: 3 },
          { id: 'PMR', count: 5 },
          { id: 'VRD', count: 6 }
        ]
      },
      {
        request: { countBy: 'boroughId', fromStartYear: 2020 },
        response: [
          { id: 'ANJ', count: 4 },
          { id: 'CDNNDG', count: 3 },
          { id: 'PMR', count: 2 },
          { id: 'VRD', count: 2 }
        ]
      },
      {
        request: { countBy: 'executorId', executorId: EXECUTOR_OTHER },
        response: [{ id: EXECUTOR_OTHER, count: 2 }]
      },
      {
        request: { countBy: 'boroughId', workTypeId: 'rehabilitation' },
        response: [
          { id: 'ANJ', count: 1 },
          { id: 'VRD', count: 2 }
        ]
      },
      {
        request: { countBy: 'boroughId', submissionNumber: 'abcdef' },
        response: [
          { id: 'ANJ', count: 1 },
          { id: 'VRD', count: 2 }
        ]
      }
    ];
  }

  function getCountByProjects(searchRequest: IProjectCountBySearchRequest): Promise<request.Response> {
    return requestService.get(`${apiUrlProjects}/countBy`, undefined, searchRequest);
  }

  function postCountByProjects(searchRequest: IProjectCountBySearchRequest): Promise<request.Response> {
    return requestService.post(`${apiUrlProjects}/countBy`, { body: searchRequest });
  }

  const methods = [getCountByProjects, postCountByProjects];
  type CountByProjectFunction = (searchRequest: IProjectCountBySearchRequest) => Promise<request.Response>;
  async function testCountBy(func: (countByProject: CountByProjectFunction) => Promise<void>): Promise<void> {
    for (const method of methods) {
      await func(method);
    }
  }

  beforeEach(async () => {
    await createProjects();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  it('C58433  Negative - Should return error when searching with an invalid countBy', async () => {
    await testCountBy(async countByProject => {
      const req: IProjectCountBySearchRequest = { countBy: undefined };
      const invalidCountBys: any[] = [undefined, null, '', 0, 1, {}, 'invalid-prop', ['boroughId', 'projectTypeId']];
      for (const invalidCountBy of invalidCountBys) {
        req.countBy = invalidCountBy;
        const response = await countByProject(req);
        assert.equal(
          response.status,
          HttpStatusCodes.BAD_REQUEST,
          `The API should not accept a count by value of: "${invalidCountBy}"`
        );
      }
    });
  });

  it('C58434  Positive - Should return the exact count of projects', async () => {
    await testCountBy(async countByProject => {
      const testCases = getCountByProjectCases();
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const response = await countByProject(testCase.request);
        try {
          assert.equal(response.status, HttpStatusCodes.OK);
          const countBys: ICountBy[] = response.body;
          assert.ok(countBys);
          assert.deepEqual(
            _.orderBy(countBys, c => c.id),
            _.orderBy(testCase.response, c => c.id)
          );
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.error(`Assertion failed for test case #${i + 1}`);
          throw e;
        }
      }
    });
  });
});
