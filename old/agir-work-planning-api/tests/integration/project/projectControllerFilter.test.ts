import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  BoroughCode,
  IEnrichedIntervention,
  IEnrichedProject,
  ProgramBookStatus,
  ProjectCategory,
  ProjectStatus,
  ProjectSubCategory,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';

import { constants, EndpointTypes } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../../src/features/database/DB';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ProjectModel } from '../../../src/features/projects/mongo/projectModel';
import {
  EXECUTOR_BOROUGH,
  EXECUTOR_DEP,
  WORK_TYPE_ABANDON,
  WORK_TYPE_REHABILITATION,
  WORK_TYPE_REPAIR
} from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { createMockIntervention } from '../../data/interventionData';
import { programBooksData } from '../../data/programBooksData';
import {
  createMockProject,
  createMockProjectList,
  getEnrichedCompleteProject,
  getProjectsSearch
} from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { destroyDBTests } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable-next-line: max-func-body-length
describe('ProjectController - Filter', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  let mockAnnualProgramProgramming: AnnualProgram;
  let projectModel: ProjectModel;

  before(() => {
    projectModel = db().models.Project;
  });

  after(async () => {
    await integrationAfter();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/projects - filter by program book', () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      mockAnnualProgramProgramming = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming
      });
    });

    it('C57446 - Positive - Should be able to filter by program book', async () => {
      const programBook = await createAndSaveProgramBook({
        annualProgram: mockAnnualProgramProgramming,
        status: ProgramBookStatus.programming
      });
      const project = await programBooksData.createMockProjectInProgramBook(programBook, {
        status: ProjectStatus.programmed
      });
      await projectModel.create([getEnrichedCompleteProject()]);
      const response = await getProjectsSearch(apiUrl, `programBookId=${programBook.id}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const responseProject = _.omit(response.body.items[0], [
        'audit',
        'constraints',
        'annualDistribution.id'
      ]) as IEnrichedProject;
      const projectOmittedProperties = _.omit(project, ['audit', 'constraints', 'annualDistribution.id']);
      assert.deepStrictEqual(responseProject, projectOmittedProperties);
      assert.lengthOf(response.body.items, 1);
      const annualPeriods = responseProject.annualDistribution.annualPeriods;
      assert.isTrue(annualPeriods.some(annualPeriod => annualPeriod.programBookId === programBook.id));
    });
  });

  describe('/projects - filter with a from/to budget', () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await projectModel.create([getEnrichedCompleteProject()]);
    });

    it('C57864 - Positive - Should be able to filter by budget range', async () => {
      const from = 1;
      const to = 99999;
      const response = await getProjectsSearch(apiUrl, `fromBudget=${from}&toBudget=${to}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.lengthOf(projects, 1);
      assert.isTrue(
        projects.every(project => project.globalBudget.allowance >= from && project.globalBudget.allowance <= to)
      );
    });

    it('C57865 - Positive - Should return an empty array if no interventions fit within the budget range', async () => {
      const from = 1;
      const to = 2;
      const response = await getProjectsSearch(apiUrl, `fromBudget=${from}&toBudget=${to}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.lengthOf(projects, 0);
    });

    it('C57866 - Positive - Should be able to filter with a starting budget', async () => {
      const from = 1;
      const response = await getProjectsSearch(apiUrl, `fromBudget=${from}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => project.globalBudget.allowance >= from));
    });

    it('C57867 - Positive - Should be able to filter with a starting budget', async () => {
      const to = 99999;
      const response = await getProjectsSearch(apiUrl, `toBudget=${to}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => project.globalBudget.allowance <= to));
    });

    it('C58398 - Positive - Should be able to filter with a starting budget and arriving budget equal to 0', async () => {
      const from = 0;
      const response = await getProjectsSearch(apiUrl, { fromBudget: from, toBudget: from });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => (project.globalBudget.allowance = from)));
    });

    it('C57868 - Negative - Should not be able to filter with a starting budget bigger than the arriving budget', async () => {
      const from = 99999;
      const to = 1;
      const response = await getProjectsSearch(apiUrl, `fromBudget=${from}&toBudget=${to}`);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/projects - filter by borough', () => {
    beforeEach(() => {
      userMocker.mock(userMocks.pilot);
    });

    it('C57882 - Positive - Should be able to filter by borough', async () => {
      await projectModel.create([getEnrichedCompleteProject()]);
      const response = await getProjectsSearch(apiUrl, `boroughId=${BoroughCode.SLR}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.lengthOf(projects, 1);
      assert.isTrue(projects.every(project => project.boroughId === BoroughCode.SLR));
    });
  });

  describe('/projects - filter by requestor', () => {
    let projectBell: IEnrichedProject;
    let projectDep: IEnrichedProject;
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      projectDep = await createMockProject({ inChargeId: 'dep' });
      projectBell = await createMockProject({ inChargeId: 'bell' });
    });

    it('C57720 - Positive - Should be able to filter projects by requestors', async () => {
      const bell = 'bell';
      const dep = 'dep';
      const response = await getProjectsSearch(apiUrl, `inChargeId=${bell},${dep}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.lengthOf(response.body.items, 2);
      const responseProjectBell = _.omit(response.body.items[0], ['audit', 'constraints']);
      const responseProjectDep = _.omit(response.body.items[1], ['audit', 'constraints']);
      const projectDepNoAudit = _.omit(projectDep, 'audit');
      const projectBellNoAudit = _.omit(projectBell, 'audit');
      assert.deepStrictEqual(responseProjectBell, projectBellNoAudit);
      assert.deepStrictEqual(responseProjectDep, projectDepNoAudit);
      assert.strictEqual(responseProjectBell.inChargeId, bell);
      assert.strictEqual(responseProjectDep.inChargeId, dep);
    });
  });

  describe('/projects - filter by type', () => {
    async function setProjectsWithType() {
      await createMockProject({ projectTypeId: ProjectType.integrated });
      await createMockProject({ projectTypeId: ProjectType.integratedgp });
      await createMockProject({ projectTypeId: ProjectType.nonIntegrated });
      await createMockProject({ projectTypeId: ProjectType.other });
    }
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await setProjectsWithType();
    });

    it('C58121 - Positive - Should be able to filter project with type integrated', async () => {
      const response = await getProjectsSearch(apiUrl, { projectTypeId: ProjectType.integrated });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => project.projectTypeId === ProjectType.integrated));
    });

    it('C58122 - Positive - Should be able to filter project with type integrated - Grand Projets', async () => {
      const response = await getProjectsSearch(apiUrl, { projectTypeId: ProjectType.integratedgp });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => project.projectTypeId === ProjectType.integratedgp));
    });

    it('C58123 - Positive - Should be able to filter project with type non-integrated', async () => {
      const response = await getProjectsSearch(apiUrl, { projectTypeId: ProjectType.nonIntegrated });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => project.projectTypeId === ProjectType.nonIntegrated));
    });

    it('C58124 - Positive - Should be able to filter project with type non-integrated', async () => {
      const response = await getProjectsSearch(apiUrl, { projectTypeId: ProjectType.other });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isTrue(projects.every(project => project.projectTypeId === ProjectType.other));
    });

    it('C58125 - Negative - Should not be able to filter project with a wrong type', async () => {
      const response = await getProjectsSearch(apiUrl, { projectTypeId: 'wrong' });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/projects - filter by category', () => {
    async function setProjectsWithCategories() {
      return createMockProjectList({ categories: true });
    }

    function assertCategories(projects: IEnrichedProject[], categoryIds: string[], fromYear?: number) {
      const yearToValidate = fromYear || appUtils.getCurrentYear();
      let categoriesFoundIds: string[] = [];
      for (const project of projects) {
        const cat = project.annualDistribution.annualPeriods.find(
          annualPeriod => annualPeriod.year === yearToValidate && _.includes(categoryIds, annualPeriod.categoryId)
        );
        categoriesFoundIds.push(cat.categoryId);
        assert.strictEqual(cat.year, yearToValidate);
        assert.isTrue(_.includes(categoryIds, cat.categoryId));
      }
      categoriesFoundIds = _.uniq(categoriesFoundIds);
      categoryIds.sort();
      categoriesFoundIds.sort();
      assert.deepStrictEqual(categoryIds, categoriesFoundIds);
    }

    beforeEach(async () => {
      userMocker.mock(userMocks.planner);
      await setProjectsWithCategories();
    });

    it('C58126 - Positive - Should be able to filter project with category new', async () => {
      const response = await getProjectsSearch(apiUrl, { categoryId: ProjectCategory.new });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertCategories(projects, [ProjectCategory.new]);
    });

    it('C58127 - Positive - Should be able to filter project with category postponed', async () => {
      const response = await getProjectsSearch(apiUrl, { categoryId: ProjectCategory.postponed });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertCategories(projects, [ProjectCategory.postponed]);
    });

    it('C58128 - Positive - Should be able to filter project with category completing', async () => {
      const response = await getProjectsSearch(apiUrl, { categoryId: ProjectCategory.completing });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertCategories(projects, [ProjectCategory.completing]);
    });

    it('C58129 - Positive - Should change category as the starting year changes on the filtered projects', async () => {
      const fromYear = appUtils.getCurrentYear() + 2;
      const response = await getProjectsSearch(apiUrl, { fromYear, categoryId: ProjectCategory.completing });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertCategories(projects, [ProjectCategory.completing], fromYear);
    });

    it('C58397 - Positive - Should be able to filter project with categories', async () => {
      const categoriesIds = [ProjectCategory.completing, ProjectCategory.new];
      const response = await getProjectsSearch(apiUrl, { categoryId: categoriesIds });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertCategories(projects, categoriesIds);
    });

    it('C58130 - Negative - Should not be able to filter project with a wrong category', async () => {
      const response = await getProjectsSearch(apiUrl, { categoryId: 'wrong' });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/projects - filter by sub-category', () => {
    async function setProjectsWithSubCategories() {
      return createMockProjectList({ subCategories: true });
    }

    function assertSubCategories(projects: IEnrichedProject[], subCategoryIds: string[]) {
      for (const project of projects) {
        assert.isTrue(project.subCategoryIds.some(subCategory => _.includes(subCategoryIds, subCategory)));
      }
    }

    beforeEach(async () => {
      userMocker.mock(userMocks.planner);
      await setProjectsWithSubCategories();
    });

    it('C58131 - Positive - Should be able to filter project with sub-category priority', async () => {
      const response = await getProjectsSearch(apiUrl, { subCategoryId: ProjectSubCategory.priority });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertSubCategories(projects, [ProjectSubCategory.priority]);
    });

    it('C58132 - Positive - Should be able to filter project with sub-category recurrent', async () => {
      const response = await getProjectsSearch(apiUrl, { subCategoryId: ProjectSubCategory.recurrent });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertSubCategories(projects, [ProjectSubCategory.recurrent]);
    });

    it('C58133 - Positive - Should be able to filter project with sub-category successive', async () => {
      const response = await getProjectsSearch(apiUrl, { subCategoryId: ProjectSubCategory.successive });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertSubCategories(projects, [ProjectSubCategory.successive]);
    });

    it('C58134 - Positive - Should be able to filter project with sub-category urgent', async () => {
      const response = await getProjectsSearch(apiUrl, {
        subCategoryId: [ProjectSubCategory.priority, ProjectSubCategory.recurrent]
      });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertSubCategories(projects, [ProjectSubCategory.priority, ProjectSubCategory.recurrent]);
    });

    it('C58135 - Positive - Should be able to filter project with 2 sub-categories', async () => {
      const response = await getProjectsSearch(apiUrl, { subCategoryId: ProjectSubCategory.urgent });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertSubCategories(projects, [ProjectSubCategory.urgent]);
    });

    it('C58136 - Negative - Should not be able to filter project with a wrong sub-category', async () => {
      const response = await getProjectsSearch(apiUrl, { subCategoryId: 'wrong' });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
  describe('/projects - filter by status', () => {
    async function setProjectsWithSubCategories() {
      return createMockProjectList({ status: true });
    }

    function assertStatus(projects: IEnrichedProject[], statuses: string[]) {
      for (const project of projects) {
        assert.isTrue(_.includes(statuses, project.status));
      }
    }

    beforeEach(async () => {
      userMocker.mock(userMocks.planner);
      await setProjectsWithSubCategories();
    });

    it('C58138 - Positive - Should be able to filter project with status planned', async () => {
      const response = await getProjectsSearch(apiUrl, { status: ProjectStatus.planned });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.planned]);
    });

    it('C58139 - Positive - Should be able to filter project with status programmed', async () => {
      const response = await getProjectsSearch(apiUrl, { status: ProjectStatus.programmed });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.programmed]);
    });

    it('C58140 - Positive - Should be able to filter project with status finalOrdered', async () => {
      const response = await getProjectsSearch(apiUrl, { status: ProjectStatus.finalOrdered });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.finalOrdered]);
    });

    it('C58145 - Positive - Should be able to filter project with status postponed', async () => {
      const response = await getProjectsSearch(apiUrl, { status: ProjectStatus.postponed });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.postponed]);
    });

    it('C58146 - Positive - Should be able to filter project with status replanned', async () => {
      const response = await getProjectsSearch(apiUrl, { status: ProjectStatus.replanned });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.replanned]);
    });

    it('C58147 - Positive - Should be able to filter project with status canceled', async () => {
      const response = await getProjectsSearch(apiUrl, { status: ProjectStatus.canceled });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.canceled]);
    });

    it('C58148 - Positive - Should be able to filter project with 2 statuses', async () => {
      const response = await getProjectsSearch(apiUrl, { status: [ProjectStatus.replanned, ProjectStatus.planned] });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assertStatus(projects, [ProjectStatus.replanned, ProjectStatus.planned]);
    });

    it('C58149 - Negative - Should not be able to filter project with a wrong status', async () => {
      const response = await getProjectsSearch(apiUrl, { status: 'wrong' });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/projects - filter by executor', () => {
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      await createMockProject({ executorId: EXECUTOR_DEP });
      await createMockProject({ executorId: EXECUTOR_BOROUGH });
    });

    it('C59512 - Positive - Should be able to filter projects by executor', async () => {
      const executorId = EXECUTOR_BOROUGH;
      const response = await getProjectsSearch(apiUrl, { executorId });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isArray(projects);
      assert.isTrue(projects.length > 0);
      assert.isTrue(projects.every(proj => proj.executorId === executorId));
    });

    it('C59534 - Positive - Should be able to filter projects by executors', async () => {
      const executorIds: string[] = [EXECUTOR_BOROUGH, EXECUTOR_DEP];
      const response = await getProjectsSearch(apiUrl, { executorId: executorIds });
      const projects: IEnrichedProject[] = response.body.items;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isArray(projects);
      assert.isTrue(projects.length > 0);
      assert.isTrue(projects.every(proj => executorIds.includes(proj.executorId)));
    });

    it('C59535 - Negative - Should not be able to filter projects by a wrong executors', async () => {
      const executorId = 'potatoes';
      const response = await getProjectsSearch(apiUrl, { executorId });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/projects - filter by work types', () => {
    let interventionRepair: IEnrichedIntervention;
    let interventionRehabilitation: IEnrichedIntervention;
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      interventionRepair = await createMockIntervention({ workTypeId: WORK_TYPE_REPAIR });
      interventionRehabilitation = await createMockIntervention({ workTypeId: WORK_TYPE_REHABILITATION });
      const interventionAbandon = await createMockIntervention({ workTypeId: WORK_TYPE_ABANDON });
      await createMockProject({ interventionIds: [interventionRepair.id] });
      await createMockProject({ interventionIds: [interventionRehabilitation.id] });
      await createMockProject({
        interventionIds: [interventionRehabilitation.id],
        status: ProjectStatus.canceled
      });
      await createMockProject({ interventionIds: [interventionAbandon.id] });
    });

    it('C59559 - Positive - Should be able to filter projects by work type', async () => {
      const workTypeId = 'rehabilitation';
      const response = await getProjectsSearch(apiUrl, { workTypeId });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isArray(projects);
      assert.isTrue(projects.length > 0);
      const interventions = await db()
        .models.Intervention.find({ workTypeId })
        .exec();
      for (const proj of projects) {
        assert.isTrue(
          interventions.every(
            intervention => proj.interventionIds.includes(intervention.id) && intervention.workTypeId === workTypeId
          )
        );
      }
    });

    it('C59560 - Positive - Should be able to filter projects by work types', async () => {
      const workTypeIds = ['rehabilitation', 'repair'];
      const response = await getProjectsSearch(apiUrl, { workTypeId: workTypeIds });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const projects: IEnrichedProject[] = response.body.items;
      assert.isArray(projects);
      assert.isTrue(projects.length > 0);
      const interventions = await db()
        .models.Intervention.find({ workTypeId: workTypeIds })
        .exec();
      for (const proj of projects) {
        assert.isTrue(
          interventions.every(
            intervention =>
              interventions.some(interv => proj.interventionIds.includes(interv.id)) &&
              workTypeIds.includes(intervention.workTypeId)
          )
        );
      }
    });

    it('C59561 - Negative - Should not be able to filter projects by a wrong work type', async () => {
      const workTypeId = 'potatoes';
      const response = await getProjectsSearch(apiUrl, { workTypeId });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
});
