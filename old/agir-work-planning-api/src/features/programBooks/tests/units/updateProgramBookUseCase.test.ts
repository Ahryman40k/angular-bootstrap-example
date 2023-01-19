import {
  AnnualProgramStatus,
  BoroughCode,
  ErrorCodes,
  IEnrichedProgramBook,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectStatus,
  ProjectType,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { createEnrichedProject } from '../../../../../tests/data/projectData';
import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID,
  VALID_UUID
} from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { assertUseCaseRestrictions } from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { PROGRAM_TYPE_PAR, PROGRAM_TYPE_PCPR } from '../../../../shared/taxonomies/constants';
import { AnnualProgram } from '../../../annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { getAnnualProgram } from '../../../annualPrograms/tests/annualProgramTestHelper';
import { createAndSaveIntervention } from '../../../interventions/tests/interventionTestHelper';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { generateDrmNumberUseCase } from '../../../projects/useCases/drm/generateDrmNumber/generateDrmNumberUseCase';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { IUpdateProgramBookCommandProps } from '../../useCases/updateProgramBook/updateProgramBookCommand';
import { updateProgramBookUseCase } from '../../useCases/updateProgramBook/updateProgramBookUseCase';
import {
  createAndSaveDefaultProgramBook,
  getProgramBook,
  getUpdateProgramBookProps,
  updateProgrambookRestrictionsTestData
} from '../programBookTestHelper';

