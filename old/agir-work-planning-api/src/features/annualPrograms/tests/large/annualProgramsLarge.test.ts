import {
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { readdirSync } from 'fs-extra';
import * as path from 'path';
import { userMocks } from '../../../../../tests/data/userMocks';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import {
  assertAnnualPrograms,
  assertInterventions,
  assertProjects,
  assertRequirements,
  assertResults,
  readFile,
  setTestApp
} from '../../../../shared/largeTest/largeTestHelper';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import {
  AnnualProgramRequestType,
  doAnnualProgramRequest,
  getSuccessHttpStatusResponse,
  ILargeTestScenarioStep
} from './annualProgramsLargeTestHelper';

const testScenarios: ILargeTestScenarioStep[][] = [
  [
    {
      folder: '1-addAnnualProgram',
      requestType: AnnualProgramRequestType.CREATE_ANNUAL_PROGRAM
    },
    {
      folder: '2-getAnnualProgramById',
      requestType: AnnualProgramRequestType.GET_ANNUAL_PROGRAM_BY_ID
    },
    {
      folder: '3-updateAnnualProgram',
      requestType: AnnualProgramRequestType.UPDATE_ANNUAL_PROGRAM
    },
    {
      folder: '4-shareAnnualProgram',
      requestType: AnnualProgramRequestType.UPDATE_ANNUAL_PROGRAM
    },
    {
      folder: '5-deleteAnnualProgram',
      requestType: AnnualProgramRequestType.DELETE_ANNUAL_PROGRAM
    }
  ]
];

describe(`Annual programs large tests`, () => {
  before(async () => {
    await setTestApp();
  });

  beforeEach(() => {
    // reset taxonomies cache
    taxonomyService.reset();
    userMocker.mock(userMocks.admin);
  });

  afterEach(async () => {
    await destroyDBTests();
    userMocker.reset();
  });

  describe(`Positive`, () => {
    const baseDatasTestsPath = path.resolve(__dirname, 'datas');

    testScenarios.forEach(scenario => {
      it(`should run test scenario ${scenario[scenario.length - 1]}`, async () => {
        let annualProgramId: any;
        for (const step of scenario) {
          const currentFolderPath = path.resolve(baseDatasTestsPath, step.folder);
          let inputData: any;
          let expectedAnnualProgramResults: IEnrichedAnnualProgram[];
          let expectedProjectResults: IEnrichedProject[];
          let expectedInterventionResults: IEnrichedIntervention[];
          let expectedRequirementResults: IRequirement[];
          let expectedOutputData: any;

          // Set datas files
          readdirSync(currentFolderPath).forEach(file => {
            if (file.includes('input')) {
              inputData = readFile(file, currentFolderPath);
            } else if (file.includes('annualPrograms')) {
              expectedAnnualProgramResults = readFile(file, currentFolderPath);
            } else if (file.includes('requirements')) {
              expectedRequirementResults = readFile(file, currentFolderPath);
            } else if (file.includes('projects')) {
              expectedProjectResults = readFile(file, currentFolderPath);
            } else if (file.includes('interventions')) {
              expectedInterventionResults = readFile(file, currentFolderPath);
            } else if (file.includes('output')) {
              expectedOutputData = readFile(file, currentFolderPath);
            }
          });

          const response = await doAnnualProgramRequest(step.requestType, inputData, annualProgramId);

          const expectedHttpStatus = step.expectedHttpStatus
            ? step.expectedHttpStatus
            : getSuccessHttpStatusResponse(step.requestType);
          assert.equal(response.status, expectedHttpStatus, `should be ${expectedHttpStatus}`);

          // Check this response body
          assertResults<IEnrichedAnnualProgram>([response.body], [expectedOutputData], 'Annual program');

          // Check the annual programs
          await assertAnnualPrograms(expectedAnnualProgramResults);

          // Check the requirements
          await assertRequirements(expectedRequirementResults);

          // Check the projects
          await assertProjects(expectedProjectResults);

          // Check the interventions
          await assertInterventions(expectedInterventionResults);

          if (step.requestType === AnnualProgramRequestType.CREATE_ANNUAL_PROGRAM) {
            annualProgramId = response.body.id;
          }
        }
      });
    });
  });
});
