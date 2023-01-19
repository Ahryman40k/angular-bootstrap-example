import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  BoroughCode,
  IEnrichedIntervention,
  IEnrichedPaginatedProjects,
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  IProjectSearchRequest,
  MedalType,
  ProjectExternalReferenceType,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import sinon = require('sinon');

import { get } from 'lodash';
import { createEnrichedInterventionModel } from '../../../scripts/load_data/outils/interventionDataOutils';
import { getFeature } from '../../../src/features/asset/tests/assetTestHelper';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { spatialAnalysisService } from '../../../src/services/spatialAnalysisService';
import { Result } from '../../../src/shared/logic/result';
import { PROGRAM_TYPE_BUS_STOP, PROGRAM_TYPE_PCPR } from '../../../src/shared/taxonomies/constants';
import {
  createEnrichedProject,
  intersectGeometryTestData,
  invalidIntersectGeometryTestData
} from '../../data/projectData';
import { ITestClientResponse } from '../../utils/testClients/_testClientResponse';
import { projectTestClient } from '../../utils/testClients/projectTestClient';
import { createMany, destroyDBTests } from '../../utils/testHelper';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();
let featureStub: sinon.SinonStub<any>;

function stubGetFeatureByIds(propsIds?: string[]): void {
  const ids = propsIds || ['R145'];
  const stub = sandbox.stub(spatialAnalysisService, 'getFeaturesByIds');
  ids.forEach(id => {
    stub.withArgs([id], 'id', ['montreal:fire-hydrants']).resolves(
      Result.ok([
        getFeature({
          properties: {
            id
          }
        })
      ])
    );
  });

  featureStub = stub;
}

function restoreFeatureMockStubs(): void {
  featureStub.restore();
}

// tslint:disable: max-func-body-length

