import {
  ErrorCodes,
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  OpportunityNoticeResponseRequestorDecision,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { getEnrichedCompleteProject } from '../../../../../tests/data/projectData';
import {
  assertFailures,
  destroyDBTests,
  INVALID_PROJECT_ID,
  mergeProperties,
  NOT_FOUND_UUID
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
import { assertUpdatedAudit } from '../../../audit/test/auditTestHelper';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { OpportunityNoticeFindOptions } from '../../models/opportunityNoticeFindOptions';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import { IUpdateOpportunityNoticeCommandProps } from '../../useCases/updateOpportunityNotice/updateOpportunityNoticeCommand';
import { updateOpportunityNoticeUseCase } from '../../useCases/updateOpportunityNotice/updateOpportunityNoticeUseCase';
import {
  assertOpportunityNotice,
  createAndSaveOpportunityNotice,
  getEnrichedOpportunityNotice,
  getOpportunityNotice,
  getOpportunityNoticeProps,
  getOpportunityNoticeResponse,
  getPlainOpportunityNoticeProps,
  getPlainOpportunityNoticeResponse,
  updateOpportunityNoticeRestrictionsData
} from '../opportunityNoticeTestHelper';

const CURRENT_DATE = MomentUtils.now().toISOString();
const CURRENT_DATE_PLUS_ONE_YEAR = MomentUtils.add(CURRENT_DATE, 1, TimeUnits.YEAR).toISOString();
const TEST_CHANGE = 'test change';

// tslint:disable:max-func-body-length
describe(`UpdateOpportunityNoticeUseCase`, () => {
  describe(`Negative`, () => {
    let project: IEnrichedProject;
    let opportunityNotice: OpportunityNotice;
    beforeEach(async () => {
      project = await projectDataGenerator.store({});
      opportunityNotice = (
        await opportunityNoticeRepository.save(
          getOpportunityNotice({ projectId: project.id, response: getOpportunityNoticeResponse() })
        )
      ).getValue();
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
        description: 'invalid response requestor decision date',
        requestError: {
          response: getPlainOpportunityNoticeResponse({
            requestorDecision: OpportunityNoticeResponseRequestorDecision.no,
            requestorDecisionDate: CURRENT_DATE_PLUS_ONE_YEAR
          })
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'requestorDecisionDate',
            code: ErrorCodes.InvalidInput,
            message: `requestorDecisionDate is not before or the same as date to compare`
          }
        ]
      },
      {
        description: 'opportunity notice response contain a planning decision note empty string',
        requestError: {
          response: getPlainOpportunityNoticeResponse({
            planningDecisionNote: ''
          })
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'planningDecisionNote',
            code: ErrorCodes.InvalidInput,
            message: `planningDecisionNote is empty`
          }
        ]
      },
      {
        description: 'opportunity notice response contain a requestor decision note empty string',
        requestError: {
          response: getPlainOpportunityNoticeResponse({
            requestorDecisionNote: ''
          })
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'requestorDecisionNote',
            code: ErrorCodes.InvalidInput,
            message: `requestorDecisionNote is empty`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const updateOpportunityNoticeCommand: IUpdateOpportunityNoticeCommandProps = {
          ...getPlainOpportunityNoticeProps({ projectId: project.id }),
          id: opportunityNotice.id
        };
        const result = await updateOpportunityNoticeUseCase.execute(
          mergeProperties(updateOpportunityNoticeCommand, test.requestError)
        );
        assert.isTrue(result.isLeft(), 'expect to have a left result');
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return notFoundError when opportunity notice id does not exists`, async () => {
      const updateOpportunityNoticeCommand: IUpdateOpportunityNoticeCommandProps = {
        ...getPlainOpportunityNoticeProps({ projectId: project.id }),
        id: NOT_FOUND_UUID
      };
      const result = await updateOpportunityNoticeUseCase.execute(updateOpportunityNoticeCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    it(`should not update projectId`, async () => {
      const project2 = (await projectRepository.save(getEnrichedCompleteProject())).getValue();
      const updateOpportunityNoticeCommand: IUpdateOpportunityNoticeCommandProps = {
        ...getPlainOpportunityNoticeProps({ projectId: project2.id }),
        id: opportunityNotice.id
      };
      const result = await updateOpportunityNoticeUseCase.execute(updateOpportunityNoticeCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
    });

    it(`should not update opportunity notice when assets list was changed`, async () => {
      const updateOpportunityNoticeCommand: IUpdateOpportunityNoticeCommandProps = {
        ...getPlainOpportunityNoticeProps({ projectId: project.id, assets: [getInitialAsset(), getInitialAsset()] }),
        id: opportunityNotice.id
      };

      const result = await updateOpportunityNoticeUseCase.execute(updateOpportunityNoticeCommand);
      assert.isTrue(result.isLeft(), 'expect to have a left result');
      assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      const failures: IGuardResult[] = (result.value as any).error.error;
      const expectedError = [
        {
          succeeded: false,
          target: 'opportunityNotice.assets',
          code: ErrorCodes.InvalidInput,
          message: `assets list was changed`
        }
      ];
      assertFailures(failures, expectedError);
    });
  });

  describe(`with a pre-populated database`, () => {
    let project: IEnrichedProject;
    let opportunityNotice: IEnrichedOpportunityNotice;

    afterEach(async () => {
      await destroyDBTests();
    });

    describe(`Positive`, () => {
      beforeEach(async () => {
        project = await projectDataGenerator.store({
          startYear: appUtils.getCurrentYear(),
          endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear(),
          isOpportunityAnalysis: true
        });
        opportunityNotice = (
          await opportunityNoticeRepository.save(
            getOpportunityNotice({
              projectId: project.id,
              response: getOpportunityNoticeResponse()
            })
          )
        ).getValue();
      });
      [
        {
          description: 'opportunity notice',
          props: {
            object: TEST_CHANGE
          }
        },
        {
          description: 'opportunity notice when response notes is null',
          props: {
            object: TEST_CHANGE,
            response: getPlainOpportunityNoticeResponse({
              requestorDecision: OpportunityNoticeResponseRequestorDecision.analyzing,
              requestorDecisionNote: null
            })
          }
        },
        {
          description: 'opportunity notice when response notes is undefined',
          props: {
            object: TEST_CHANGE,
            response: getPlainOpportunityNoticeResponse({
              requestorDecision: OpportunityNoticeResponseRequestorDecision.analyzing,
              requestorDecisionNote: undefined
            })
          }
        }
      ].forEach(test => {
        it(`should update ${test.description}`, async () => {
          const findOptions = { criterias: {} };
          const originalsOpportunityNoticeCount = await opportunityNoticeRepository.count(
            OpportunityNoticeFindOptions.create(findOptions).getValue()
          );
          const updateOpportunityNoticeCommand: IUpdateOpportunityNoticeCommandProps = {
            ...getPlainOpportunityNoticeProps({ projectId: project.id, ...test.props }),
            id: opportunityNotice.id
          };
          const expectedEnrichedOpportunityNotice = getEnrichedOpportunityNotice(
            getOpportunityNoticeProps(updateOpportunityNoticeCommand)
          );
          const result = await updateOpportunityNoticeUseCase.execute(updateOpportunityNoticeCommand);
          assert.isTrue(result.isRight());
          const updatedOpportunity: IEnrichedOpportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;
          const opportunityNoticeCount = await opportunityNoticeRepository.count(
            OpportunityNoticeFindOptions.create(findOptions).getValue()
          );
          assert.equal(opportunityNoticeCount, originalsOpportunityNoticeCount);
          assertOpportunityNotice(updatedOpportunity, expectedEnrichedOpportunityNotice);
          assertUpdatedAudit(opportunityNotice.audit, updatedOpportunity.audit);
          assert.strictEqual(updatedOpportunity.object, test.props.object);
        });
      });
    });

    describe(`Negative`, () => {
      beforeEach(async () => {
        project = await projectDataGenerator.store({
          startYear: appUtils.getCurrentYear(),
          endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear(),
          isOpportunityAnalysis: true
        });
        opportunityNotice = (
          await opportunityNoticeRepository.save(
            getOpportunityNotice({
              projectId: project.id,
              response: getOpportunityNoticeResponse({
                requestorDecision: OpportunityNoticeResponseRequestorDecision.no
              })
            })
          )
        ).getValue();
      });
      [
        {
          description: 'response is no and a planning decision note is present',
          requestError: {
            response: getPlainOpportunityNoticeResponse({
              requestorDecision: OpportunityNoticeResponseRequestorDecision.no,
              planningDecisionNote: 'planningDecisionNote'
            })
          },
          expectedErrors: [
            {
              succeeded: false,
              target: 'opportunityNotice.response',
              code: ErrorCodes.OpportunityNoticeResponseDecisionNote,
              message: `cant update notice when response is no and a decision note is present`
            }
          ]
        },
        {
          description: 'response is definitive and we try to change its response',
          requestError: {
            response: getPlainOpportunityNoticeResponse({
              requestorDecision: OpportunityNoticeResponseRequestorDecision.yes
            })
          },
          expectedErrors: [
            {
              succeeded: false,
              target: 'opportunityNotice.response',
              code: ErrorCodes.OpportunityNoticeResponseRequestorDecision,
              message: `cant update notice when response is definitive and the requestor decision is different`
            }
          ]
        }
      ].forEach(test => {
        it(`should not update when ${test.description} `, async () => {
          const opportunityNoticeToUpdate: IUpdateOpportunityNoticeCommandProps = {
            ...getPlainOpportunityNoticeProps(test.requestError),
            projectId: project.id,
            id: opportunityNotice.id
          };
          const result = await updateOpportunityNoticeUseCase.execute(opportunityNoticeToUpdate);
          assert.isTrue(result.isLeft());
          assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
          const failures: IGuardResult[] = (result.value as any).error.error;
          assertFailures(failures, test.expectedErrors);
        });
      });
    });
  });

  describe('User restrictions', () => {
    afterEach(async () => {
      await destroyDBTests();
    });
    updateOpportunityNoticeRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        const updateProps = test.updateProps || test.props;
        const project = await createAndSaveProject({
          projectTypeId: ProjectType.integrated,
          executorId: test.props.executorId,
          boroughId: test.props.boroughId
        });
        const opportunityNotice = await createAndSaveOpportunityNotice({
          requestorId: test.props.requestorId,
          projectId: project.id
        });
        const props: IUpdateOpportunityNoticeCommandProps = {
          ...getPlainOpportunityNoticeProps(),
          id: opportunityNotice.id,
          requestorId: updateProps.requestorId,
          projectId: project.id
        };

        await assertUseCaseRestrictions<IUpdateOpportunityNoticeCommandProps, IEnrichedOpportunityNotice>(
          test,
          updateOpportunityNoticeUseCase,
          props
        );
      });
    });
  });
});
