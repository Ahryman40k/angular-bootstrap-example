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
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import {
  doInterventionRequest,
  getInterventionSuccessHttpStatusResponse,
  ILargeTestScenarioStep,
  InterventionRequestType
} from './interventionsLargeTestHelper';

const sandbox = sinon.createSandbox();

const testScenarios: ILargeTestScenarioStep[][] = [
  [
    {
      folder: '1-addInterventionWithProgram',
      requestType: InterventionRequestType.CREATE_INTERVENTION
    },
    {
      folder: '4-getInterventionById',
      requestType: InterventionRequestType.GET_INTERVENTION_BY_ID,
      interventionId: 'I00002'
    },
    {
      folder: '9-refuseIntervention',
      requestType: InterventionRequestType.ADD_DECISION_TO_INTERVENTION,
      interventionId: 'I00002'
    },
    {
      folder: '10-revisionRequest',
      requestType: InterventionRequestType.ADD_DECISION_TO_INTERVENTION,
      interventionId: 'I00002'
    },
    {
      folder: '11-acceptIntervention',
      requestType: InterventionRequestType.ADD_DECISION_TO_INTERVENTION,
      interventionId: 'I00002'
    },
    {
      folder: '12-cancelIntervention',
      requestType: InterventionRequestType.ADD_DECISION_TO_INTERVENTION,
      interventionId: 'I00002'
    },
    {
      folder: '13-getDecisions',
      requestType: InterventionRequestType.GET_INTERVENTION_DECISIONS,
      interventionId: 'I00002'
    }
  ],
  [
    {
      folder: '2-addInterventionWithoutProgram',
      requestType: InterventionRequestType.CREATE_INTERVENTION
    },
    {
      folder: '5-updateIntervention',
      requestType: InterventionRequestType.UPDATE_INTERVENTION,
      interventionId: 'I00002'
    },
    {
      folder: '7-addComment',
      requestType: InterventionRequestType.ADD_COMMENT_TO_INTERVENTION,
      interventionId: 'I00002'
    },
    {
      folder: '8-getComments',
      requestType: InterventionRequestType.GET_INTERVENTION_COMMENTS,
      interventionId: 'I00002'
    },
    {
      folder: '15-updateComment',
      requestType: InterventionRequestType.UPDATE_INTERVENTION_COMMENT,
      interventionId: 'I00002'
    },
    {
      folder: '16-deleteComment',
      requestType: InterventionRequestType.DELETE_INTERVENTION_COMMENT,
      interventionId: 'I00002'
    }
  ],
  [
    {
      folder: '3-addInterventionNonGeolocatedAsset',
      requestType: InterventionRequestType.CREATE_INTERVENTION,
      expectedHttpStatus: 201
    },
    {
      folder: '6-deleteWaitingIntervention',
      requestType: InterventionRequestType.DELETE_INTERVENTION,
      interventionId: 'I00002',
      expectedHttpStatus: 422
    },
    {
      folder: '14-updateAnnualDistributionWithoutProject',
      requestType: InterventionRequestType.UPDATE_INTERVENTION_ANNUAL_DISTRIBUTION,
      interventionId: 'I00002',
      expectedHttpStatus: 500
    }
  ]
];

describe(`Interventions large tests`, () => {
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
          const currentFolderPath = path.resolve(baseDatasTestsPath, step.folder);
          let inputData: any;
          let expectedInterventionResults: IEnrichedIntervention[];
          let expectedProjectResults: IEnrichedProject[];
          let expectedRequirementResults: IRequirement[];
          let expectedAnnualProgramResults: IEnrichedAnnualProgram[];
          let expectedOutputData: any;

          // Set datas files
          readdirSync(currentFolderPath).forEach(file => {
            if (file.includes('input')) {
              inputData = readFile(file, currentFolderPath);
            } else if (file.includes('interventions')) {
              expectedInterventionResults = readFile(file, currentFolderPath);
            } else if (file.includes('requirements')) {
              expectedRequirementResults = readFile(file, currentFolderPath);
            } else if (file.includes('projects')) {
              expectedProjectResults = readFile(file, currentFolderPath);
            } else if (file.includes('annualPrograms')) {
              expectedAnnualProgramResults = readFile(file, currentFolderPath);
            } else if (file.includes('output')) {
              expectedOutputData = readFile(file, currentFolderPath);
            }
          });

          const interventionId = step.interventionId ? step.interventionId : null;
          const response = await doInterventionRequest(step.requestType, inputData, interventionId, objectId);

          const expectedHttpStatus = step.expectedHttpStatus
            ? step.expectedHttpStatus
            : getInterventionSuccessHttpStatusResponse(step.requestType);
          assert.equal(response.status, expectedHttpStatus, `should be ${expectedHttpStatus}`);

          // Check this response body
          assertResults<IEnrichedIntervention>([response.body], [expectedOutputData], 'Intervention');

          // Check the interventions
          await assertInterventions(expectedInterventionResults);

          // Check the requirements
          await assertRequirements(expectedRequirementResults);

          // Check the projects
          await assertProjects(expectedProjectResults);

          // Check the annual programs
          await assertAnnualPrograms(expectedAnnualProgramResults);

          if (step.requestType === InterventionRequestType.ADD_COMMENT_TO_INTERVENTION) {
            objectId = response.body.id;
          }
        }
      });
    });
  });
});
