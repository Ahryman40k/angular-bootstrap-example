import {
  AnnualProgramStatus,
  ErrorCodes,
  IEnrichedProject,
  ProgramBookStatus,
  ProjectStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_PROJECT_ID,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { AnnualProgram } from '../../../annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { getAnnualProgram } from '../../../annualPrograms/tests/annualProgramTestHelper';
import { createAndSaveIntervention } from '../../../interventions/tests/interventionTestHelper';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { automaticLoadingProgramBookUseCase } from '../../useCases/automaticLoadingProgramBook/automaticLoadingProgramBookUseCase';
import { IProgramProjectCommandProps } from '../../useCases/programProject/programProjectCommand';
import { programProjectUseCase } from '../../useCases/programProject/programProjectUseCase';
import {
  createAndSaveDefaultProgramBook,
  getProgramBook,
  programbookRestrictionsTestData
} from '../programBookTestHelper';

// tslint:disable:max-func-body-length
describe(`ProgramProjectUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe(`Negative`, () => {
    [
      {
        description: 'missing programbook id',
        requestError: {
          programBookId: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programBookId',
            code: ErrorCodes.MissingValue,
            message: `programBookId is null or undefined`
          }
        ]
      },
      {
        description: 'invalid program book id',
        requestError: {
          programBookId: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'programBookId',
            code: ErrorCodes.InvalidInput,
            message: `programBookId has a bad format`
          }
        ]
      },
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
        description: 'invalid project id',
        requestError: {
          projectId: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectId',
            code: ErrorCodes.InvalidInput,
            message: `projectId has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const programProjectCommandprops: IProgramProjectCommandProps = {
          projectId: NOT_FOUND_PROJECT_ID,
          programBookId: NOT_FOUND_UUID
        };
        const result = await programProjectUseCase.execute(
          mergeProperties(programProjectCommandprops, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`with a pre-populated database`, () => {
    let project: IEnrichedProject;
    let annualProgram: AnnualProgram;
    let programBook: ProgramBook;

    before(async () => {
      annualProgram = (
        await annualProgramRepository.save(getAnnualProgram({ status: AnnualProgramStatus.programming }))
      ).getValue();
    });

    describe(`Program Project`, () => {
      [
        {
          programBookStatus: ProgramBookStatus.programming,
          expected: {
            projectStatus: ProjectStatus.programmed
          }
        },
        {
          programBookStatus: ProgramBookStatus.submittedPreliminary,
          expected: {
            projectStatus: ProjectStatus.preliminaryOrdered
          }
        },
        {
          programBookStatus: ProgramBookStatus.submittedFinal,
          expected: {
            projectStatus: ProjectStatus.finalOrdered
          }
        }
      ].forEach(test => {
        it(`should program project with programBook with status  ${test.programBookStatus}`, async () => {
          programBook = (
            await programBookRepository.save(
              getProgramBook({
                annualProgram,
                status: test.programBookStatus
              })
            )
          ).getValue();
          project = await createAndSaveProject({
            projectTypeId: ProjectType.integrated,
            boroughId: programBook.boroughIds.find(b => b)
          });
          const intervention = await createAndSaveIntervention({
            project
          });
          project.interventionIds = [intervention.id];
          await projectRepository.save(project);
          assert.strictEqual(programBook.status, test.programBookStatus);
          const programProjectCommandprops: IProgramProjectCommandProps = {
            projectId: project.id,
            programBookId: programBook.id
          };
          const result = await programProjectUseCase.execute(programProjectCommandprops);
          assert.isTrue(result.isRight());
          const resultProject: IEnrichedProject = result.value.getValue() as IEnrichedProject;
          assert.strictEqual(resultProject.status, test.expected.projectStatus);
        });
      });
    });
  });
  describe(`UserRestrictions`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const pb = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
          { boroughIds: test.props.boroughIds, status: ProgramBookStatus.programming }
        );
        const props: IByUuidCommandProps = {
          id: pb.id
        };
        await assertUseCaseRestrictions<IByUuidCommandProps, void>(test, automaticLoadingProgramBookUseCase, props);
      });
    });
  });
});
