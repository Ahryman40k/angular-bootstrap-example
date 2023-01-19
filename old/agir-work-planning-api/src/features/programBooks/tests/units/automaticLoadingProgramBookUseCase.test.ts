import {
  AnnualProgramStatus,
  BoroughCode,
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectExpand,
  ProjectStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectDataCoupler } from '../../../../../tests/data/dataCouplers/projectDataCoupler';
import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { geolocatedAnnualDistributionService } from '../../../../services/annualDistribution/geolocatedAnnualDistributionService';
import { IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import {
  assertUseCaseRestrictions,
  DEFAULT_BOROUGH
} from '../../../../shared/restrictions/tests/restrictionsValidatorTestHelper';
import { EXECUTOR_DEEU, EXECUTOR_DI, PROGRAM_TYPE_PCPR } from '../../../../shared/taxonomies/constants';
import { appUtils } from '../../../../utils/utils';
import { AnnualProgram, IAnnualProgramProps } from '../../../annualPrograms/models/annualProgram';
import { AnnualProgramFindOptions } from '../../../annualPrograms/models/annualProgramFindOptions';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { createAndSaveAnnualProgram } from '../../../annualPrograms/tests/annualProgramTestHelper';
import { createAndSaveIntervention } from '../../../interventions/tests/interventionTestHelper';
import { IProjectProps } from '../../../projects/models/project';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { IProgramBookProps, ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { automaticLoadingProgramBookUseCase } from '../../useCases/automaticLoadingProgramBook/automaticLoadingProgramBookUseCase';
import { IProgramProjectCommandProps } from '../../useCases/programProject/programProjectCommand';
import { programProjectUseCase } from '../../useCases/programProject/programProjectUseCase';
import {
  createAndSaveDefaultProgramBook,
  createAndSaveProgramBook,
  programbookRestrictionsTestData
} from '../programBookTestHelper';

const DELAY = 500;

interface IProjectData {
  props: Partial<IProjectProps>;
  project?: IEnrichedProject;
  // set to true when project with these props can be added to the programBook
  compatibleProgramBooks: string[];
  // set to true when we want to generate default annualDistribution
  generateAnnualDistribution?: boolean;
}

// tslint:disable:max-func-body-length
describe(`automaticLoadingProgramBookUseCase PNI projects`, () => {
  let annualProgram: AnnualProgram;
  let programBookPni: ProgramBook;
  // preload mock data.
  async function initializeAnnualProgramAndProgramBook(): Promise<void> {
    // annual Program.
    annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.programming });
    // program book.
    programBookPni = await createAndSaveProgramBook({
      annualProgram,
      status: ProgramBookStatus.programming,
      projectTypes: [ProjectType.nonIntegrated],
      programTypes: [PROGRAM_TYPE_PCPR],
      boroughIds: [BoroughCode.VM]
    });
  }
  beforeEach(async () => {
    await initializeAnnualProgramAndProgramBook();
  });
  // tslint:disable-next-line: no-async-without-await
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
        const uuidCommandProps: IByUuidCommandProps = {
          id: NOT_FOUND_UUID
        };
        const result = await automaticLoadingProgramBookUseCase.execute(
          mergeProperties(uuidCommandProps, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error.failures;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return notFoundError when given program book id do not exists`, async () => {
      const uuidCommandProps: IByUuidCommandProps = {
        id: NOT_FOUND_UUID
      };
      const result = await automaticLoadingProgramBookUseCase.execute(uuidCommandProps);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    it(`should return notFoundError when given program book id do not exists in Annual Program`, async () => {
      // remove annual Program of mongodb.
      const annualRemoveFindOptions = AnnualProgramFindOptions.create({
        criterias: {
          id: annualProgram.id
        }
      });
      await annualProgramRepository.delete(annualRemoveFindOptions.getValue());
      const uuidCommandProps: IByUuidCommandProps = {
        id: programBookPni.id
      };
      const result = await automaticLoadingProgramBookUseCase.execute(uuidCommandProps);
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    [
      {
        description: 'given program book is automatic loading true',
        requestError: {
          status: ProgramBookStatus.programming,
          isAutomaticLoadingInProgress: true
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'isAutomaticLoadingInProgress',
            code: ErrorCodes.ProgramBookIsAutomaticLoadingInProgress,
            message: 'A program book is no longer accessible for modification during an automatic loading true'
          }
        ]
      },
      {
        description: 'given program book is a status new',
        requestError: {
          status: ProgramBookStatus.new
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'status',
            code: ErrorCodes.InvalidStatus,
            message:
              'Cannot run automatic loading. Program book status is different of programming or submittedPreliminary.'
          }
        ]
      }
    ].forEach(test => {
      it(`should return Unprocessable Entity when ${test.description}`, async () => {
        const programBook = await createAndSaveProgramBook({ ...test.requestError, annualProgram });
        const uuidCommandProps: IByUuidCommandProps = {
          id: programBook.id
        };
        const result = await automaticLoadingProgramBookUseCase.execute(uuidCommandProps);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });
  describe(`Positive`, () => {
    describe(`add projects to program book`, () => {
      let intervention: IEnrichedIntervention;
      let project: IEnrichedProject;
      beforeEach(async () => {
        intervention = await createAndSaveIntervention({ programId: PROGRAM_TYPE_PCPR });
        project = await createAndSaveProject();
        // TODO: check and validate this function to create a mapper to pass in createAndSaveProject.
        project.annualDistribution = geolocatedAnnualDistributionService.createAnnualDistribution(project);
        // TODO: check and validate this function to create a mapper to pass in createAndSaveProgramBook.
        await projectDataCoupler.coupleThem({
          project,
          interventions: [intervention]
        });
      });
      it('should project added correctly in program book', async () => {
        const uuidCommandProps: IByUuidCommandProps = {
          id: programBookPni.id
        };
        const result = await automaticLoadingProgramBookUseCase.execute(uuidCommandProps);
        // give it a delay due to fire and forget
        await appUtils.delay(DELAY);

        assert.isTrue(result.isRight());
        // ** asserts in program book.  */
        const programBookResult = await programBookRepository.findById(programBookPni.id, [
          ProgramBookExpand.projectsInterventions
        ]);
        // program book is available after the execution.
        assert.strictEqual(programBookResult.isAutomaticLoadingInProgress, false);
        // check priority scenarios => orderedProject to confirm project id is added in program book.
        const foundProjectsInOrderedProjects = programBookResult.priorityScenarios.find(priorityScenario =>
          priorityScenario.orderedProjects.find(orderedProject => orderedProject.projectId === project.id)
        );
        // is outDated.
        assert.isNotEmpty(foundProjectsInOrderedProjects);
        assert.isTrue(foundProjectsInOrderedProjects.isOutdated);

        // ** asserts in project.  */
        const projectEnrichedResult = await projectRepository.findById(project.id, [ProjectExpand.interventions]);
        // program id is added in annual period distribution.
        assert.isTrue(projectEnrichedResult.annualDistribution.annualPeriods[0].programBookId === programBookPni.id);
      });

      it(`should program book of project type integrated run correctly without projects added.`, async () => {
        const programBook = await createAndSaveProgramBook({
          annualProgram,
          status: ProgramBookStatus.programming,
          projectTypes: [ProjectType.integrated]
        });
        const uuidCommandProps: IByUuidCommandProps = {
          id: programBook.id
        };
        const result = await automaticLoadingProgramBookUseCase.execute(uuidCommandProps);
        // give it a delay due to fire and forget
        await appUtils.delay(DELAY);

        assert.isTrue(result.isRight());
        // ** asserts in program book.  */
        const programBookResult = await programBookRepository.findById(programBookPni.id, [
          ProgramBookExpand.projectsInterventions
        ]);
        // program book is available after the execution.
        assert.strictEqual(programBookResult.isAutomaticLoadingInProgress, false);
        // check priority scenarios => orderedProject to confirm project id is not added in program book.
        const foundProjectsInOrderedProjects = programBookResult.priorityScenarios.find(priorityScenario =>
          priorityScenario.orderedProjects.find(orderedProject => orderedProject.projectId === project.id)
        );
        assert.isUndefined(foundProjectsInOrderedProjects);
      });
    });
  });
});

describe(`automaticLoadingProgramBookUseCase PI projects`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });
  // NOSONAR
  describe(`Positive`, () => {
    // logic
    // programBook
    //  programBook should be programming ou submittedPreliminary
    // projects
    // status not equal to canceled
    // annualProgramBookYear is between startYeat and endYear
    // projectTypeId exists in programBook projectTypes
    // boroughId exists in programBook boroughIds or boroughIds is null or boroughIds contains MTL
    // does not belongs to any programBook for the sameYear

    const defaultYear = appUtils.getCurrentYear();
    const defaultAnnualProgramProps: Partial<IAnnualProgramProps> = {
      year: defaultYear,
      executorId: EXECUTOR_DI
    };
    const defaultProgramBookProps: Partial<IProgramBookProps> = {
      boroughIds: [BoroughCode.ANJ, BoroughCode.AC, BoroughCode.CDNNDG],
      projectTypes: [ProjectType.integrated, ProjectType.integratedgp, ProjectType.other],
      status: ProgramBookStatus.programming
    };
    const programBookWithBoroudhIdsMtlProps = { ...defaultProgramBookProps, boroughIds: [BoroughCode.MTL] };

    const defaultProjectProps: Partial<IProjectProps> = {
      status: ProjectStatus.programmed,
      executorId: EXECUTOR_DI,
      boroughId: BoroughCode.ANJ,
      startYear: defaultYear,
      endYear: defaultYear + 1,
      projectTypeId: ProjectType.integratedgp
    };
    let defaultProgramBook: ProgramBook; // program book used to create project with programBook
    let programBookWithBoroughIds: ProgramBook; // programBook with defaultBoroughIds
    let programBookWithBoroudhIdsMtl: ProgramBook; // programBook with boroughIds = [MTL]
    let projectDatas: IProjectData[];
    let programBooks: ProgramBook[];
    // init Data
    async function resetProjectData() {
      defaultProgramBook = await createAndSaveDefaultProgramBook(defaultAnnualProgramProps, defaultProgramBookProps);
      programBookWithBoroughIds = await createAndSaveDefaultProgramBook(
        defaultAnnualProgramProps,
        defaultProgramBookProps
      );
      programBookWithBoroudhIdsMtl = await createAndSaveDefaultProgramBook(
        defaultAnnualProgramProps,
        programBookWithBoroudhIdsMtlProps
      );
      programBooks = [programBookWithBoroughIds, programBookWithBoroudhIdsMtl];
      projectDatas = [
        {
          props: {
            ...defaultProjectProps
          },
          compatibleProgramBooks: [programBookWithBoroughIds.id, programBookWithBoroudhIdsMtl.id]
        },
        {
          props: {
            ...defaultProjectProps,
            boroughId: BoroughCode.ANJ,
            status: ProjectStatus.postponed,
            projectTypeId: ProjectType.other
          },
          compatibleProgramBooks: [programBookWithBoroughIds.id, programBookWithBoroudhIdsMtl.id]
        },
        {
          props: {
            ...defaultProjectProps,
            boroughId: BoroughCode.CDNNDG,
            status: ProjectStatus.finalOrdered,
            projectTypeId: ProjectType.integratedgp
          },
          compatibleProgramBooks: [programBookWithBoroughIds.id, programBookWithBoroudhIdsMtl.id]
        },
        {
          props: {
            ...defaultProjectProps,
            boroughId: BoroughCode.CDNNDG,
            status: ProjectStatus.preliminaryOrdered,
            projectTypeId: ProjectType.integratedgp
          },
          compatibleProgramBooks: [programBookWithBoroughIds.id, programBookWithBoroudhIdsMtl.id]
        },
        {
          props: {
            ...defaultProjectProps,
            boroughId: BoroughCode.ANJ,
            status: ProjectStatus.planned,
            endYear: defaultYear,
            projectTypeId: ProjectType.other
          },
          compatibleProgramBooks: [programBookWithBoroughIds.id, programBookWithBoroudhIdsMtl.id]
        },
        {
          props: {
            ...defaultProjectProps,
            status: ProjectStatus.replanned,
            boroughId: BoroughCode.LSL
          },
          compatibleProgramBooks: [programBookWithBoroudhIdsMtl.id]
        },
        // these projects should not be added to any programBook
        {
          props: {
            ...defaultProjectProps,
            status: ProjectStatus.canceled
          },
          compatibleProgramBooks: []
        },
        {
          props: {
            ...defaultProjectProps
          },
          generateAnnualDistribution: true,
          compatibleProgramBooks: []
        },
        {
          props: {
            ...defaultProjectProps,
            startYear: defaultYear - 2,
            endYear: defaultYear - 1
          },
          compatibleProgramBooks: []
        },
        {
          props: {
            ...defaultProjectProps,
            startYear: defaultYear + 1,
            endYear: defaultYear + 2
          },
          compatibleProgramBooks: []
        },
        {
          props: {
            ...defaultProjectProps,
            executorId: EXECUTOR_DEEU
          },
          compatibleProgramBooks: []
        }
      ];
    }

    beforeEach(async () => {
      await resetProjectData();
      for (const data of projectDatas) {
        const pr = await createAndSaveProject(
          data.props,
          data.generateAnnualDistribution ? defaultProgramBook.id : null
        );
        data.project = pr;
      }
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    [
      `should add projects with only boroughId in [ANJ, AC, CDNNDG]`,
      `should add projects with any boroughId when programBook boroughIds contain MTL`
    ].forEach((scenario, index) => {
      it(scenario, async () => {
        const currentProgramBook = programBooks[index];
        const uuidCommandProps: IByUuidCommandProps = {
          id: currentProgramBook.id
        };
        const result = await automaticLoadingProgramBookUseCase.execute(uuidCommandProps);

        assert.isTrue(result.isRight());
        // ** asserts in program book.  */
        // asserts that automaticLoadingProcess is terminated
        let programBookResult;
        do {
          await appUtils.delay(DELAY);
          programBookResult = await programBookRepository.findById(currentProgramBook.id, [ProgramBookExpand.projects]);
        } while (programBookResult && programBookResult.isAutomaticLoadingInProgress);

        assert.strictEqual(programBookResult.isAutomaticLoadingInProgress, false);
        const compatibleProjects = projectDatas
          .filter(el => el.compatibleProgramBooks.includes(currentProgramBook.id))
          .map(el => el.project);
        const nonCompatibleProjects = projectDatas
          .filter(el => !el.compatibleProgramBooks.includes(currentProgramBook.id))
          .map(el => el.project);

        // asset that all compatible are added
        for (const project of compatibleProjects) {
          // check priority scenarios => orderedProjcet to confirm project id is added in program book.
          const priorityScenario = programBookResult.priorityScenarios.find(ps =>
            ps.orderedProjects.find(orderedProject => orderedProject.projectId === project.id)
          );
          // is outDated.
          assert.isNotEmpty(priorityScenario);
          assert.isTrue(priorityScenario.isOutdated);

          // ** asserts in project.  */
          const projectEnrichedResult = await projectRepository.findById(project.id, [ProjectExpand.interventions]);
          // program id is added in annual period distribution.
          const ap = projectEnrichedResult.annualDistribution.annualPeriods.find(
            annualPeriod => annualPeriod.programBookId === currentProgramBook.id
          );
          assert.isDefined(ap);
        }
        // asset that non compatible projects are not added
        for (const project of nonCompatibleProjects) {
          // check priority scenarios => orderedProjcet to confirm project id is not added in program book.
          const priorityScenario = programBookResult.priorityScenarios.find(ps =>
            ps.orderedProjects.find(orderedProject => orderedProject.projectId === project.id)
          );
          assert.isUndefined(priorityScenario);

          const projectEnrichedResult = await projectRepository.findById(project.id, [ProjectExpand.interventions]);
          // program id is not added in annual period distribution.
          const ap = projectEnrichedResult.annualDistribution.annualPeriods.find(
            annualPeriod => annualPeriod.programBookId === currentProgramBook.id
          );
          assert.isUndefined(ap);
        }
      });
    });
  });
});
describe(`automaticLoadingProgramBookUseCase - UserRestrictions`, () => {
  afterEach(async () => {
    await destroyDBTests();
  });

  programbookRestrictionsTestData.forEach(test => {
    it(test.scenario, async () => {
      const project = await createAndSaveProject({
        projectTypeId: ProjectType.integrated,
        status: ProjectStatus.programmed,
        boroughId: test.props.boroughIds?.find(b => b) || DEFAULT_BOROUGH
      });
      const pb = await createAndSaveDefaultProgramBook(
        { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
        { boroughIds: test.props.boroughIds, status: ProgramBookStatus.programming }
      );
      const props: IProgramProjectCommandProps = {
        programBookId: pb.id,
        projectId: project.id
      };
      await assertUseCaseRestrictions<IProgramProjectCommandProps, IEnrichedProject>(
        test,
        programProjectUseCase,
        props
      );
    });
  });
});