describe('Project controller (Search)', () => {
  let projects: IEnrichedProject[];
  let intervention1: IEnrichedIntervention;
  let intervention2: IEnrichedIntervention;

  before(() => {
    stubGetFeatureByIds();
  });

  after(async () => {
    sandbox.restore();
    await integrationAfter();
  });

  async function createInterventions(): Promise<void> {
    restoreFeatureMockStubs();
    intervention1 = await createIntervention({
      programId: PROGRAM_TYPE_PCPR
    });

    intervention2 = await createIntervention({
      programId: PROGRAM_TYPE_BUS_STOP
    });
    stubGetFeatureByIds([intervention1.assets[0].id, intervention2.assets[0].id]);
  }

  async function createIntervention(props?: Partial<IEnrichedIntervention>): Promise<IEnrichedIntervention> {
    return (
      await interventionRepository.save(
        createEnrichedInterventionModel({
          ...props
        })
      )
    ).getValue();
  }

  async function createProjects(): Promise<void> {
    const projectTests: IEnrichedProject[] = [
      createEnrichedProject({ boroughId: BoroughCode.VRD, submissionNumber: '123456', drmNumber: '1234' }),
      createEnrichedProject({ boroughId: BoroughCode.VRD, drmNumber: '5000' }),
      createEnrichedProject({
        boroughId: BoroughCode.VRD,
        externalReferenceIds: [
          {
            type: ProjectExternalReferenceType.ptiNumber,
            value: '19-VMA-PTI-043-AQ1'
          }
        ]
      }),
      createEnrichedProject({ boroughId: BoroughCode.VRD }),
      createEnrichedProject({ boroughId: BoroughCode.VRD }),
      createEnrichedProject({ boroughId: BoroughCode.VRD }),
      createEnrichedProject({ boroughId: BoroughCode.VRD }),
      createEnrichedProject({ boroughId: BoroughCode.VRD }),
      createEnrichedProject({
        startYear: 2018,
        endYear: 2018,
        status: ProjectStatus.planned,
        medalId: MedalType.bronze
      }),
      createEnrichedProject({
        startYear: 2018,
        endYear: 2019,
        status: ProjectStatus.planned,
        medalId: MedalType.bronze
      }),
      createEnrichedProject({
        startYear: 2019,
        endYear: 2019,
        status: ProjectStatus.planned,
        medalId: MedalType.silver
      }),
      createEnrichedProject({
        startYear: 2020,
        endYear: 2020,
        status: ProjectStatus.planned,
        medalId: MedalType.silver
      }),
      createEnrichedProject({
        startYear: 2020,
        endYear: 2020,
        status: ProjectStatus.programmed,
        medalId: MedalType.gold
      }),
      createEnrichedProject({
        startYear: 2020,
        endYear: 2020,
        status: ProjectStatus.programmed,
        medalId: MedalType.gold
      }),
      createEnrichedProject({
        startYear: 2021,
        endYear: 2021,
        status: ProjectStatus.programmed,
        medalId: MedalType.platinum
      }),
      createEnrichedProject({
        startYear: 2021,
        endYear: 2022,
        status: ProjectStatus.programmed,
        medalId: MedalType.platinum
      }),
      createEnrichedProject({ startYear: 2022, endYear: 2023, status: ProjectStatus.programmed }),
      createEnrichedProject({
        startYear: 2022,
        endYear: 2023,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.55685710906982, 45.497180380674244],
              [-73.55703949928284, 45.49727062440793],
              [-73.55723261833191, 45.49703749446685],
              [-73.55698585510254, 45.49699237243128],
              [-73.55685710906982, 45.497180380674244]
            ]
          ]
        }
      }),
      createEnrichedProject({}),
      createEnrichedProject({ interventionIds: [intervention1.id], submissionNumber: '987654' }),
      createEnrichedProject({ interventionIds: [intervention2.id] })
    ];
    projects = await createMany(projectTests, projectRepository);
  }

  function searchProjects(
    searchRequest: IProjectSearchRequest
  ): Promise<ITestClientResponse<IEnrichedPaginatedProjects>> {
    return projectTestClient.searchPost(searchRequest);
  }

  beforeEach(async () => {
    await createInterventions();
    await createProjects();
  });

  afterEach(async () => {
    await destroyDBTests();
  });

  it('C57781  Positive - Should return projects when searching with a string', async () => {
    const searchRequest: IProjectSearchRequest = { boroughId: 'VM' };

    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isTrue(paginatedProjects.items.every(i => i.boroughId === 'VM'));
  });

  it('C57782  Positive - Should return projects when searching with a string array', async () => {
    const statuses: string[] = [ProjectStatus.planned, ProjectStatus.programmed];
    const searchRequest: IProjectSearchRequest = {
      status: statuses
    };

    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isTrue(paginatedProjects.items.every(i => statuses.includes(i.status)));
  });

  it('C57783  Positive - Should return projects when searching with a number', async () => {
    const searchRequest: IProjectSearchRequest = {
      startYear: 2020
    };

    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isTrue(paginatedProjects.items.every(i => i.startYear === 2020));
  });

  it('C57784  Positive - Should return projects when searching with a number range', async () => {
    const searchRequest: IProjectSearchRequest = {
      fromEndYear: 2020,
      toEndYear: 2022
    };

    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isTrue(
      paginatedProjects.items.every(i => i.endYear >= searchRequest.fromEndYear && i.endYear <= searchRequest.toEndYear)
    );
  });

  it('C63535 Positive - Should return projects when searching with a list of ids', async () => {
    const searchRequest: IProjectSearchRequest = { id: [projects[0].id, projects[1].id, projects[2].id] };
    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isArray(paginatedProjects.items);
    assert.isTrue(paginatedProjects.items.every(item => searchRequest.id.includes(item.id)));
  });

  it('Positive - Should return all projects without specific ids', async () => {
    const excludeIds = [projects[0].id, projects[1].id, projects[2].id];
    const searchRequest: IProjectSearchRequest = { excludeIds };

    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isTrue(paginatedProjects.items.every(i => !excludeIds.includes(i.id)));
  });

  it('C64820  Positive - Should return projects when searching with medal IDs', async () => {
    const searchRequests: IProjectSearchRequest[] = [
      { medalId: MedalType.platinum },
      { medalId: [MedalType.platinum, MedalType.bronze] }
    ];
    for (const searchRequest of searchRequests) {
      const response = await searchProjects(searchRequest);
      const paginatedProjects = response.body as IEnrichedPaginatedProjects;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(paginatedProjects);
      assert.ok(paginatedProjects.items?.length);
      assert.isArray(paginatedProjects.items);
      assert.isTrue(paginatedProjects.items.every(item => searchRequest.medalId.includes(item.medalId)));
    }
  });

  it('Positive - Should return project when searching with intervention programId', async () => {
    const searchRequest: IProjectSearchRequest = { interventionProgramId: PROGRAM_TYPE_PCPR };
    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.equal(paginatedProjects.items?.length, 1);
    assert.isArray(paginatedProjects.items);
    paginatedProjects.items.forEach(async project => {
      const interventions = await Promise.all(project.interventionIds.map(id => interventionRepository.findById(id)));
      assert.isTrue(
        interventions.some(intervention => searchRequest.interventionProgramId.includes(intervention.programId))
      );
    });
  });

  it('Positive - Should return projects when searching with multiple intervention programIds', async () => {
    const searchRequest: IProjectSearchRequest = {
      interventionProgramId: [PROGRAM_TYPE_PCPR, PROGRAM_TYPE_BUS_STOP]
    };
    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.equal(paginatedProjects.items?.length, 2);
    assert.isArray(paginatedProjects.items);
    paginatedProjects.items.forEach(async project => {
      const interventions = await Promise.all(project.interventionIds.map(id => interventionRepository.findById(id)));
      assert.isTrue(
        interventions.some(intervention => searchRequest.interventionProgramId.includes(intervention.programId))
      );
    });
  });

  [
    {
      description: 'drmNumber with a partial drm number',
      searchQuery: '#500',
      expected: {
        path: 'drmNumber',
        value: '5000'
      }
    },
    {
      description: 'drmNumber with a full submission number',
      searchQuery: '#123456',
      expected: {
        path: 'drmNumber',
        value: '1234'
      }
    },
    {
      description: 'drmNumber with digits only',
      searchQuery: '5000',
      expected: {
        path: 'drmNumber',
        value: '5000'
      }
    },
    {
      description: 'submission number',
      searchQuery: '#123456',
      expected: {
        path: 'submissionNumber',
        value: '123456'
      }
    },
    {
      description: 'externalReferenceIds',
      searchQuery: '19-VMA-PTI-043-AQ1',
      expected: {
        path: 'externalReferenceIds[0].value',
        value: '19-VMA-PTI-043-AQ1'
      }
    }
  ].forEach(test => {
    it(`Positive - Should return project when searching with query ${test.description}`, async () => {
      const searchRequest: IProjectSearchRequest = { q: `${test.searchQuery}` };
      const response = await searchProjects(searchRequest);
      const paginatedProjects = response.body as IEnrichedPaginatedProjects;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.equal(paginatedProjects.items?.length, 1);
      assert.isArray(paginatedProjects.items);
      const projectFound = paginatedProjects.items.find(p => p);
      assert.strictEqual(get(projectFound, test.expected.path), test.expected.value);
    });
  });

  it('Positive - Should return projects when searching with submission numbers', async () => {
    const searchRequest: IProjectSearchRequest = {
      submissionNumber: ['123456', '987654']
    };
    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.equal(paginatedProjects.items?.length, 2);
    assert.isArray(paginatedProjects.items);
    assert.isTrue(
      paginatedProjects.items.every(project => searchRequest.submissionNumber.includes(project.submissionNumber))
    );
  });

  it('Positive - Should return projects when searching with intersectGeometry', async () => {
    const searchRequest: IProjectSearchRequest = {
      intersectGeometry: intersectGeometryTestData
    };
    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.isArray(paginatedProjects.items);
    assert.equal(paginatedProjects.items?.length, projects.length - 1);
  });

  it('Negative - Should return 400 status if intervention programId does not exist', async () => {
    const searchRequest: IProjectSearchRequest = { interventionProgramId: 'invalid' };
    const response = await searchProjects(searchRequest);
    assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
  });

  it('Negative - Should return an error if intersect geometry is invalid', async () => {
    const intersectGeometry = invalidIntersectGeometryTestData;
    const searchRequest: IProjectSearchRequest = { intersectGeometry };
    const response = await searchProjects(searchRequest);
    assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
  });

  it('Positive - Should expand projects is returned with its list of interventions', async () => {
    const searchRequest: IProjectPaginatedSearchRequest = { id: projects[20].id, expand: 'interventions,assets' };
    const response = await searchProjects(searchRequest);
    const paginatedProjects = response.body as IEnrichedPaginatedProjects;

    assert.strictEqual(response.status, HttpStatusCodes.OK);
    assert.ok(paginatedProjects);
    assert.ok(paginatedProjects.items?.length);
    assert.isArray(paginatedProjects.items);
    assert.isTrue(paginatedProjects.items.every(item => searchRequest.id.includes(item.id)));
    assert.isTrue(paginatedProjects.items.every(item => item.interventions.length === item.interventionIds.length));
    assert.isTrue(
      paginatedProjects.items.every(project =>
        project.interventions.every(intervention =>
          intervention.assets.every(asset => asset.properties.hasOwnProperty('installationDate'))
        )
      )
    );
  });
});
