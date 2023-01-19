import {
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { readdirSync } from 'fs-extra';
import * as path from 'path';
import sinon = require('sinon');

import { userMocks } from '../../../../../tests/data/userMocks';
import { spatialAnalysisServiceStub } from '../../../../../tests/utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import {
  assertAnnualPrograms,
  assertInterventions,
  assertProjects,
  assertRequirements,
  assertResults,
  readFile,
  setTestApp
} from '../../../../shared/largeTest/largeTestHelper';
import { Result } from '../../../../shared/logic/result';
import { getFeature } from '../../../asset/tests/assetTestHelper';
import { counterRepository } from '../../../counters/mongo/counterRepository';
import { InterventionRequestType } from '../../../interventions/tests/large/interventionsLargeTestHelper';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import {
  doProjectRequest,
  getProjectSuccessHttpStatusResponse,
  ILargeTestScenarioStep,
  ProjectRequestType
} from './projectsLargeTestHelper';

const sandbox = sinon.createSandbox();

const testScenarios: ILargeTestScenarioStep[][] = [
  [
    {
      folder: '1-addNonGeolocatedProject',
      requestType: ProjectRequestType.CREATE_PROJECT
    },
    {
      folder: '2-getProjectById',
      requestType: ProjectRequestType.GET_PROJECT_BY_ID,
      projectId: 'P00002'
    },
    {
      folder: '3-updateProject',
      requestType: ProjectRequestType.UPDATE_PROJECT,
      projectId: 'P00002'
    },
    {
      folder: '4-addComment',
      requestType: ProjectRequestType.ADD_COMMENT_TO_PROJECT,
      projectId: 'P00002'
    },
    {
      folder: '5-getComments',
      requestType: ProjectRequestType.GET_PROJECT_COMMENTS,
      projectId: 'P00002'
    },
    {
      folder: '6-updateComment',
      requestType: ProjectRequestType.UPDATE_PROJECT_COMMENT,
      projectId: 'P00002'
    },
    {
      folder: '7-deleteComment',
      requestType: ProjectRequestType.DELETE_PROJECT_COMMENT,
      projectId: 'P00002'
    },
    {
      folder: '8-updateAnnualDistribution',
      requestType: ProjectRequestType.UPDATE_PROJECT_ANNUAL_DISTRIBUTION,
      projectId: 'P00002'
    },
    {
      folder: '9-rescheduleProject',
      requestType: ProjectRequestType.ADD_DECISION_TO_PROJECT,
      projectId: 'P00002'
    },
    {
      folder: '10-postponeProject',
      requestType: ProjectRequestType.ADD_DECISION_TO_PROJECT,
      projectId: 'P00002',
      expectedHttpStatus: 422
    },
    {
      folder: '11-cancelProject',
      requestType: ProjectRequestType.ADD_DECISION_TO_PROJECT,
      projectId: 'P00002'
    },
    {
      folder: '12-getDecisions',
      requestType: ProjectRequestType.GET_PROJECT_DECISIONS,
      projectId: 'P00002'
    }
  ],
  [
    {
      folder: '2-addInterventionWithoutProgram',
      requestType: InterventionRequestType.CREATE_INTERVENTION
    },
    {
      folder: '13-addGeolocatedProject',
      requestType: ProjectRequestType.CREATE_PROJECT
    },
    {
      folder: '17-updateAnnualDistribution',
      requestType: InterventionRequestType.UPDATE_INTERVENTION_ANNUAL_DISTRIBUTION,
      interventionId: 'I00002'
    }
  ]
];

describe(`Projects large tests`, () => {
  before(async () => {
    await setTestApp();
  });

  beforeEach(() => {
    // reset taxonomies cache
    taxonomyService.reset();
    counterRepository.resetTestingModeSequence();
    spatialAnalysisServiceStub.init(sandbox);
    const featureMock = getFeature({
      properties: {
        id: 'R145'
      }
    });
    sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));
    userMocker.mock(userMocks.admin);
  });

  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
    userMocker.reset();
  });

  describe(`Positive`, () => {
    const baseDatasTestsPath = path.resolve(__dirname, 'datas');

    testScenarios.forEach(scenario => {
      it(`should run test scenario ${scenario[scenario.length - 1].folder}`, async () => {
        let objectId: any;
        for (const step of scenario) {
          let currentFolderPath = path.resolve(baseDatasTestsPath, step.folder);
          let inputData: any;
          let expectedProjectResults: IEnrichedProject[];
          let expectedInterventionResults: IEnrichedIntervention[];
          let expectedRequirementResults: IRequirement[];
          let expectedAnnualProgramResults: IEnrichedAnnualProgram[];
          let expectedOutputData: any;

          if (Object.values(InterventionRequestType).includes(step.requestType as InterventionRequestType)) {
            currentFolderPath = currentFolderPath.replace('projects', 'interventions');
          }

          // Set datas files
          readdirSync(currentFolderPath).forEach(file => {
            if (file.includes('input')) {
              inputData = readFile(file, currentFolderPath);
            } else if (file.includes('projects')) {
              expectedProjectResults = readFile(file, currentFolderPath);
            } else if (file.includes('interventions')) {
              expectedInterventionResults = readFile(file, currentFolderPath);
            } else if (file.includes('requirements')) {
              expectedRequirementResults = readFile(file, currentFolderPath);
            } else if (file.includes('annualPrograms')) {
              expectedAnnualProgramResults = readFile(file, currentFolderPath);
            } else if (file.includes('output')) {
              expectedOutputData = readFile(file, currentFolderPath);
            }
          });

          const response = await doProjectRequest(
            step.requestType,
            inputData,
            step.projectId,
            step.interventionId,
            objectId
          );

          const expectedHttpStatus = step.expectedHttpStatus
            ? step.expectedHttpStatus
            : getProjectSuccessHttpStatusResponse(step.requestType);
          assert.equal(response.status, expectedHttpStatus, `should be ${expectedHttpStatus}`);

          // Check this response body
          assertResults<any>([response.body], [expectedOutputData], 'Response body');

          // Check the projects
          await assertProjects(expectedProjectResults);

          // Check the interventions
          await assertInterventions(expectedInterventionResults);

          // Check the requirements
          await assertRequirements(expectedRequirementResults);

          // Check the annual programs
          await assertAnnualPrograms(expectedAnnualProgramResults);

          if (step.requestType === ProjectRequestType.ADD_COMMENT_TO_PROJECT) {
            objectId = response.body.id;
          }
        }
      });
    });
  });
});
