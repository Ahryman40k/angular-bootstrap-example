import {
  ErrorCodes,
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  OpportunityNoticeStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { createAndSaveProject } from '../../../../projects/tests/projectTestHelper';
import { OpportunityNotice } from '../../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../../mongo/opportunityNoticeRepository';
import { ICreateOpportunityNoticeNoteCommandProps } from '../../../useCases/notes/createOpportunityNoticeNote/createOpportunityNoticeNoteCommand';
import { createOpportunityNoticeNoteUseCase } from '../../../useCases/notes/createOpportunityNoticeNote/createOpportunityNoticeNoteUseCase';
import { getCreateOpportunityNoticeNoteCommandProps } from '../../opportunityNoticeNotesTestHelper';
import {
  createAndSaveOpportunityNotice,
  getEnrichedOpportunityNotice,
  getOpportunityNotice,
  opportunityNoticeRestrictionsData
} from '../../opportunityNoticeTestHelper';

// tslint:disable:max-func-body-length
describe(`CreateOpportunityNoticeNoteUseCase`, () => {
  let project: IEnrichedProject;
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });
    beforeEach(async () => {
      project = await createAndSaveProject({ projectTypeId: ProjectType.integrated });
    });

    [
      {
        description: 'missing opportunityNoticeId',
        requestError: {
          opportunityNoticeId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'opportunityNoticeId',
            code: ErrorCodes.MissingValue,
            message: `opportunityNoticeId is null or undefined`
          }
        ]
      },
      {
        description: 'invalid opportunityNoticeId',
        requestError: {
          opportunityNoticeId: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'opportunityNoticeId',
            code: ErrorCodes.InvalidInput,
            message: `opportunityNoticeId has a bad format`
          }
        ]
      },
      {
        description: 'missing text',
        requestError: {
          text: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'text',
            code: ErrorCodes.MissingValue,
            message: `text is null or undefined`
          }
        ]
      },
      {
        description: 'text is empty',
        requestError: {
          text: '        '
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'text',
            code: ErrorCodes.InvalidInput,
            message: `text is empty`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const createOpportunityNoticeNoteCommand: ICreateOpportunityNoticeNoteCommandProps = getCreateOpportunityNoticeNoteCommandProps();
        const result = await createOpportunityNoticeNoteUseCase.execute(
          mergeProperties(createOpportunityNoticeNoteCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`C67727 - should return notFoundError when opportunityNoticeId does not exists`, async () => {
      const createOpportunityNoticeNoteCommand: ICreateOpportunityNoticeNoteCommandProps = getCreateOpportunityNoticeNoteCommandProps(
        {
          opportunityNoticeId: NOT_FOUND_UUID
        }
      );
      const result = await createOpportunityNoticeNoteUseCase.execute(createOpportunityNoticeNoteCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    it(`SHOULD_BE_UNPROCESSABLE_ERROR when the opportunity notice status is ${OpportunityNoticeStatus.closed} `, async () => {
      const opportunityNoticeClosedStatus: OpportunityNotice = (
        await opportunityNoticeRepository.save(
          getOpportunityNotice({
            status: OpportunityNoticeStatus.closed,
            projectId: project.id
          })
        )
      ).getValue();

      const createOpportunityNoticeNoteCommand: ICreateOpportunityNoticeNoteCommandProps = getCreateOpportunityNoticeNoteCommandProps(
        {
          opportunityNoticeId: opportunityNoticeClosedStatus.id
        }
      );
      const result = await createOpportunityNoticeNoteUseCase.execute(createOpportunityNoticeNoteCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
    });
  });

  describe(`with a pre-populated database`, () => {
    let opportunityNotice: OpportunityNotice;

    beforeEach(async () => {
      project = await createAndSaveProject({ projectTypeId: ProjectType.integrated });
      opportunityNotice = (
        await opportunityNoticeRepository.save(
          getOpportunityNotice(getEnrichedOpportunityNotice({ projectId: project.id }))
        )
      ).getValue();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it(`C67725 - should add a note to opportunityNotice`, async () => {
      const createOpportunityNoticeNoteCommand: ICreateOpportunityNoticeNoteCommandProps = getCreateOpportunityNoticeNoteCommandProps(
        {
          opportunityNoticeId: opportunityNotice.id
        }
      );
      assert.strictEqual(opportunityNotice.notes.length, 1, `should have one note`);
      const result = await createOpportunityNoticeNoteUseCase.execute(createOpportunityNoticeNoteCommand);
      assert.isTrue(result.isRight());
      const updatedOpportunityWithNote: IEnrichedOpportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;
      assert.strictEqual(updatedOpportunityWithNote.notes.length, 2, `should have two notes`);
      assert.strictEqual(updatedOpportunityWithNote.notes[1].text, createOpportunityNoticeNoteCommand.text);
    });
  });
  describe('User restrictions', () => {
    afterEach(async () => {
      await destroyDBTests();
    });
    opportunityNoticeRestrictionsData.forEach(test => {
      it(test.scenario, async () => {
        project = await createAndSaveProject({
          projectTypeId: ProjectType.integrated,
          executorId: test.props.executorId,
          boroughId: test.props.boroughId
        });
        const opportunityNotice = await createAndSaveOpportunityNotice({
          requestorId: test.props.requestorId,
          projectId: project.id
        });
        const createOpportunityNoticeNoteCommand: ICreateOpportunityNoticeNoteCommandProps = getCreateOpportunityNoticeNoteCommandProps(
          {
            opportunityNoticeId: opportunityNotice.id
          }
        );

        await assertUseCaseRestrictions<ICreateOpportunityNoticeNoteCommandProps, IEnrichedOpportunityNotice>(
          test,
          createOpportunityNoticeNoteUseCase,
          createOpportunityNoticeNoteCommand
        );
      });
    });
  });
});
