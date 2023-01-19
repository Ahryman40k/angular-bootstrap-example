import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';
import {
  ErrorCodes,
  IEnrichedOpportunityNotice,
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
import { IUpdateOpportunityNoticeNoteCommandProps } from '../../../useCases/notes/updateOpportunityNoticeNote/updateOpportunityNoticeNoteCommand';
import { updateOpportunityNoticeNoteUseCase } from '../../../useCases/notes/updateOpportunityNoticeNote/updateOpportunityNoticeNoteUseCase';
import { getUpdateOpportunityNoticeNoteCommandProps } from '../../opportunityNoticeNotesTestHelper';
import {
  createAndSaveOpportunityNotice,
  getEnrichedOpportunityNotice,
  getOpportunityNotice,
  opportunityNoticeRestrictionsData
} from '../../opportunityNoticeTestHelper';

const FIRST_NOTE = 0;

// tslint:disable:max-func-body-length
describe(`UpdateOpportunityNoticeNoteUseCase`, () => {
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
          id: undefined
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
          id: INVALID_UUID
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
        description: 'missing opportunityNoticeNoteId',
        requestError: {
          opportunityNoticeNoteId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'opportunityNoticeNoteId',
            code: ErrorCodes.MissingValue,
            message: `opportunityNoticeNoteId is null or undefined`
          }
        ]
      },
      {
        description: 'invalid opportunityNoticeNoteId',
        requestError: {
          opportunityNoticeNoteId: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'opportunityNoticeNoteId',
            code: ErrorCodes.InvalidInput,
            message: `opportunityNoticeNoteId has a bad format`
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
        const updateOpportunityNoticeNoteCommand: IUpdateOpportunityNoticeNoteCommandProps = getUpdateOpportunityNoticeNoteCommandProps();
        const result = await updateOpportunityNoticeNoteUseCase.execute(
          mergeProperties(updateOpportunityNoticeNoteCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return notFoundError when opportunityNoticeId does not exists`, async () => {
      const updateOpportunityNoticeNoteCommand: IUpdateOpportunityNoticeNoteCommandProps = getUpdateOpportunityNoticeNoteCommandProps(
        {
          id: NOT_FOUND_UUID
        }
      );
      const result = await updateOpportunityNoticeNoteUseCase.execute(updateOpportunityNoticeNoteCommand);
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

      const updateOpportunityNoticeNoteCommand: IUpdateOpportunityNoticeNoteCommandProps = getUpdateOpportunityNoticeNoteCommandProps(
        {
          id: opportunityNoticeClosedStatus.id,
          opportunityNoticeNoteId: opportunityNoticeClosedStatus.notes[FIRST_NOTE].id.toString()
        }
      );
      const result = await updateOpportunityNoticeNoteUseCase.execute(updateOpportunityNoticeNoteCommand);
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

    it(`should update a note from an opportunityNotice`, async () => {
      const updateOpportunityNoticeNoteCommand: IUpdateOpportunityNoticeNoteCommandProps = getUpdateOpportunityNoticeNoteCommandProps(
        {
          id: opportunityNotice.id,
          opportunityNoticeNoteId: opportunityNotice.notes[FIRST_NOTE].id.toString(),
          text: 'Updated note'
        }
      );
      const result = await updateOpportunityNoticeNoteUseCase.execute(updateOpportunityNoticeNoteCommand);
      assert.isTrue(result.isRight());
      const updatedOpportunityNoticeWithNote: IEnrichedOpportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;
      assert.strictEqual(
        updatedOpportunityNoticeWithNote.notes[FIRST_NOTE].text,
        updateOpportunityNoticeNoteCommand.text
      );
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
        const updateOpportunityNoticeNoteProps: IUpdateOpportunityNoticeNoteCommandProps = getUpdateOpportunityNoticeNoteCommandProps(
          {
            id: opportunityNotice.id,
            opportunityNoticeNoteId: opportunityNotice.notes[FIRST_NOTE].id.toString(),
            text: 'Updated note'
          }
        );

        await assertUseCaseRestrictions<IUpdateOpportunityNoticeNoteCommandProps, IEnrichedOpportunityNotice>(
          test,
          updateOpportunityNoticeNoteUseCase,
          updateOpportunityNoticeNoteProps
        );
      });
    });
  });
});
