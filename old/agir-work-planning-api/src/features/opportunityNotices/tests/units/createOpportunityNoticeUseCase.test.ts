import {
  ErrorCodes,
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  IPlainOpportunityNotice,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import {
  assertFailures,
  destroyDBTests,
  INVALID_ASSET,
  INVALID_FOLLOW_UP_METHOD,
  INVALID_MAX_ITERATIONS,
  INVALID_PROJECT_ID,
  mergeProperties,
  NOT_FOUND_PROJECT_ID
} from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { appUtils } from '../../../../utils/utils';
import { getInitialAsset } from '../../../asset/tests/assetTestHelper';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import {
  assertProjectIntegratedType,
  assertProjectNotCompleting,
  createAndSaveProject
} from '../../../projects/tests/projectTestHelper';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { IPlainOpportunityNoticeProps } from '../../models/plainOpportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import { createOpportunityNoticeUseCase } from '../../useCases/createOpportunityNotice/createOpportunityNoticeUseCase';
import {
  assertOpportunityNotice,
  getEnrichedOpportunityNotice,
  getOpportunityNoticeProps,
  getPlainOpportunityNoticeProps,
  opportunityNoticeRestrictionsData
} from '../opportunityNoticeTestHelper';

const CURRENT_YEAR = appUtils.getCurrentYear();
const CURRENT_YEAR_PLUS_FOUR = appUtils.getCurrentYear() + 4;
const CURRENT_YEAR_MINUS_ONE = appUtils.getCurrentYear() - 1;
// tslint:disable:max-func-body-length
describe(`CreateOpportunityNoticeUseCase`, () => {
  describe(`Negative`, () => {
    let mockProject: IEnrichedProject;
    before(async () => {
      mockProject = await projectDataGenerator.store({});
    });
    afterEach(async () => {
      await destroyDBTests();
    });
    [
      {
        description: 'missing project id',
        requestError: {
          projectId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectId',
            code: ErrorCodes.MissingValue,
            message: `projectId is null or undefined`
          }
        ]
      },
      {
        description: 'invalid projectId',
        requestError: {
          projectId: INVALID_PROJECT_ID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectId',
            code: ErrorCodes.InvalidInput,
            message: `projectId has a bad format`
          }
        ]
      },
      {
        description: 'missing requestor id',
        requestError: {
          requestorId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'requestorId',
            code: ErrorCodes.MissingValue,
            message: `requestorId is null or undefined`
          }
        ]
      },
      {
        description: 'missing followUpMethod',
        requestError: {
          followUpMethod: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'followUpMethod',
            code: ErrorCodes.MissingValue,
            message: `followUpMethod is null or undefined`
          }
        ]
      },
      {
        description: 'invalid follow up',
        requestError: {
          followUpMethod: INVALID_FOLLOW_UP_METHOD
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'followUpMethod',
            code: ErrorCodes.InvalidInput,
            message: `Taxonomy code: InvalidFollowUpMethod doesn't exist`
          }
        ]
      },
      {
        description: 'invalid max iterations',
        requestError: {
          maxIterations: INVALID_MAX_ITERATIONS
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'maxIterations',
            code: ErrorCodes.InvalidInput,
            message: 'maxIterations is not a number'
          },
          {
            succeeded: false,
            target: 'PlainOpportunityNotice',
            code: 'openApiInputValidator',
            message: 'maxIterations (InvalidMaxIterations) is not a type of number'
          }
        ]
      },
      {
        description: 'assets is a string',
        requestError: {
          assets: getInitialAsset()
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'PlainOpportunityNotice',
            code: 'openApiInputValidator',
            message: 'assets is not an array. An array is expected.'
          }
        ]
      },
      {
        description: 'assets contains a string element',
        requestError: {
          assets: [INVALID_ASSET]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'PlainOpportunityNotice',
            code: 'openApiInputValidator',
            message: 'Unable to validate a model with a type: string, expected: object'
          }
        ]
      },
      {
        description: 'note text is an empty string',
        requestError: {
          notes: [
            {
              text: '     '
            }
          ]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'notes[0].text',
            code: ErrorCodes.InvalidInput,
            message: 'notes[0].text is empty'
          }
        ]
      },
      {
        description: 'note text is undefined',
        requestError: {
          notes: [
            {
              text: undefined
            }
          ]
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'notes[0].text',
            code: ErrorCodes.MissingValue,
            message: 'notes[0].text is null or undefined'
          },
          {
            succeeded: false,
            target: 'PlainOpportunityNotice',
            code: 'openApiInputValidator',
            message: 'Unable to validate an empty value for property: notes'
          }
        ]
      },
      {
        description: 'contactInfos is an empty string',
        requestError: {
          contactInfo: '  '
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'contactInfo',
            code: ErrorCodes.InvalidInput,
            message: 'contactInfo is empty'
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const createOpportunityNoticeCommand: IPlainOpportunityNotice = {
          ...getPlainOpportunityNoticeProps()
        };
        if (test.requestError.assets) {
          createOpportunityNoticeCommand.projectId = mockProject.id;
          createOpportunityNoticeCommand.assets = test.requestError.assets as any;
        }
        const result = await createOpportunityNoticeUseCase.execute(
          mergeProperties(createOpportunityNoticeCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`C67727 - should return notFoundError when projectId does not exists`, async () => {
      const createOpportunityNoticeCommand: IPlainOpportunityNoticeProps = {
        ...getPlainOpportunityNoticeProps(),
        projectId: NOT_FOUND_PROJECT_ID
      };
      const result = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    [
      {
        id: 'C67729',
        description: 'the project category is in completing',
        data: {
          startYear: CURRENT_YEAR_MINUS_ONE
        },
        expectedError: {
          message: ''
        }
      },
      {
        id: 'C67730',
        description: 'the project is not an integrated type (PI)',
        data: {
          projectTypeId: ProjectType.other
        },
        expectedError: {
          message: ''
        }
      },
      {
        id: 'C67731',
        description: 'other notices are in open state of the same asset',
        data: undefined,
        createOtherNotice: true,
        expectedError: {
          message: ''
        }
      }
    ].forEach(test => {
      it(`${test.id} - SHOULD_BE_UNPROCESSABLE_ERROR when ${test.description} `, async () => {
        const project = await projectDataGenerator.store({
          startYear: CURRENT_YEAR,
          endYear: CURRENT_YEAR_PLUS_FOUR,
          ...test.data
        });
        if (test.createOtherNotice) {
          const otherOpportunityNotice = OpportunityNotice.create({
            ...getEnrichedOpportunityNotice(),
            projectId: project.id,
            status: 'new'
          }).getValue();
          await opportunityNoticeRepository.save(otherOpportunityNotice);
        }

        const createOpportunityNoticeCommand: IPlainOpportunityNoticeProps = {
          ...getPlainOpportunityNoticeProps(),
          projectId: project.id
        };

        const result = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let project: IEnrichedProject;

    beforeEach(async () => {
      project = await projectDataGenerator.store({
        startYear: appUtils.getCurrentYear(),
        endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
      });
    });

    it(`C67725 - Positive - Should create opportunity notice`, async () => {
      const createOpportunityNoticeCommand: IPlainOpportunityNoticeProps = {
        ...getPlainOpportunityNoticeProps(),
        projectId: project.id
      };
      const expectedEnrichedOpportunityNotice = getEnrichedOpportunityNotice(
        getOpportunityNoticeProps(createOpportunityNoticeCommand)
      );
      const result = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand);
      assert.isTrue(result.isRight());
      const createdOpportunity: IEnrichedOpportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;

      assertOpportunityNotice(createdOpportunity, expectedEnrichedOpportunityNotice);
      const projectAfterOpportunity = await projectRepository.findById(project.id);
      assertProjectNotCompleting(projectAfterOpportunity);
      assertProjectIntegratedType(projectAfterOpportunity);
      assert.isFalse(project.isOpportunityAnalysis);
      assert.isTrue(projectAfterOpportunity.isOpportunityAnalysis);
    });

    it(`Positive - Should create two opportunity notices`, async () => {
      const createOpportunityNoticeCommand: IPlainOpportunityNoticeProps = {
        ...getPlainOpportunityNoticeProps(),
        projectId: project.id
      };
      const expectedEnrichedOpportunityNotice = getEnrichedOpportunityNotice(
        getOpportunityNoticeProps(createOpportunityNoticeCommand)
      );
      const result = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand);
      assert.isTrue(result.isRight());
      const createdOpportunity: IEnrichedOpportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;

      assertOpportunityNotice(createdOpportunity, expectedEnrichedOpportunityNotice);
      const projectAfterOpportunity = await projectRepository.findById(project.id);
      assertProjectNotCompleting(projectAfterOpportunity);
      assertProjectIntegratedType(projectAfterOpportunity);
      assert.isFalse(project.isOpportunityAnalysis);
      assert.isTrue(projectAfterOpportunity.isOpportunityAnalysis);

      const createOpportunityNoticeCommand2: IPlainOpportunityNoticeProps = {
        ...createOpportunityNoticeCommand,
        assets: [{ ...getInitialAsset(), id: '22' }]
      };
      const result2 = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand2);
      assert.isTrue(result2.isRight());
      const projectAfterOpportunity2 = await projectRepository.findById(project.id);
      assert.isTrue(projectAfterOpportunity2.isOpportunityAnalysis);
    });

    it(`C69030 - Positive - Should create opportunity notice without asset`, async () => {
      const createOpportunityNoticeCommand: IPlainOpportunityNoticeProps = {
        ...getPlainOpportunityNoticeProps(),
        projectId: project.id
      };
      delete createOpportunityNoticeCommand.assets;
      const expectedEnrichedOpportunityNotice = getEnrichedOpportunityNotice(
        getOpportunityNoticeProps(createOpportunityNoticeCommand)
      );
      const result = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand);
      assert.isTrue(result.isRight());
      const createdOpportunity: IEnrichedOpportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;

      assertOpportunityNotice(createdOpportunity, expectedEnrichedOpportunityNotice);
      const projectAfterOpportunity = await projectRepository.findById(project.id);
      assertProjectNotCompleting(projectAfterOpportunity);
      assertProjectIntegratedType(projectAfterOpportunity);
    });

    it(`C69028 - Positive - Should create opportunity notice on the same asset to differents projects`, async () => {
      const createOpportunityNoticeCommand: IPlainOpportunityNoticeProps = {
        ...getPlainOpportunityNoticeProps(),
        projectId: project.id
      };
      const result = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand);
      assert.isTrue(result.isRight());

      const project2 = await projectDataGenerator.store({
        startYear: appUtils.getCurrentYear(),
        endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
      });

      const createOpportunityNoticeCommand2: IPlainOpportunityNoticeProps = {
        ...getPlainOpportunityNoticeProps(),
        projectId: project2.id
      };

      const expectedEnrichedOpportunityNotice2 = getEnrichedOpportunityNotice(
        getOpportunityNoticeProps(createOpportunityNoticeCommand2)
      );
      const result2 = await createOpportunityNoticeUseCase.execute(createOpportunityNoticeCommand2);
      assert.isTrue(result2.isRight());
      const createdOpportunity2: IEnrichedOpportunityNotice = result2.value.getValue() as IEnrichedOpportunityNotice;

      assertOpportunityNotice(createdOpportunity2, expectedEnrichedOpportunityNotice2);
    });
  });

  describe('User restrictions', () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    opportunityNoticeRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const project = await createAndSaveProject({
          projectTypeId: ProjectType.integrated,
          executorId: test.props.executorId,
          boroughId: test.props.boroughId
        });
        const createOpportunityNoticeProps: IPlainOpportunityNoticeProps = getPlainOpportunityNoticeProps({
          requestorId: test.props.requestorId,
          projectId: project.id
        });
        await assertUseCaseRestrictions<IPlainOpportunityNoticeProps, IEnrichedOpportunityNotice>(
          test,
          createOpportunityNoticeUseCase,
          createOpportunityNoticeProps
        );
      });
    });
  });
});
