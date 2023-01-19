import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  IAsset,
  IEnrichedIntervention,
  IEnrichedPriorityLevel,
  IEnrichedProgramBook,
  IEnrichedProject,
  InterventionType,
  IOrderedProject,
  IOrderedProjectsPaginatedSearchRequest,
  IPlainPriorityLevel,
  IPriorityLevelCriteria,
  IProjectRank,
  PriorityCode,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectCategory,
  ProjectSubCategory
} from '@villemontreal/agir-work-planning-lib';
import { AssetType, InterventionStatus, ProjectStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { maxBy, sortBy } from 'lodash';
import sinon = require('sinon');

import { constants } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { PriorityLevel } from '../../../src/features/priorityScenarios/models/priorityLevel';
import { getOrderedProject } from '../../../src/features/priorityScenarios/tests/orderedProjectTestHelper';
import {
  getPlainPriorityLevelProps,
  getPriorityScenario,
  getProjectCategoryCriteriaProps,
  orderByDefaultSortCriterias
} from '../../../src/features/priorityScenarios/tests/priorityScenarioTestHelper';
import { IUpdatePriorityLevelsCommandProps } from '../../../src/features/priorityScenarios/useCases/updatePriorityLevels/updatePriorityLevelsCommand';
import { updatePriorityLevelsUseCase } from '../../../src/features/priorityScenarios/useCases/updatePriorityLevels/updatePriorityLevelsUseCase';
import { PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES } from '../../../src/features/priorityScenarios/validators/priorityScenarioValidator';
import { programBookMapperDTO } from '../../../src/features/programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import {
  createAndSaveDefaultProgramBook,
  createAndSaveProgramBook,
  getProgramBook,
  programbookRestrictionsTestData
} from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ProjectFindOptions } from '../../../src/features/projects/models/projectFindOptions';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { getServicePriorityProps } from '../../../src/features/servicePriority/tests/servicePriorityTestHelper';
import { FindByIdOptions } from '../../../src/shared/findOptions/findByIdOptions';
import { assertUseCaseRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import { REQUESTOR_SGPI, SERVICE_SUM, WORK_TYPE_RECONSTRUCTION } from '../../../src/shared/taxonomies/constants';
import { hasDuplicates } from '../../../src/utils/arrayUtils';
import { appUtils } from '../../../src/utils/utils';
import { programBookDataCoupler } from '../../data/dataCouplers/programBookDataCoupler';
import { IProjectCouples, projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { userMocks } from '../../data/userMocks';
import { programBookPriorityScenariosTestClient } from '../../utils/testClients/programBookPriorityScenariosTestClient';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Program Book Priority Scenarios', () => {
  const currentYear = appUtils.getCurrentYear();

  after(async () => {
    await integrationAfter();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // DATA
  interface IMockData {
    annualProgram: AnnualProgram;
    annualProgramPreviousYear: AnnualProgram;
    programBook: ProgramBook;
    programBookPreviousYear: ProgramBook;
    priorityLevels: IPlainPriorityLevel[];
    projects: {
      projectCompleted: IEnrichedProject;
      projectDeeu: IEnrichedProject;
      projectWorkType: IEnrichedProject;
      projectAsset: IEnrichedProject;
      projectInterventionType: IEnrichedProject;
      projectServicePriorities: IEnrichedProject;
    };
    interventions: {
      interventionCompleted: IEnrichedIntervention;
      interventionDre: IEnrichedIntervention;
      interventionDeeu: IEnrichedIntervention;
      interventionWorkType: IEnrichedIntervention;
      interventionAsset: IEnrichedIntervention;
      interventionType: IEnrichedIntervention;
      interventionServicePriorities: IEnrichedIntervention;
    };
    projectRankBody: IProjectRank;
  }

  async function setInitialData() {
    const mock: IMockData = {
      annualProgram: null,
      annualProgramPreviousYear: null,
      programBook: null,
      programBookPreviousYear: null,
      priorityLevels: [],
      projects: {
        projectCompleted: null,
        projectDeeu: null,
        projectWorkType: null,
        projectAsset: null,
        projectInterventionType: null,
        projectServicePriorities: null
      },
      interventions: {
        interventionDre: null,
        interventionCompleted: null,
        interventionDeeu: null,
        interventionWorkType: null,
        interventionAsset: null,
        interventionType: null,
        interventionServicePriorities: null
      },
      projectRankBody: null
    };
    await setAnnualPrograms(mock);
    await setProgramBooks(mock);
    await setProjectCategoryAndSubCategoryCriteriaData(mock);
    await setProjectWorkTypeCriteriaData(mock);
    await setProjectRequestorCriteriaData(mock);
    await setProjectInterventionTypeCriteriaData(mock);
    await setProjectAssetCriteriaData(mock);
    await setProjectServicePrioritiesCriteriaData(mock);
    await setInterventions(mock);
    setPriorityLevelsInputs(mock);
    return mock;
  }

  interface IInitialDataForPost {
    initialData: IMockData;
    programBook: ProgramBook;
    priorityLevels: IPlainPriorityLevel[];
    sortedProjectIds: string[];
    defaultSortedProjectLength: number;
  }

  async function setInitialDataForPost() {
    const mock: IInitialDataForPost = {} as IInitialDataForPost;
    mock.initialData = await setInitialData();
    mock.programBook = await programBookRepository.findOne(
      FindByIdOptions.create({
        criterias: {
          id: mock.initialData.programBook.id
        },
        expand: ProgramBookExpand.projectsInterventions
      }).getValue()
    );
    mock.priorityLevels = mock.initialData.priorityLevels;
    const stage1 = mock.programBook.projects?.filter(
      project =>
        project.annualDistribution.annualPeriods.filter(annualPeriod => annualPeriod.categoryId === 'completing')
          ?.length !== 0
    );
    mock.defaultSortedProjectLength = stage1.length;
    const notInStage1 = mock.programBook.projects?.filter(
      project =>
        project.annualDistribution.annualPeriods.filter(annualPeriod => annualPeriod.categoryId === 'completing')
          ?.length === 0
    );
    const stage2 = notInStage1.filter(
      project =>
        project.annualDistribution.annualPeriods.filter(annualPeriod => annualPeriod.categoryId === 'new')?.length !== 0
    );
    mock.sortedProjectIds = (await orderByDefaultSortCriterias(stage1.concat(stage2))).map(project => project.id);

    mock.programBook.priorityScenarios[0].outDate(true);
    mock.programBook = (
      await programBookRepository.save(mock.programBook, { expand: [ProgramBookExpand.projects] })
    ).getValue();

    return mock;
  }

  async function setMockWithOnlyTheDefaultCriteriaForPost(mock: IInitialDataForPost) {
    const priorityScenario = getPriorityScenario({
      ...mock.programBook.priorityScenarios[0].props,
      priorityLevels: [mock.programBook.priorityScenarios[0].priorityLevels[0]]
    });
    mock.programBook.priorityScenarios[0] = priorityScenario;
    mock.priorityLevels = [mock.priorityLevels[0]];
    mock.programBook = (
      await programBookRepository.save(
        getProgramBook({
          ...mock.programBook.props, // should not do that
          priorityScenarios: mock.programBook.priorityScenarios
        })
      )
    ).getValue();
    return mock;
  }

  async function setMockScenarioWithWrongFlagOutdatedForPost(mock: IInitialDataForPost) {
    mock.programBook.priorityScenarios[0].outDate(false);
    mock.programBook = (await programBookRepository.save(mock.programBook)).getValue();
    return mock;
  }

  async function setAnnualPrograms(mock: IMockData) {
    mock.annualProgramPreviousYear = await createAndSaveAnnualProgram({
      status: AnnualProgramStatus.programming,
      year: currentYear - 1
    });
    mock.annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.programming });
  }

  async function setProgramBooks(mock: IMockData) {
    mock.programBookPreviousYear = await createAndSaveProgramBook({
      status: ProgramBookStatus.programming,
      annualProgram: mock.annualProgramPreviousYear
    });
    mock.programBook = await createAndSaveProgramBook({
      status: ProgramBookStatus.programming,
      annualProgram: mock.annualProgram
    });
  }

  async function setInterventions(mock: IMockData) {
    mock.interventions.interventionCompleted = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        interventionYear: mock.annualProgramPreviousYear.year,
        planificationYear: mock.annualProgramPreviousYear.year
      },
      mock.projects.projectCompleted
    );
    mock.interventions.interventionDre = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        requestorId: 'dre',
        interventionYear: mock.annualProgram.year,
        planificationYear: mock.annualProgram.year
      },
      mock.projects.projectCompleted
    );
    mock.interventions.interventionDeeu = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        requestorId: 'deeu',
        interventionYear: mock.annualProgram.year,
        planificationYear: mock.annualProgram.year
      },
      mock.projects.projectDeeu
    );
    mock.interventions.interventionAsset = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        assets: [
          {
            typeId: AssetType.aqueductSegment,
            ownerId: 'test',
            geometry: {
              type: 'LineString',
              coordinates: [
                [-70.91275691986084, 46.94926618831732],
                [-70.91279983520508, 46.942674188146064]
              ]
            }
          }
        ] as IAsset[],
        interventionYear: mock.annualProgram.year,
        planificationYear: mock.annualProgram.year
      },
      mock.projects.projectAsset
    );
    mock.interventions.interventionWorkType = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        workTypeId: WORK_TYPE_RECONSTRUCTION,
        interventionYear: mock.annualProgram.year,
        planificationYear: mock.annualProgram.year
      },
      mock.projects.projectWorkType
    );
    mock.interventions.interventionType = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        interventionTypeId: InterventionType.initialNeed,
        interventionYear: mock.annualProgram.year,
        planificationYear: mock.annualProgram.year
      },
      mock.projects.projectInterventionType
    );
    mock.interventions.interventionServicePriorities = await interventionDataGenerator.store(
      {
        status: InterventionStatus.integrated,
        requestorId: REQUESTOR_SGPI,
        interventionYear: mock.annualProgram.year,
        planificationYear: mock.annualProgram.year
      },
      mock.projects.projectServicePriorities
    );
  }

  async function setProjectCategoryAndSubCategoryCriteriaData(mock: IMockData) {
    mock.projects.projectCompleted = await projectDataGenerator.store({
      status: ProjectStatus.programmed,
      startYear: mock.annualProgramPreviousYear.year,
      endYear: mock.annualProgram.year,
      subCategoryIds: [ProjectSubCategory.successive]
    });
    const dataToCouple: IProjectCouples = {
      project: mock.projects.projectCompleted,
      interventions: [],
      programBooksCoupler: [
        { year: mock.annualProgramPreviousYear.year, programBook: mock.programBookPreviousYear },
        { year: mock.annualProgram.year, programBook: mock.programBook }
      ]
    };
    await projectDataCoupler.coupleThem(dataToCouple);
  }

  async function setProjectWorkTypeCriteriaData(mock: IMockData) {
    mock.projects.projectWorkType = await projectDataGenerator.store({
      startYear: mock.annualProgram.year,
      endYear: mock.annualProgram.year
    });
    await projectDataCoupler.coupleThem({
      project: mock.projects.projectWorkType,
      interventions: [],
      programBooksCoupler: [{ year: mock.annualProgram.year, programBook: mock.programBook }]
    });
  }

  async function setProjectInterventionTypeCriteriaData(mock: IMockData) {
    mock.projects.projectInterventionType = await projectDataGenerator.store({
      startYear: mock.annualProgram.year,
      endYear: mock.annualProgram.year
    });
    await projectDataCoupler.coupleThem({
      project: mock.projects.projectInterventionType,
      interventions: [],
      programBooksCoupler: [{ year: mock.annualProgram.year, programBook: mock.programBook }]
    });
  }

  async function setProjectServicePrioritiesCriteriaData(mock: IMockData) {
    mock.projects.projectServicePriorities = await projectDataGenerator.store({
      servicePriorities: [{ service: SERVICE_SUM, priorityId: PriorityCode.mediumPriority }],
      startYear: mock.annualProgram.year,
      endYear: mock.annualProgram.year
    });
    await projectDataCoupler.coupleThem({
      project: mock.projects.projectServicePriorities,
      interventions: [],
      programBooksCoupler: [{ year: mock.annualProgram.year, programBook: mock.programBook }]
    });
  }

  async function setProjectRequestorCriteriaData(mock: IMockData) {
    mock.projects.projectDeeu = await projectDataGenerator.store({
      startYear: mock.annualProgram.year,
      endYear: mock.annualProgram.year
    });
    await projectDataCoupler.coupleThem({
      project: mock.projects.projectDeeu,
      interventions: [],
      programBooksCoupler: [{ year: mock.annualProgram.year, programBook: mock.programBook }]
    });
  }

  async function setProjectAssetCriteriaData(mock: IMockData) {
    mock.projects.projectAsset = await projectDataGenerator.store({
      startYear: mock.annualProgram.year,
      endYear: mock.annualProgram.year
    });
    await projectDataCoupler.coupleThem({
      project: mock.projects.projectAsset,
      interventions: [],
      programBooksCoupler: [{ year: mock.annualProgram.year, programBook: mock.programBook }]
    });
  }

  function setPriorityLevelsInputs(mock: IMockData) {
    mock.priorityLevels = [
      getPlainPriorityLevelProps(),
      {
        criteria: {
          assetTypeId: [],
          projectCategory: [getProjectCategoryCriteriaProps()],
          requestorId: [],
          workTypeId: []
        }
      },
      {
        criteria: {
          workTypeId: [WORK_TYPE_RECONSTRUCTION]
        }
      },
      {
        criteria: {
          assetTypeId: [AssetType.aqueductSegment]
        }
      },
      {
        criteria: {
          interventionType: [InterventionType.initialNeed]
        }
      },
      {
        criteria: {
          servicePriorities: [getServicePriorityProps()]
        }
      }
    ].map((props, index) => {
      return {
        ...getPlainPriorityLevelProps({
          ...props,
          rank: index + 1
        }),
        sortCriterias: []
      };
    });
  }

  function setMockWithNonExistingProjectRank(mock: IMockData) {
    const projectWithLastExistingRank = maxBy(mock.programBook.priorityScenarios[0].orderedProjects, p => p.rank);
    const nonExistingRank = projectWithLastExistingRank.rank + 1;
    mock.projectRankBody.newRank = nonExistingRank;
  }

  async function setMockWithAManuallyOrderedRank(mock: IMockData) {
    const programBook = await programBookRepository.findById(mock.programBook.id);

    const orderedProject = programBook.priorityScenarios[0].orderedProjects.find(
      op => op.projectId === mock.projects.projectWorkType.id
    );

    const updatedOrderedProject = getOrderedProject({
      projectId: orderedProject.projectId,
      initialRank: orderedProject.initialRank,
      audit: orderedProject.audit,
      isManuallyOrdered: true,
      rank: mock.projectRankBody.newRank
    });

    const index = programBook.priorityScenarios[0].orderedProjects.findIndex(
      op => op.projectId === mock.projects.projectWorkType.id
    );

    programBook.priorityScenarios[0].orderedProjects.splice(index, 1, updatedOrderedProject);

    await programBookRepository.save(programBook);
  }

  // ASSERT
  function assertProgramBookPriorityLevels(priorityLevels: IEnrichedPriorityLevel[]) {
    priorityLevels.forEach((priorityLevel, index) => {
      const rank = index + 1;
      assert.strictEqual(priorityLevel.rank, rank, `rank ${rank}`);
      assert.strictEqual(priorityLevel.isSystemDefined, rank === 1, `isSystemDefined ${rank}`);
      assert.isDefined(priorityLevel.projectCount, `projectCount is defined ${rank}`);
      assertPriorityLevelCriteria(priorityLevel.criteria);
    });
  }

  function assertPriorityLevelCriteria(criteria: IPriorityLevelCriteria) {
    assert.isNotEmpty(criteria);
    for (const key of Object.keys(criteria)) {
      const findDuplicate = criteria[key].filter(
        (criterion: string, index: number) => criteria[key].indexOf(criterion) !== index
      );
      assert.isEmpty(findDuplicate);
    }
  }

  function assertOrderedProjects(orderedProjects: IOrderedProject[]) {
    const msg = `myOrderedProjects: [\n ${orderedProjects.map(orderedProject =>
      JSON.stringify(orderedProject, null, 2)
    )}\n]`;
    assert.isNotEmpty(orderedProjects);
    assert.strictEqual(orderedProjects[0].levelRank, 1, msg);
    orderedProjects.forEach(orderedProject => assert.isNumber(orderedProject.initialRank, msg));
    orderedProjects.forEach(orderedProject => {
      assert.isFalse(
        hasDuplicates(orderedProjects, myOrderedProject => myOrderedProject.rank === orderedProject.rank),
        `orderedProject.rank: ${orderedProject.rank} is duplicate \n\n${msg}`
      );
      assert.isNumber(orderedProject.rank, `The priority rank should be a number \n\n${msg}`);
    });
  }

  async function assertBeforeTestForPostIsOk(mock: IInitialDataForPost): Promise<void> {
    const mockgooseDbProgramBook = await programBookRepository.findOne(
      FindByIdOptions.create({
        criterias: {
          id: mock.initialData.programBook.id
        },
        expand: ProgramBookExpand.projectsInterventions
      }).getValue()
    );
    const mappedFromDB = await programBookMapperDTO.getFromModel(mockgooseDbProgramBook, {
      hasProjects: true,
      hasAnnualProgram: true
    });
    const mappedMock = await programBookMapperDTO.getFromModel(mock.programBook, {
      hasProjects: true,
      hasAnnualProgram: true
    });
    assert.deepEqual(mappedFromDB, mappedMock);
    assert.strictEqual(mock.initialData.programBook.id, mock.programBook.id);
    assert.deepEqual(mappedFromDB.projects.items.length, 6);
    assert.deepEqual(mappedMock.projects.items.length, 6);
    let ordonedItemsFromBd: IEnrichedProject[] = mappedFromDB.projects.items;
    ordonedItemsFromBd = sortBy(ordonedItemsFromBd, ['boroughId', 'id']);
    assert.deepEqual(
      mock.sortedProjectIds,
      ordonedItemsFromBd.map(item => item.id)
    );
    assert.notEqual(mock.initialData.annualProgramPreviousYear.year, mock.initialData.annualProgram.year);
    const x = mappedFromDB.projects.items.filter(projectItem => isProjectPluriAnnuel(projectItem));
    assert.isNotEmpty(x);

    const y = mappedFromDB.projects.items.filter(projectItem =>
      projectItem.annualDistribution.annualPeriods.find(
        annualPeriod => annualPeriod.categoryId === ProjectCategory.completing
      )
    );
    assert.isNotEmpty(y);
  }

  function isProjectPluriAnnuel(project: IEnrichedProject): boolean {
    return project.startYear !== project.endYear;
  }

  describe('/v1/programBooks/{programBookId}/priorityScenarios/{priorityScenarioId}/priorityLevels > PUT', () => {
    let mock: IMockData;
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      mock = await setInitialData();
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES.forEach(status => {
      it(`Positive - Should be able to add priority levels with program book status ${status}`, async () => {
        const currentProgramBook = await createAndSaveProgramBook({
          annualProgram: mock.annualProgram,
          status
        });
        const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
          currentProgramBook.id,
          currentProgramBook.priorityScenarios[0].id,
          mock.priorityLevels
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const myProgramBook: IEnrichedProgramBook = response.body;
        const myPriorityLevels = myProgramBook.priorityScenarios[0].priorityLevels;
        assertProgramBookPriorityLevels(myPriorityLevels);
      });
    });

    it('C66271 - Positive - Should have a project for each priority level', async () => {
      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.priorityLevels
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      const myPriorityLevels = myProgramBook.priorityScenarios[0].priorityLevels;
      assertProgramBookPriorityLevels(myPriorityLevels);
    });

    it('C66340 - Negative - Should not be able to save priority levels to program book when priority levels is empty', async () => {
      const emptyPriorityLevels: IPlainPriorityLevel[] = [];
      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        emptyPriorityLevels
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C66341 - Negative - Should not be able to save priority levels to program book when criteria is missing', async () => {
      const missingCriteria: IPriorityLevelCriteria = {
        assetTypeId: [],
        projectCategory: [],
        requestorId: [],
        workTypeId: [],
        interventionType: [],
        servicePriorities: []
      };
      mock.priorityLevels[1].criteria = missingCriteria;
      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.priorityLevels
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C66342 - Negative - Should not be able to save priority levels to program book when taxonomy is missing', async () => {
      const wrongTaxonomy = 'wrongTaxonomy';
      for (const key of Object.keys(mock.priorityLevels[0].criteria)) {
        mock.priorityLevels[0].criteria[key] = [wrongTaxonomy];
        const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
          mock.programBook.id,
          mock.programBook.priorityScenarios[0].id,
          mock.priorityLevels
        );
        assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      }
    });

    it('C66343 - Positive - Should save priority levels to program book in rank order', async () => {
      const swap = mock.priorityLevels[0];
      mock.priorityLevels[0] = mock.priorityLevels[1];
      mock.priorityLevels[1] = swap;
      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.priorityLevels
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it('C66344 - Positive - Should calculate priority levels project count for a criteria projectCategory with category', async () => {
      const programBook = await programBookRepository.findOne(
        FindByIdOptions.create({
          criterias: {
            id: mock.programBook.id
          },
          expand: ProgramBookExpand.projects
        }).getValue()
      );
      mock.priorityLevels[1].criteria = {
        assetTypeId: [],
        projectCategory: [getProjectCategoryCriteriaProps()],
        requestorId: [],
        workTypeId: [],
        interventionType: [],
        servicePriorities: []
      };
      const stage1 = programBook.projects?.filter(
        project =>
          project.annualDistribution.annualPeriods.filter(annualPeriod => annualPeriod.categoryId === 'completing')
            ?.length === 0
      );
      const stage2 = stage1.filter(
        project =>
          project.annualDistribution.annualPeriods.filter(annualPeriod => annualPeriod.categoryId === 'new')?.length ===
          0
      );
      const myStage1Count = programBook.projects?.length - stage1?.length || 0;
      const myStage2Count = stage1.length - stage2?.length || 0;

      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.priorityLevels
      );

      const myProgramBook: IEnrichedProgramBook = response.body;
      const myPriorityLevels = myProgramBook.priorityScenarios[0].priorityLevels;
      assert.strictEqual(myPriorityLevels[0].projectCount, myStage1Count);
      assert.strictEqual(myPriorityLevels[1].projectCount, myStage2Count);
    });

    it('Positive - Should calculate priority levels project count for a criteria projectCategory with category and subcategory ', async () => {
      const programBook = await programBookRepository.findOne(
        FindByIdOptions.create({
          criterias: {
            id: mock.programBook.id
          },
          expand: ProgramBookExpand.projects
        }).getValue()
      );
      mock.priorityLevels[1].criteria = {
        assetTypeId: [],
        projectCategory: [{ category: ProjectCategory.new, subCategory: ProjectSubCategory.successive }],
        requestorId: [],
        workTypeId: [],
        interventionType: [],
        servicePriorities: []
      };
      const stage1 = programBook.projects?.filter(
        project =>
          project.annualDistribution.annualPeriods.filter(
            annualPeriod => annualPeriod.categoryId === ProjectCategory.completing
          )?.length === 0
      );
      const stage2 = stage1.filter(
        project =>
          project.annualDistribution.annualPeriods.filter(
            annualPeriod =>
              annualPeriod.categoryId === ProjectCategory.new &&
              project.subCategoryIds.includes(ProjectSubCategory.successive)
          )?.length === 0
      );
      const myStage1Count = programBook.projects?.length - stage1?.length;
      const myStage2Count = stage1.length - stage2?.length;

      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.priorityLevels
      );

      const myProgramBook: IEnrichedProgramBook = response.body;
      const myPriorityLevels = myProgramBook.priorityScenarios[0].priorityLevels;
      assert.strictEqual(myPriorityLevels[0].projectCount, myStage1Count);
      assert.strictEqual(myPriorityLevels[1].projectCount, myStage2Count);
    });

    it('Positive - Should save priority levels to program book in rank order and sort projects by sortCriterias', async () => {
      const swap = mock.priorityLevels[0];
      mock.priorityLevels[0] = mock.priorityLevels[1];
      mock.priorityLevels[1] = swap;
      const response = await programBookPriorityScenariosTestClient.updatePriorityLevels(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.priorityLevels
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const expectedProgramBook: IEnrichedProgramBook = response.body;
      const projects = Object.values(mock.projects);
      assert.deepEqual(
        (await orderByDefaultSortCriterias(projects)).map(project => project.id),
        expectedProgramBook.priorityScenarios[0].orderedProjects.items.map(orderedProject => orderedProject.projectId)
      );
    });
    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const currentProgramBook = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
          {
            boroughIds: test.props.boroughIds,
            status: ProgramBookStatus.programming
          }
        );
        const props: IUpdatePriorityLevelsCommandProps = {
          programBookId: currentProgramBook.id,
          priorityScenarioId: currentProgramBook.priorityScenarios[0].id,
          priorityLevels: mock.priorityLevels
        };
        await assertUseCaseRestrictions<IUpdatePriorityLevelsCommandProps, IEnrichedProgramBook>(
          test,
          updatePriorityLevelsUseCase,
          props
        );
      });
    });
  });

  describe('/v1/programBooks/:programBookId/priorityScenarios/:priorityScenarioId/calculations > POST', () => {
    let mock: IInitialDataForPost;

    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await destroyDBTests();
      mock = await setInitialDataForPost();
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    it('C66597 - Positive - Should save ordered projects to program book in borrow and project id order', async () => {
      await assertBeforeTestForPostIsOk(mock);
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      assert.isNotEmpty(myProgramBook);
      const myOrderedProjects: IOrderedProject[] = myProgramBook.priorityScenarios[0]?.orderedProjects?.items;
      assert.isFalse(myProgramBook.priorityScenarios[0].isOutdated);
      assert.strictEqual(
        myOrderedProjects.length,
        mock.programBook.projects?.length,
        `myOrderedProjects: [\n ${myOrderedProjects.map(orderedProject =>
          JSON.stringify(orderedProject, null, 2)
        )}\n]\n mock.programBook.projects?: [\n ${mock.programBook.projects?.map(orderedProject =>
          JSON.stringify(orderedProject, null, 2)
        )}\n]`
      );
      assertOrderedProjects(myOrderedProjects);
      assert.deepStrictEqual(
        mock.sortedProjectIds,
        myOrderedProjects.map(orderedProject => orderedProject.projectId)
      );
      myOrderedProjects.forEach(orderedProject => {
        assert.isFalse(
          hasDuplicates(myOrderedProjects, myOrderedProject => myOrderedProject.projectId === orderedProject.projectId)
        );
      });
    });

    PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES.forEach(status => {
      it(`Positive - Should save ordered projects to program book with status ${status}`, async () => {
        await assertBeforeTestForPostIsOk(mock);
        const programBook = await createAndSaveProgramBook({
          ...mock.programBook.props, // should not do that but those mock setup...
          status
        });
        assert.strictEqual(programBook.status, status);
        const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
          programBook.id,
          programBook.priorityScenarios[0].id
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
      });
    });

    it('C66672 - Negative - Should not save ordered projects to program book when no change has occured', async () => {
      await assertBeforeTestForPostIsOk(mock);
      mock = await setMockScenarioWithWrongFlagOutdatedForPost(mock);
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C66683 - Positive - Should save level rank for each ordered projects who meet the criteria of its level', async () => {
      await assertBeforeTestForPostIsOk(mock);
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      assert.isNotEmpty(myProgramBook);
      const myOrderedProjects: IOrderedProject[] = myProgramBook.priorityScenarios[0]?.orderedProjects?.items;
      assert.strictEqual(myOrderedProjects.length, mock.programBook.projects.length);
      assertOrderedProjects(myOrderedProjects);
      const myDefaultOrderedProjects: IOrderedProject[] = myOrderedProjects.filter(
        orderedProject => orderedProject.levelRank === 1
      );
      assert.isNotEmpty(myDefaultOrderedProjects);
      assert.strictEqual(myDefaultOrderedProjects.length, mock.defaultSortedProjectLength);
    });

    it.skip('C66684 - Negative - Should not save level rank of ordered projects who do not meet the criteria at any level', async () => {
      await assertBeforeTestForPostIsOk(mock);
      mock = await setMockWithOnlyTheDefaultCriteriaForPost(mock);
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      assert.isNotEmpty(myProgramBook);
      const myOrderedProjects: IOrderedProject[] = myProgramBook.priorityScenarios[0]?.orderedProjects?.items;
      assert.strictEqual(myOrderedProjects.length, mock.programBook.projects?.length);
      assertOrderedProjects(myOrderedProjects);
      const myRemainingOrderedProjects: IOrderedProject[] = myOrderedProjects.filter(
        orderedProject => orderedProject.levelRank !== 1
      );
      assert.isNotEmpty(myRemainingOrderedProjects);
      myRemainingOrderedProjects.forEach(remainingOrderedProject => {
        assert.strictEqual(remainingOrderedProject.levelRank, 0);
      });
    });

    it('C66693 - Positive - Should save priority rank for each ordered projects', async () => {
      await assertBeforeTestForPostIsOk(mock);
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      assert.isNotEmpty(myProgramBook);
      const myOrderedProjects: IOrderedProject[] = myProgramBook.priorityScenarios[0]?.orderedProjects?.items;
      assert.strictEqual(
        myOrderedProjects.length,
        mock.programBook.projects?.length,
        `myOrderedProjects: [\n ${myOrderedProjects.map(orderedProject =>
          JSON.stringify(orderedProject, null, 2)
        )}\n]\n mock.programBook.projects?.items: [\n ${mock.programBook.projects?.map(orderedProject =>
          JSON.stringify(orderedProject, null, 2)
        )}\n]`
      );
      assertOrderedProjects(myOrderedProjects);
    });

    it('Positive - Should put only project with intervention in level', async () => {
      const PRIORITY_LEVEL_RANK = 2;
      const NBR_INITIAL_NEED_PROJECTS = mock.programBook.projects.filter(
        p =>
          p.interventions.some(
            i =>
              i.planificationYear === mock.initialData.annualProgram.year &&
              i.interventionTypeId === InterventionType.initialNeed
          ) &&
          p.annualDistribution.annualPeriods.find(ap => ap.year === appUtils.getCurrentYear())?.categoryId !==
            ProjectCategory.completing
      ).length;

      const mockProject = await projectDataGenerator.store({
        startYear: mock.initialData.annualProgram.year,
        endYear: mock.initialData.annualProgram.year + 1
      });
      await interventionDataGenerator.store(
        {
          interventionTypeId: InterventionType.opportunity
        },
        mockProject
      );
      await interventionDataGenerator.store(
        {
          interventionTypeId: InterventionType.initialNeed,
          interventionYear: mock.initialData.annualProgram.year + 1,
          planificationYear: mock.initialData.annualProgram.year + 1
        },
        mockProject
      );
      await programBookDataCoupler.coupleThem({
        projects: [mockProject],
        programBookCoupler: { programBook: mock.programBook, year: mock.initialData.annualProgram.year }
      });

      const priorityLevels = [
        PriorityLevel.create(getPlainPriorityLevelProps()).getValue(),
        PriorityLevel.create({
          criteria: {
            interventionType: [InterventionType.initialNeed]
          },
          rank: PRIORITY_LEVEL_RANK,
          isSystemDefined: false
        }).getValue()
      ];

      // use props to reassign value
      mock.programBook.props.priorityScenarios[0].props.isOutdated = true;
      mock.programBook.props.priorityScenarios[0].props.priorityLevels = priorityLevels;

      mock.programBook = (await programBookRepository.save(mock.programBook)).getValue();
      const response = await programBookPriorityScenariosTestClient.calculatePriorityScenario(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      const myOrderedProjects: IOrderedProject[] = myProgramBook.priorityScenarios[0]?.orderedProjects.items.filter(
        op => op.levelRank === PRIORITY_LEVEL_RANK
      );
      assert.isTrue(myOrderedProjects.length > 0);
      assert.lengthOf(myOrderedProjects, NBR_INITIAL_NEED_PROJECTS);
    });
  });

  describe('/v1/programBooks/:programBookId/priorityScenarios/:priorityScenarioId/orderedProjects > GET', () => {
    function assertPagination(programBook: IEnrichedProgramBook, paginationQuery: any): void {
      const mockProjectCount = getMockProjectCount(programBook);
      const queryLimit = paginationQuery.projectLimit || constants.PaginationDefaults.LIMIT;

      assert.strictEqual(programBook.projects.paging.totalCount, mockProjectCount);
      assert.strictEqual(programBook.projects.paging.limit, queryLimit);
      assert.isTrue(programBook.projects.items.length <= queryLimit);
      assert.strictEqual(programBook.priorityScenarios[0].orderedProjects.paging.totalCount, mockProjectCount);
      assert.strictEqual(programBook.priorityScenarios[0].orderedProjects.paging.limit, queryLimit);
      assert.isTrue(programBook.priorityScenarios[0].orderedProjects.items.length <= queryLimit);

      for (const project of programBook.projects.items) {
        const findProject = programBook.priorityScenarios[0].orderedProjects.items.find(
          orderedProject => orderedProject.projectId === project.id
        );
        assert.exists(findProject);
      }
    }

    function assertOffset(programBook: IEnrichedProgramBook, programBookAllProjectIds: string[], query: any) {
      const orderProjectIds = programBook.priorityScenarios[0].orderedProjects.items.map(op => op.projectId);
      const slicedProjectIds = programBookAllProjectIds.slice(
        query.projectOffset,
        query.projectOffset + query.projectLimit
      );
      assert.strictEqual(orderProjectIds.length, slicedProjectIds.length);
      slicedProjectIds.forEach(slicedProjectId => {
        assert.isTrue(orderProjectIds.includes(slicedProjectId));
      });
    }

    function getMockProjectCount(programBook: IEnrichedProgramBook): number {
      const mockProjectCount = programBook.projects.paging.totalCount;
      // let mockProjectCount = 0;
      // for (const key of Object.keys(mock.projects)) {
      //   const project: IEnrichedProject = mock.projects[key];
      //   if (project.annualDistribution.annualPeriods.find(ap => ap.programBookId === programBook.id)) {
      //     //  TODO WHY ?
      //     mockProjectCount = mockProjectCount + 1;
      //   }
      // }
      return mockProjectCount;
    }

    let mock: IMockData;
    let mockProjects: IEnrichedProject[];
    let mockQuery: IOrderedProjectsPaginatedSearchRequest;

    beforeEach(async () => {
      userMocker.mock(userMocks.planner);
      mock = null;
      mock = await setInitialData();
      mockQuery = { projectLimit: 2, projectOffset: 0 };
      const projectFindOptions = ProjectFindOptions.create({
        criterias: {
          programBookId: mock.programBook.id
        }
      }).getValue();
      mockProjects = await projectRepository.findAll(projectFindOptions);
      mock.programBook = await programBookDataCoupler.coupleThem({
        programBookCoupler: { programBook: mock.programBook, year: mock.annualProgram.year },
        projects: mockProjects
      });
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    it('C67303 - Should returned paginated ordered projects and paginated projects with a limit', () => {
      [
        {
          input: {
            projectLimit: constants.PaginationDefaults.LIMIT
          }
        },
        {
          input: undefined
        }
      ].forEach(async test => {
        const response = await programBookPriorityScenariosTestClient.getOrderedProjects(
          mock.programBook.id,
          mock.programBook.priorityScenarios[0].id,
          {
            ...mockQuery,
            ...test.input
          }
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const programBook = response.body;
        assertPagination(programBook, mockQuery);
      });
    });

    it(`C67305 - Should return maximum paginated projects and paginated ordered projects from offset to limit`, async () => {
      const responseAllProjects = await programBookPriorityScenariosTestClient.getOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id
      );
      assert.strictEqual(responseAllProjects.status, HttpStatusCodes.OK);
      const programBookAllProjectIds = responseAllProjects.body.priorityScenarios[0].orderedProjects.items.map(
        (orderedProject: IOrderedProject) => orderedProject.projectId
      );
      mockQuery.projectOffset = 1;
      const response = await programBookPriorityScenariosTestClient.getOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mockQuery
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const programBook: IEnrichedProgramBook = response.body;
      assertPagination(programBook, mockQuery);
      assertOffset(programBook, programBookAllProjectIds, mockQuery);
    });

    it(`C67306 - Should returned empty paginated ordered project and paginated project`, async () => {
      mockQuery.projectOffset = 100;
      const response = await programBookPriorityScenariosTestClient.getOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mockQuery
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const programBook: IEnrichedProgramBook = response.body;
      assert.lengthOf(programBook.priorityScenarios[0].orderedProjects.items, 0);
      assert.lengthOf(programBook.projects.items, 0);
      assertPagination(programBook, mockQuery);
    });
  });

  describe('/v1/programBooks/:programBookId/priorityScenarios/:priorityScenarioId/orderedProjects/:projectId/ranks > PUT', () => {
    function assertOrderedProjectsRank(
      originalOrderedProjects: IOrderedProject[],
      orderedProjects: IOrderedProject[],
      projectRank: IProjectRank,
      projectId: string
    ) {
      const originalOrderedProject = originalOrderedProjects.find(oop => oop.projectId === projectId);
      const originalProjectRank = originalOrderedProject.rank;
      const updatedOrderedProject = orderedProjects.find(op => op.projectId === projectId);
      const updatedOrderedProjectRank = updatedOrderedProject.rank;
      assert.strictEqual(updatedOrderedProject.rank, projectRank.newRank);
      const isAscending = originalProjectRank > updatedOrderedProjectRank;
      const minMax = isAscending
        ? [originalProjectRank, updatedOrderedProjectRank]
        : [updatedOrderedProjectRank, originalProjectRank];
      const filteredOriginalOrderedProjects = originalOrderedProjects.filter(
        oop => oop.rank >= minMax[0] && oop.rank <= minMax[1] && oop.projectId !== projectId
      );
      const filteredOrderedProjects = orderedProjects.filter(
        op => op.rank >= minMax[0] && op.rank <= minMax[1] && op.projectId !== projectId
      );
      assertNewRanks(filteredOriginalOrderedProjects, filteredOrderedProjects, isAscending);
    }

    function assertNewRanks(
      filteredOriginalOrderedProjects: IOrderedProject[],
      filteredOrderedProjects: IOrderedProject[],
      isAscending: boolean
    ) {
      for (const filteredOriginalOrderedProject of filteredOriginalOrderedProjects) {
        const filteredOrderedProject = filteredOrderedProjects.find(
          op => op.projectId === filteredOriginalOrderedProject.projectId
        );
        const additional = isAscending ? 1 : -1;
        assert.strictEqual(filteredOrderedProject.rank, filteredOriginalOrderedProject.rank + additional);
      }
    }

    let mock: IMockData;

    beforeEach(async () => {
      userMocker.mock(userMocks.planner);
      mock = await setInitialData();
      await programBookDataCoupler.coupleThem({
        projects: [
          mock.projects.projectAsset,
          mock.projects.projectCompleted,
          mock.projects.projectDeeu,
          mock.projects.projectWorkType,
          mock.projects.projectInterventionType,
          mock.projects.projectServicePriorities
        ],
        programBookCoupler: { year: mock.annualProgram.year, programBook: mock.programBook }
      });
      mock.projectRankBody = {
        newRank: 2,
        isManuallyOrdered: true
      };
    });
    afterEach(async () => {
      userMocker.reset();
      await destroyDBTests();
    });

    it('C67802 - Positive - Should manually save ordered projects to a greater rank and move in-between projects to 1 lower rank', async () => {
      const response = await programBookPriorityScenariosTestClient.putOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.projects.projectAsset.id,
        { body: mock.projectRankBody }
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      assertOrderedProjectsRank(
        mock.programBook.priorityScenarios[0].orderedProjects,
        myProgramBook.priorityScenarios[0].orderedProjects.items,
        mock.projectRankBody,
        mock.projects.projectAsset.id
      );
      const myOrderedProject = myProgramBook.priorityScenarios[0].orderedProjects.items.find(
        op => op.projectId === mock.projects.projectAsset.id
      );
      assert.isUndefined(myOrderedProject.note);
    });

    it('C67803 - Positive - Should manually save ordered projects to a lower rank and move in-between projects to 1 higher rank', async () => {
      mock.projectRankBody.note = 'test';
      const response = await programBookPriorityScenariosTestClient.putOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.projects.projectWorkType.id,
        { body: mock.projectRankBody }
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;
      assertOrderedProjectsRank(
        mock.programBook.priorityScenarios[0].orderedProjects,
        myProgramBook.priorityScenarios[0].orderedProjects.items,
        mock.projectRankBody,
        mock.projects.projectWorkType.id
      );
      const myOrderedProject = myProgramBook.priorityScenarios[0].orderedProjects.items.find(
        op => op.projectId === mock.projects.projectWorkType.id
      );
      assert.strictEqual(myOrderedProject.note, mock.projectRankBody.note);
    });

    it('C67804 - Negative - Should not update project rank if the rank requested is already manually assign to a project', async () => {
      await setMockWithAManuallyOrderedRank(mock);
      const response = await programBookPriorityScenariosTestClient.putOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.projects.projectAsset.id,
        { body: mock.projectRankBody }
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C67805 - Negative - Should not update project rank if it doesnt exist in other non manually assigned rank', async () => {
      setMockWithNonExistingProjectRank(mock);
      const response = await programBookPriorityScenariosTestClient.putOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.projects.projectAsset.id,
        { body: mock.projectRankBody }
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('Positive - Should remove project rank and reorder orderedProjects', async () => {
      await setMockWithAManuallyOrderedRank(mock);
      mock.projectRankBody.isManuallyOrdered = false;
      const response = await programBookPriorityScenariosTestClient.putOrderedProjects(
        mock.programBook.id,
        mock.programBook.priorityScenarios[0].id,
        mock.projects.projectWorkType.id,
        { body: mock.projectRankBody }
      );

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const myProgramBook: IEnrichedProgramBook = response.body;

      const initialOrderedProjects = mock.programBook.priorityScenarios[0].orderedProjects;
      const orderedProjectsAfterRemove = myProgramBook.priorityScenarios[0].orderedProjects.items;
      const expectedOrder = sortBy(
        initialOrderedProjects.map(op => ({ projectId: op.projectId, rank: op.rank })),
        obj => obj.rank
      );
      const responseOrder = sortBy(
        orderedProjectsAfterRemove.map(op => ({ projectId: op.projectId, rank: op.rank })),
        obj => obj.rank
      );
      assert.deepEqual(responseOrder, expectedOrder);
      orderedProjectsAfterRemove.forEach(op => assert.isFalse(op.isManuallyOrdered));
    });
  });
});
