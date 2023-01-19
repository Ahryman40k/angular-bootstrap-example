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
import { ProjectRequestType } from '../../../projects/tests/large/projectsLargeTestHelper';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import {
  doRequirementRequest,
  getRequirementSuccessHttpStatusResponse,
  ILargeTestScenarioStep,
  RequirementRequestType
} from './requirementsLargeTestHelper';

const sandbox = sinon.createSandbox();

const testScenarios: ILargeTestScenarioStep[][] = [
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
      folder: '1-addRequirement',
      requestType: RequirementRequestType.CREATE_REQUIREMENT
    },
    {
      folder: '2-getRequirement',
      requestType: RequirementRequestType.GET_REQUIREMENT
    },
    {
      folder: '3-updateRequirement',
      requestType: RequirementRequestType.UPDATE_REQUIREMENT
    },
    {
      folder: '4-deleteRequirement',
      requestType: RequirementRequestType.DELETE_REQUIREMENT
    }
  ]
];

describe(`Requirements large tests`, () => {
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
        let requirementId: any;

        for (const step of scenario) {
          let currentFolderPath = path.resolve(baseDatasTestsPath, step.folder);
          let inputData: any;
          let expectedProjectResults: IEnrichedProject[];
          let expectedInterventionResults: IEnrichedIntervention[];
          let expectedRequirementResults: IRequirement[];
          let expectedAnnualProgramResults: IEnrichedAnnualProgram[];
          let expectedOutputData: any;

          if (Object.values(ProjectRequestType).includes(step.requestType as ProjectRequestType)) {
            currentFolderPath = currentFolderPath.replace('requirements', 'projects');
          } else if (Object.values(InterventionRequestType).includes(step.requestType as InterventionRequestType)) {
            currentFolderPath = currentFolderPath.replace('requirements', 'interventions');
          }

          // Set datas files
          readdirSync(currentFolderPath).forEach(file => {
            if (file.includes('input')) {
              inputData = readFile(file, currentFolderPath);
            } else if (file.includes('requirements')) {
              expectedRequirementResults = readFile(file, currentFolderPath);
            } else if (file.includes('projects')) {
              expectedProjectResults = readFile(file, currentFolderPath);
            } else if (file.includes('interventions')) {
              expectedInterventionResults = readFile(file, currentFolderPath);
            } else if (file.includes('annualPrograms')) {
              expectedAnnualProgramResults = readFile(file, currentFolderPath);
            } else if (file.includes('output')) {
              expectedOutputData = readFile(file, currentFolderPath);
            }
          });

          const response = await doRequirementRequest(step.requestType, inputData, requirementId);

          const expectedHttpStatus = step.expectedHttpStatus
            ? step.expectedHttpStatus
            : getRequirementSuccessHttpStatusResponse(step.requestType);
          assert.equal(response.status, expectedHttpStatus, `should be ${expectedHttpStatus}`);

          // Check this response body
          assertResults<any>([response.body], [expectedOutputData], 'Response body');

          // Check the requirements
          await assertRequirements(expectedRequirementResults);

          // Check the projects
          await assertProjects(expectedProjectResults);

          // Check the interventions
          await assertInterventions(expectedInterventionResults);

          // Check the annual programs
          await assertAnnualPrograms(expectedAnnualProgramResults);

          if (step.requestType === RequirementRequestType.CREATE_REQUIREMENT) {
            requirementId = response.body.id;
          }
        }
      });
    });
  });
});