// tslint:disable:max-func-body-length
describe(`UpdateProgramBookUseCase`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  describe(`Negative`, () => {
    [
      {
        description: 'missing programbook id',
        requestError: {
          id: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.MissingValue,
            message: `id is null or undefined`
          }
        ]
      },
      {
        description: 'invalid program book id',
        requestError: {
          id: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: `id has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const updateProgramBookCommand: IUpdateProgramBookCommandProps = {
          ...getUpdateProgramBookProps(NOT_FOUND_UUID)
        };
        const result = await updateProgramBookUseCase.execute(
          mergeProperties(updateProgramBookCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return notFoundError when given program book id do not exists`, async () => {
    const updateProgramBookCommand: IUpdateProgramBookCommandProps = {
      ...getUpdateProgramBookProps(NOT_FOUND_UUID)
    };
    const result = await updateProgramBookUseCase.execute(updateProgramBookCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  // NOSONAR
  describe(`with a pre-populated database`, () => {
    let annualProgram: AnnualProgram;
    let currentProgramBook: ProgramBook;

    before(async () => {
      annualProgram = (
        await annualProgramRepository.save(getAnnualProgram({ status: AnnualProgramStatus.programming }))
      ).getValue();
    });

    describe(`update status`, () => {
      [
        {
          currentStatus: ProgramBookStatus.new,
          expectedStatus: ProgramBookStatus.programming,
          payload: {
            status: ProgramBookStatus.programming,
            sharedRoles: []
          }
        },
        {
          currentStatus: ProgramBookStatus.programming,
          expectedStatus: ProgramBookStatus.submittedPreliminary,
          payload: {
            status: ProgramBookStatus.programming,
            sharedRoles: [Role.EXECUTOR]
          }
        },
        {
          currentStatus: ProgramBookStatus.submittedPreliminary,
          expectedStatus: ProgramBookStatus.programming,
          payload: {
            status: ProgramBookStatus.submittedPreliminary,
            sharedRoles: []
          }
        }
      ].forEach(test => {
        it(`should update status from ${test.currentStatus} to ${test.expectedStatus}`, async () => {
          currentProgramBook = (
            await programBookRepository.save(
              getProgramBook({
                annualProgram,
                status: test.currentStatus
              })
            )
          ).getValue();

          assert.strictEqual(currentProgramBook.status, test.currentStatus);
          const updateProgramBookCommandprops = mergeProperties(
            getUpdateProgramBookProps(currentProgramBook.id),
            test.payload
          );
          const result = await updateProgramBookUseCase.execute(updateProgramBookCommandprops);
          assert.isTrue(result.isRight());
          currentProgramBook = await programBookRepository.findById(currentProgramBook.id);
          assert.strictEqual(currentProgramBook.status, test.expectedStatus);
        });
      });

      [
        {
          currentStatus: ProgramBookStatus.programming,
          expectedStatus: ProgramBookStatus.submittedPreliminary,
          payload: {
            status: ProgramBookStatus.programming,
            sharedRoles: [Role.EXECUTOR]
          },
          currentProjectsStatus: ProjectStatus.programmed,
          expectedProjectsStatus: ProjectStatus.preliminaryOrdered
        },
        {
          currentStatus: ProgramBookStatus.submittedPreliminary,
          expectedStatus: ProgramBookStatus.programming,
          payload: {
            status: ProgramBookStatus.submittedPreliminary,
            sharedRoles: []
          },
          currentProjectsStatus: ProjectStatus.preliminaryOrdered,
          expectedProjectsStatus: ProjectStatus.programmed
        }
      ].forEach(test => {
        it(`should update projects status to ${test.expectedProjectsStatus} when programBook status goes to ${test.expectedStatus}`, async () => {
          let programBook = (
            await programBookRepository.save(
              getProgramBook({
                annualProgram,
                status: test.currentStatus
              }),
              {
                expand: [ProgramBookExpand.projects]
              }
            )
          ).getValue();

          const [project1, project2, project3] = [1, 2, 3].map(p => createEnrichedProject());
          const projects = (
            await Promise.all(
              [project1, project2, project3].map((p, i, { length }) => {
                // Last project is postponed
                if (length - 1 === i) {
                  p.status = ProjectStatus.postponed;
                } else {
                  p.status = test.currentProjectsStatus;
                }
                p.boroughId = programBook.boroughIds.find(b => b);
                const firstAnnualPeriod = p.annualDistribution.annualPeriods.find(ap => ap);
                firstAnnualPeriod.programBookId = programBook.id;
                return projectRepository.save(p);
              })
            )
          ).map(r => r.getValue());

          // Generate DRM numbers for projects
          const resultDrm = await generateDrmNumberUseCase.execute({
            projectIds: projects.map(p => p.id),
            isCommonDrmNumber: false
          });
          assert.isTrue(resultDrm.isRight(), `should have generated DRM numbers`);

          const updateProgramBookCommand = mergeProperties(getUpdateProgramBookProps(programBook.id), test.payload);

          const result = await updateProgramBookUseCase.execute(updateProgramBookCommand);
          assert.isTrue(result.isRight());
          programBook = await programBookRepository.findById(programBook.id, [ProgramBookExpand.projects]);
          assert.strictEqual(programBook.status, test.expectedStatus);
          assert.isNotEmpty(programBook.projects, `should not be empty`);
          for (const p of programBook.projects) {
            if ([project1, project2].map(project => project.id).includes(p.id)) {
              assert.strictEqual(
                p.status,
                test.expectedProjectsStatus,
                `Project status should be ${test.expectedProjectsStatus}`
              );
            }
            if (p.id === project3.id) {
              assert.strictEqual(
                p.status,
                project3.status,
                `Project status should not have change from ${project3.status}`
              );
            }
          }
        });
      });
    });

    it(`should return unprocessableError when sharing programbook without all projects have drmNumbers`, async () => {
      const programBookResult = await programBookRepository.save(
        getProgramBook({
          annualProgram,
          status: ProgramBookStatus.programming
        })
      );
      const programBook = programBookResult.getValue();

      // const project without drm number
      const project = createEnrichedProject();
      const firstAnnualPeriod = project.annualDistribution.annualPeriods.find(ap => ap);
      firstAnnualPeriod.programBookId = programBook.id;
      await projectRepository.save(project);
      const updateProgramBookCommand: IUpdateProgramBookCommandProps = {
        ...getUpdateProgramBookProps(programBook.id),
        sharedRoles: [Role.EXECUTOR]
      };
      const result = await updateProgramBookUseCase.execute(updateProgramBookCommand);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
    });

    [
      {
        description: `programBook type with already programmed incompatible projects`,
        programBook: {
          projectTypes: [ProjectType.integrated],
          programTypes: undefined
        },
        requestError: {
          projectTypes: [ProjectType.nonIntegrated],
          programTypes: [PROGRAM_TYPE_PCPR]
        },
        expectedError: {
          code: ErrorCodes.ProgramBookProjectTypes,
          message: `Project has ${ProjectType.integrated} as projectTypeId and programBook contains only those projectTypes : ${ProjectType.nonIntegrated}`
        }
      },
      {
        description: `programBook programType with already programmed interventions`,
        programBook: {
          projectTypes: [ProjectType.nonIntegrated],
          programTypes: [PROGRAM_TYPE_PCPR]
        },
        requestError: {
          projectTypes: [ProjectType.nonIntegrated],
          programTypes: [PROGRAM_TYPE_PAR]
        },
        expectedError: {
          code: ErrorCodes.ProgramBookProjectTypes,
          message: `Project's intervention has ${PROGRAM_TYPE_PCPR} as programId and programBook contains only those programTypes : ${PROGRAM_TYPE_PAR}`
        }
      }
    ].forEach(test => {
      it(`should return unprocessableError when updating  ${test.description}`, async () => {
        const pbId = VALID_UUID;
        // intervention
        const programId = test.programBook.programTypes?.find((p: any) => p);
        const intervention = await createAndSaveIntervention({
          programId: programId ? programId : PROGRAM_TYPE_PCPR
        });
        // integrated project for programbook
        const project = await createAndSaveProject(
          {
            projectTypeId: test.programBook.projectTypes.find(p => p),
            boroughId: BoroughCode.AC,
            interventionIds: [intervention.id]
          },
          pbId
        );

        const programBookResult = await programBookRepository.save(
          getProgramBook(
            {
              annualProgram,
              status: ProgramBookStatus.programming,
              projects: [project],
              ...test.programBook
            },
            pbId
          )
        );
        const programBook = programBookResult.getValue();

        const updateProgramBookCommand: IUpdateProgramBookCommandProps = {
          ...getUpdateProgramBookProps(programBook.id),
          ...test.programBook,
          ...test.requestError
        };
        const result = await updateProgramBookUseCase.execute(updateProgramBookCommand);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
        const error = (result.value.error as any).error.find((e: any) => e);
        assert.strictEqual(error.code, test.expectedError.code);
        assert.strictEqual(error.message, test.expectedError.message);
      });
    });
  });
  describe(`UserRestrictions`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    updateProgrambookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const updateProps = test.updateProps || test.props;
        const pb = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId },
          { boroughIds: test.props.boroughIds }
        );
        const props: IUpdateProgramBookCommandProps = {
          ...getUpdateProgramBookProps(pb.id, { boroughIds: updateProps.boroughIds })
        };
        await assertUseCaseRestrictions<IUpdateProgramBookCommandProps, IEnrichedProgramBook>(
          test,
          updateProgramBookUseCase,
          props
        );
      });
    });
  });
});
