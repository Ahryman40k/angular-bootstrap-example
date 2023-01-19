import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  ICountBy,
  IEnrichedIntervention,
  IInterventionCountBySearchRequest,
  InterventionStatus,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { EXECUTOR_BOROUGH, EXECUTOR_OTHER } from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { createInterventionModel } from '../../data/interventionData';
import { createMockProject } from '../../data/projectData';
import { requestService } from '../../utils/requestService';
import { createMany, destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

// tslint:disable-next-line:max-func-body-length
describe('Intervention controller (Count By)', () => {
  const apiUrlInterventions: string = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );

  after(async () => {
    await integrationAfter();
  });

  async function createInterventions(): Promise<void> {
    const interventionsToCreate: IEnrichedIntervention[] = [
      createInterventionModel({ boroughId: 'VRD', planificationYear: 2017, status: InterventionStatus.waiting }),
      createInterventionModel({ boroughId: 'VRD', planificationYear: 2017, status: InterventionStatus.waiting }),
      createInterventionModel({ boroughId: 'VRD', planificationYear: 2021, status: InterventionStatus.waiting }),
      createInterventionModel({ boroughId: 'VRD', planificationYear: 2020, status: InterventionStatus.waiting }),
      createInterventionModel({ boroughId: 'VRD', planificationYear: 2017, executorId: EXECUTOR_BOROUGH }),
      createInterventionModel({ boroughId: 'VRD', planificationYear: 2017, executorId: EXECUTOR_BOROUGH }),
      createInterventionModel({ boroughId: 'PMR', planificationYear: 2021 }),
      createInterventionModel({ boroughId: 'PMR', planificationYear: 2017 }),
      createInterventionModel({ boroughId: 'ANJ', planificationYear: 2020, status: InterventionStatus.waiting }),
      createInterventionModel({ boroughId: 'ANJ', planificationYear: 2017 }),
      createInterventionModel({ boroughId: 'ANJ', planificationYear: 2021, status: InterventionStatus.waiting }),
      createInterventionModel({ boroughId: 'ANJ', planificationYear: 2022, status: InterventionStatus.waiting }),
      createInterventionModel({
        boroughId: 'PMR',
        planificationYear: 2018,
        status: InterventionStatus.waiting,
        workTypeId: 'construction'
      }),
      createInterventionModel({
        boroughId: 'PMR',
        planificationYear: 2021,
        status: InterventionStatus.waiting,
        workTypeId: 'construction'
      }),
      createInterventionModel({
        boroughId: 'ANJ',
        planificationYear: 2019,
        status: InterventionStatus.waiting,
        workTypeId: 'construction'
      }),
      createInterventionModel({ boroughId: 'CDNNDG', planificationYear: 2022 }),
      createInterventionModel({ boroughId: 'CDNNDG', planificationYear: 2020 })
    ];
    const interventions = await createMany(interventionsToCreate, interventionRepository);
    const project = await createMockProject({ status: ProjectStatus.planned, executorId: EXECUTOR_OTHER });
    const projectDi = await createMockProject({ status: ProjectStatus.planned });
    let i = 0;
    for (const intervention of interventions) {
      if (intervention.status === InterventionStatus.integrated) {
        const projectSelected = i % 2 ? project : projectDi;
        intervention.project = { id: projectSelected.id };
      }
      i++;
      const interventionSaveResult = await interventionRepository.save(intervention);
      if (interventionSaveResult.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(interventionSaveResult)));
      }
    }
  }

  interface ICountByInterventionCase {
    request: IInterventionCountBySearchRequest;
    response: ICountBy[];
  }

  function getCountByInterventionCases(): ICountByInterventionCase[] {
    return [
      {
        request: { countBy: 'boroughId' },
        response: [
          { id: 'ANJ', count: 5 },
          { id: 'CDNNDG', count: 2 },
          { id: 'PMR', count: 4 },
          { id: 'VRD', count: 6 }
        ]
      },
      {
        request: { countBy: 'boroughId', fromPlanificationYear: 2020 },
        response: [
          { id: 'ANJ', count: 3 },
          { id: 'CDNNDG', count: 2 },
          { id: 'PMR', count: 2 },
          { id: 'VRD', count: 2 }
        ]
      },
      {
        request: { countBy: 'planificationYear', status: InterventionStatus.waiting },
        response: [
          { count: 2, id: 2017 },
          { count: 1, id: 2018 },
          { count: 1, id: 2019 },
          { count: 1, id: 2022 },
          { count: 2, id: 2020 },
          { count: 3, id: 2021 }
        ]
      },
      {
        request: {
          countBy: 'planificationYear',
          status: [InterventionStatus.waiting, InterventionStatus.integrated]
        },
        response: [
          { count: 1, id: 2018 },
          { count: 3, id: 2021 },
          { count: 1, id: 2019 },
          { count: 1, id: 2022 },
          { count: 2, id: 2017 },
          { count: 2, id: 2020 }
        ]
      },
      {
        request: { countBy: 'boroughId', executorId: EXECUTOR_BOROUGH },
        response: [{ id: 'VRD', count: 2 }]
      },
      {
        request: { countBy: 'boroughId', workTypeId: 'construction' },
        response: [
          { id: 'PMR', count: 2 },
          { id: 'ANJ', count: 1 }
        ]
      }
    ];
  }

  function getCountByInterventions(searchRequest: IInterventionCountBySearchRequest): Promise<request.Response> {
    if (Array.isArray(searchRequest.status)) {
      searchRequest.status = searchRequest.status.join(',');
    }
    return requestService.get(`${apiUrlInterventions}/countBy`, undefined, searchRequest);
  }

  function postCountByInterventions(searchRequest: IInterventionCountBySearchRequest): Promise<request.Response> {
    return requestService.post(`${apiUrlInterventions}/countBy`, { body: searchRequest });
  }

  const methods = [getCountByInterventions, postCountByInterventions];
  type CountByInterventionFunction = (searchRequest: IInterventionCountBySearchRequest) => Promise<request.Response>;
  async function testCountBy(func: (countByIntervention: CountByInterventionFunction) => Promise<void>): Promise<void> {
    for (const method of methods) {
      await func(method);
    }
  }

  beforeEach(async () => {
    await createInterventions();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  it('C58431  Negative - Should return error when searching with an invalid countBy', async () => {
    await testCountBy(async countByIntervention => {
      const req: IInterventionCountBySearchRequest = { countBy: undefined };
      const invalidCountBys: any[] = [
        undefined,
        null,
        '',
        0,
        1,
        {},
        'invalid-prop',
        ['boroughId', 'interventionTypeId']
      ];
      for (const invalidCountBy of invalidCountBys) {
        req.countBy = invalidCountBy;
        const response = await countByIntervention(req);
        assert.equal(
          response.status,
          HttpStatusCodes.BAD_REQUEST,
          `The API should not accept a count by value of: "${invalidCountBy}"`
        );
      }
    });
  });

  it('C58432  Positive - Should return the exact count of interventions', async () => {
    await testCountBy(async countByIntervention => {
      const testCases = getCountByInterventionCases();
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const response = await countByIntervention(testCase.request);
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
