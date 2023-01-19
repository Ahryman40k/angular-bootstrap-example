import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib';
import {
  AnnualProgramStatus,
  BoroughCode,
  ErrorCodes,
  IEnrichedPaginatedProjects,
  IEnrichedProgramBook,
  IEnrichedProject,
  IPlainProgramBook,
  ProgramBookExpand,
  ProgramBookStatus,
  ProjectStatus,
  ProjectType,
  Role,
  ShareableRole,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as mongoose from 'mongoose';
import * as superagent from 'superagent';
import * as supertest from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { AnnualProgramModel } from '../../../src/features/annualPrograms/mongo/annualProgramModel';
import { annualProgramRepository } from '../../../src/features/annualPrograms/mongo/annualProgramRepository';
import {
  createAndSaveAnnualProgram,
  getAnnualProgramProps
} from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../../src/features/database/DB';
import { programBookMapperDTO } from '../../../src/features/programBooks/mappers/programBookMapperDTO';
import { IPlainProgramBookProps } from '../../../src/features/programBooks/models/plainProgramBook';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { ProgramBookModel } from '../../../src/features/programBooks/mongo/programBookModel';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import {
  createAndSaveProgramBook,
  getPlainProgramBookProps,
  getProgramBook as getProgramBookInstance
} from '../../../src/features/programBooks/tests/programBookTestHelper';
import { PROGRAMBOOK_PROGRAMMABLE_STATUSES } from '../../../src/features/programBooks/validators/programBookValidator';
import { ProjectModel } from '../../../src/features/projects/mongo/projectModel';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { taxonomyService } from '../../../src/features/taxonomies/taxonomyService';
import { PROGRAM_TYPE_PCPR } from '../../../src/shared/taxonomies/constants';
import { enumValues } from '../../../src/utils/enumUtils';
import { appUtils } from '../../../src/utils/utils';
import { projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { getCompleteEnrichedIntervention } from '../../data/interventionData';
import { programBooksData } from '../../data/programBooksData';
import {
  createMockProject,
  getEnrichedCompleteProject,
  getEnrichedProjectAndIntervention as getEnrichedProjectWithIntervention
} from '../../data/projectData';
import { userMocks } from '../../data/userMocks';
import { normalizeDataTest } from '../../utils/normalizeDataTest';
import { requestService } from '../../utils/requestService';
import { destroyDBTests, removeEmpty } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable:max-func-body-length

describe('Program Book Controller', () => {
  const annualProgramsUrl = appUtils.createPublicFullPath(constants.locationPaths.ANNUAL_PROGRAM, EndpointTypes.API);
  const programBooksUrl = appUtils.createPublicFullPath(constants.locationPaths.PROGRAM_BOOK, EndpointTypes.API);

  let annualProgramNew: AnnualProgram;
  let annualProgramNew2: AnnualProgram;
  let annualProgramProgramming: AnnualProgram;
  let annualProgramSubmittedFinal: AnnualProgram;
  let allSharedRolesProgramBookSubmittedFinal: Role[];

  let annualProgramModel: AnnualProgramModel;
  let programBookModel: ProgramBookModel;
  let projectModel: ProjectModel;

  before(async () => {
    userMocker.mock(userMocks.pilot);

    programBookModel = db().models.ProgramBook;
    annualProgramModel = db().models.AnnualProgram;
    projectModel = db().models.Project;

    annualProgramNew = await createAndSaveAnnualProgram();
    annualProgramNew2 = await createAndSaveAnnualProgram();
    annualProgramProgramming = await createAndSaveAnnualProgram({
      status: AnnualProgramStatus.programming
    });
    annualProgramSubmittedFinal = await createAndSaveAnnualProgram({
      status: AnnualProgramStatus.submittedFinal
    });

    allSharedRolesProgramBookSubmittedFinal = await taxonomyService.getTaxonomyValueString(
      TaxonomyGroup.shareableRole,
      ShareableRole.programBook
    );
  });

  after(async () => {
    userMocker.mock(userMocker.defaultUser);
    await integrationAfter();
  });

  afterEach(async () => {
    await programBookModel.remove({}).exec();
  });

  function postProgramBook(annualProgramId: string, plainProgramBook: IPlainProgramBook): Promise<supertest.Response> {
    return requestService.post(`${annualProgramsUrl}/${annualProgramId}/programBooks`, { body: plainProgramBook });
  }

  function putProgramBook(programBookId: string, plainProgramBook: IPlainProgramBook): Promise<supertest.Response> {
    return requestService.put(`${programBooksUrl}/${programBookId}`, { body: plainProgramBook });
  }

  async function openProgramBook(programBookArg: ProgramBook): Promise<supertest.Response> {
    return putProgramBook(programBookArg.id, {
      name: programBookArg.name,
      projectTypes: programBookArg.projectTypes,
      inCharge: programBookArg.inCharge,
      boroughIds: programBookArg.boroughIds,
      status: ProgramBookStatus.programming
    });
  }

  /**
   * Gets an annual program's program books
   * @param annualProgramId
   * @returns program books
   */
  function getProgramBooks(annualProgramId: string, query?: any): Promise<supertest.Response> {
    if (query) {
      return requestService.get(`${annualProgramsUrl}/${annualProgramId}/programBooks`, {}, query);
    }
    return requestService.get(`${annualProgramsUrl}/${annualProgramId}/programBooks`, {});
  }

  /**
   * Gets a program book
   * @param programBookId
   * @returns program book
   */
  function getProgramBook(programBookId: string, isWrongId: boolean = false, query?: any): Promise<supertest.Response> {
    let programBookIdObject: any = programBookId;
    if (!isWrongId) {
      programBookIdObject = mongoose.Types.ObjectId(programBookId);
    }
    if (query) {
      return requestService.get(`${programBooksUrl}/${programBookIdObject}`, {}, query);
    }
    return requestService.get(`${programBooksUrl}/${programBookIdObject}`, {});
  }

  /**
   * Deletes a program book
   * @param programBookId
   * @returns program book
   */
  function deleteProgramBook(programBookId: string): Promise<supertest.Response> {
    return requestService.delete(`${programBooksUrl}/${programBookId}`, {});
  }

  /**
   * Gets all projects by programBook
   * @param programBookId
   * @returns projects by programBook
   */
  function getProgramBookProjects(programBookId: string): Promise<supertest.Response> {
    return requestService.get(`${programBooksUrl}/${programBookId}/projects`, {});
  }

  describe('annualPrograms/:id/programBooks > POST', () => {
    function assertProgramBookCreated(response: superagent.Response, plainProgramBook: IPlainProgramBook) {
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const enrichedProgramBook: IEnrichedProgramBook = response.body;
      assert.isOk(enrichedProgramBook);
      assert.isOk(enrichedProgramBook.id);
      assert.isOk(enrichedProgramBook.audit);
      assert.strictEqual(enrichedProgramBook.status, 'new');
      assert.strictEqual(enrichedProgramBook.annualProgramId, annualProgramNew.id);
      assert.strictEqual(enrichedProgramBook.isAutomaticLoadingInProgress, false);
      assert.deepInclude(enrichedProgramBook, plainProgramBook);
    }

    it('C55292  Positive - Should create a program book', async () => {
      const plainProgramBook = getPlainProgramBookProps();
      const response = await postProgramBook(annualProgramNew.id, plainProgramBook);
      assertProgramBookCreated(response, plainProgramBook);
    });

    it('C55293  Positive - Should create a program book with minimum info', async () => {
      const plainProgramBook = getPlainProgramBookProps({
        name: 'Carnet Intégré',
        projectTypes: [ProjectType.integrated]
      });
      const response = await postProgramBook(annualProgramNew.id, plainProgramBook);
      assertProgramBookCreated(response, plainProgramBook);
    });

    it('C55323  Positive - Should create a program book with same name and project types for different annual programs', async () => {
      const plainProgramBook1 = getPlainProgramBookProps();
      const response1 = await postProgramBook(annualProgramNew.id, plainProgramBook1);
      assert.strictEqual(response1.status, HttpStatusCodes.CREATED);

      const plainProgramBook2 = getPlainProgramBookProps();
      const response2 = await postProgramBook(annualProgramNew2.id, plainProgramBook2);
      assert.strictEqual(response2.status, HttpStatusCodes.CREATED);
    });

    it('C55294  Negative - Should not create a program book with invalid annual program id', async () => {
      const plainProgramBook = getPlainProgramBookProps({
        name: null,
        projectTypes: [],
        boroughIds: []
      });
      const response = await postProgramBook('not-found', plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55295  Negative - Should not create a program book with nonexisting annual program', async () => {
      const plainProgramBook = getPlainProgramBookProps();
      const response = await postProgramBook('1e1c990176c00222cdbfa7ac', plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C55296  Negative - Should not create a program book with invalid input', async () => {
      const plainProgramBook = getPlainProgramBookProps({
        name: null,
        projectTypes: [],
        boroughIds: []
      });
      const response = await postProgramBook(annualProgramNew.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55297  Negative - Should not create a program book when using MTL along with other boroughs', async () => {
      const plainProgramBook = getPlainProgramBookProps({
        name: 'Carnet Intégré',
        projectTypes: [ProjectType.integrated],
        boroughIds: ['MTL', 'IBZSGV']
      });
      const response = await postProgramBook(annualProgramNew.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it("C55299  Negative - Should not create a program book when annual program doesn't have the right status", async () => {
      const plainProgramBook = getPlainProgramBookProps();
      const response = await postProgramBook(annualProgramSubmittedFinal.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55300  Negative - Should be forbidden with bad user', async () => {
      const forbiddenUsers = [userMocks.noAccess, userMocks.planner];

      for (const user of forbiddenUsers) {
        userMocker.mock(user);
        try {
          const plainProgramBook = getPlainProgramBookProps();
          const response = await postProgramBook(annualProgramNew.id, plainProgramBook);
          assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
        } finally {
          userMocker.mock(userMocks.pilot);
        }
      }
    });
  });

  describe('annualPrograms/:id/programBooks > GET', () => {
    beforeEach(async () => {
      await programBookRepository.save(
        getProgramBookInstance({
          annualProgram: annualProgramNew,
          status: ProgramBookStatus.programming
        })
      );
    });

    afterEach(async () => {
      await programBookModel.remove({}).exec();
    });

    it("C55372 - Positive - Should return an annual program's program books sorted from most recent to least recent", async () => {
      await programBookRepository.save(
        getProgramBookInstance({
          annualProgram: annualProgramNew,
          name: 'most recent'
        })
      );
      const response = await getProgramBooks(annualProgramNew.id);
      const enrichedProgramBooks: IEnrichedProgramBook[] = response.body;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(enrichedProgramBooks.length, 2);
      assert.strictEqual(enrichedProgramBooks[0].name, 'most recent');
    });

    it("C55374 - Negative - Should return an error when the annual program's id doesn't exist", async () => {
      const response = await getProgramBooks('5e1e355ee60ee35aa0ffc8f0');
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it("C55380 - Negative - Should return an error when the program book's id isn't valid", async () => {
      const response = await getProgramBooks('not-found');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C60096 - Positive - Should return program books with their projects', async () => {
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramProgramming
      });
      let project = await projectDataGenerator.store({ status: ProjectStatus.planned });
      const intervention = await interventionDataGenerator.store();
      project = await projectDataCoupler.coupleThem({
        project,
        interventions: [intervention],
        programBooksCoupler: [{ year: project.startYear, programBook }]
      });
      const response = await getProgramBooks(annualProgramProgramming.id, { expand: ProgramBookExpand.projects });
      const enrichedPaginatedProjects: IEnrichedPaginatedProjects = response.body[0].projects;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(enrichedPaginatedProjects.items.length, 1);
      assert.strictEqual(project.id, enrichedPaginatedProjects.items[0].id);
    });

    it('C60097 - Positive - Should return program books with their removed projects', async () => {
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramProgramming
      });
      const project = await programBooksData.createMockProjectInProgramBook(programBook, {
        status: ProjectStatus.programmed,
        programBookId: programBook.id
      });
      await programBooksData.updateMockProgramBook(programBook, {
        removedProjectsIds: [project.id]
      });
      const response = await getProgramBooks(annualProgramProgramming.id, { expand: 'removedProjects' });
      const enrichedRemovedProjects: IEnrichedProject[] = response.body[0].removedProjects.items;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(enrichedRemovedProjects.length, 1);
      assert.strictEqual(project.id, enrichedRemovedProjects[0].id);
    });

    it('C60944 - Negative - Should not return opened program books if the connected user is a planner', async () => {
      const defaultMock = userMocker.currentMock;
      userMocker.mock(userMocks.planner);
      try {
        const programBook = await createAndSaveProgramBook({
          annualProgram: annualProgramProgramming
        });
        assert.strictEqual(programBook.status, ProgramBookStatus.new);

        const response = await getProgramBooks(annualProgramProgramming.id, { expand: 'removedProjects' });

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const programBooks = response.body as IEnrichedProgramBook[];
        assert.isNotOk(
          programBooks.find(x => x.status === ProgramBookStatus.new),
          'The response should not contain program books with the status "new"'
        );
      } finally {
        userMocker.mock(defaultMock);
      }
    });
  });

  describe('annualPrograms/:id/programBooks > GET (share)', () => {
    let annualProgram1: AnnualProgram;
    let programBook2: ProgramBook;

    beforeEach(async () => {
      annualProgram1 = await createAndSaveAnnualProgram();

      await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramProgramming,
        sharedRoles: [Role.REQUESTOR]
      });

      programBook2 = await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramProgramming,
        sharedRoles: [Role.EXECUTOR]
      });
    });

    beforeEach(() => {
      userMocker.mock(userMocks.executor);
    });

    afterEach(() => {
      userMocker.mock(userMocks.pilot);
    });

    it('C57150  Positive - Should retrieve program books that are shared with the user', async () => {
      const response = await getProgramBooks(annualProgramProgramming.id);

      const programBooks: IEnrichedProgramBook[] = response.body;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(programBooks.length, 1);
      assert.strictEqual(programBooks[0].id, programBook2.id);
    });

    it('C57151  Negative - Should not retrieve program books for unaccessible annual program', async () => {
      const response = await getProgramBooks(annualProgram1.id);
      assert.isEmpty(response.body);
    });
  });

  describe('programBooks/:id > GET', () => {
    let enrichedProgramBook: IEnrichedProgramBook;
    let enrichedPniProgramBook: IEnrichedProgramBook;

    beforeEach(async () => {
      const pb: ProgramBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });
      const pniProgramBook: ProgramBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        projectTypes: [ProjectType.nonIntegrated],
        programTypes: [PROGRAM_TYPE_PCPR]
      });
      enrichedProgramBook = await programBookMapperDTO.getFromModel(pb);
      enrichedPniProgramBook = await programBookMapperDTO.getFromModel(pniProgramBook);
    });

    afterEach(async () => {
      await programBookModel.remove({}).exec();
    });

    it('C55375 - Positive - Should return a program book', async () => {
      const response = await getProgramBook(enrichedProgramBook.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      delete enrichedProgramBook.annualProgram;
      assert.deepEqual(removeEmpty(enrichedProgramBook), response.body);
    });

    it('C55375 - Positive - Should return a pni program book', async () => {
      const response = await getProgramBook(enrichedPniProgramBook.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      delete enrichedPniProgramBook.annualProgram;
      assert.deepEqual(removeEmpty(enrichedPniProgramBook), response.body);
    });

    it("C55376 - Negative - Should return an error when the program book's id doesn't exist", async () => {
      const response = await getProgramBook('5e1e355ee60ee35aa0ffc8f0');
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it("C55381 - Negative - Should return an error when the program book's id isn't valid", async () => {
      const response = await getProgramBook('not-found', true);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C60098 - Positive - Should return a program book with their projects', async () => {
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });
      let project = await projectDataGenerator.store({ status: ProjectStatus.planned });
      const intervention = await interventionDataGenerator.store();
      project = await projectDataCoupler.coupleThem({
        project,
        interventions: [intervention],
        programBooksCoupler: [{ year: project.startYear, programBook }]
      });
      const res = await getProgramBook(programBook.id, false, { expand: [ProgramBookExpand.projects] });
      const enrichedProjects: IEnrichedProject[] = res.body.projects.items;
      assert.strictEqual(res.status, HttpStatusCodes.OK);
      assert.strictEqual(enrichedProjects.length, 1);
      assert.strictEqual(project.id, enrichedProjects[0].id);
    });

    it('C60099 - Positive - Should return a program book with their removed projects', async () => {
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });
      const project = await programBooksData.createMockProjectInProgramBook(programBook, {
        status: ProjectStatus.programmed,
        programBookId: programBook.id
      });
      await programBooksData.updateMockProgramBook(programBook, {
        removedProjectsIds: [project.id]
      });
      const res = await getProgramBook(programBook.id, false, { expand: ['removedProjects'] });
      const enrichedRemovedProjects: IEnrichedProject[] = res.body.removedProjects.items;
      assert.strictEqual(res.status, HttpStatusCodes.OK);
      assert.strictEqual(enrichedRemovedProjects.length, 1);
      assert.strictEqual(project.id, enrichedRemovedProjects[0].id);
    });

    it('C60945 - Negative - Should not return an opened program book if the connected user is a planner', async () => {
      const defaultMock = userMocker.currentMock;
      userMocker.mock(userMocks.planner);
      try {
        const programBook = await createAndSaveProgramBook({
          annualProgram: annualProgramNew
        });
        assert.strictEqual(programBook.status, ProgramBookStatus.new);

        const response = await getProgramBook(programBook.id);

        assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
      } finally {
        userMocker.mock(defaultMock);
      }
    });
  });

  describe('programBooks/:id > GET (share)', () => {
    // let annualProgram1: AnnualProgram;
    let programBook1: ProgramBook;
    let programBook2: ProgramBook;

    beforeEach(async () => {
      // annualProgram1 = await createAndSaveAnnualProgram();

      programBook1 = await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramNew,
        sharedRoles: [Role.REQUESTOR]
      });

      programBook2 = await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramNew,
        sharedRoles: [Role.EXECUTOR]
      });
    });

    beforeEach(() => {
      userMocker.mock(userMocks.executor);
    });

    afterEach(() => {
      userMocker.mock(userMocks.pilot);
    });

    it('C57152  Positive - Should retrieve program book that is shared with the user', async () => {
      const response = await getProgramBook(programBook2.id);

      const programBook: IEnrichedProgramBook = response.body;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(programBook.id, programBook2.id);
    });

    it('C57153  Negative - Should not retrieve program book that is not shared', async () => {
      const response = await getProgramBook(programBook1.id);

      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });

  describe('programBooks/:id > PUT', () => {
    let programBook: ProgramBook;
    let programBook2: ProgramBook;

    beforeEach(async () => {
      annualProgramNew = await createAndSaveAnnualProgram();
      annualProgramNew2 = await createAndSaveAnnualProgram();
      programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        projectTypes: [ProjectType.integrated, ProjectType.integratedgp]
      });
      programBook2 = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        name: 'Carnet Intégré',
        projectTypes: [ProjectType.other]
      });
    });

    afterEach(async () => {
      await programBookModel.remove({}).exec();
      await annualProgramModel.deleteMany({}).exec();
    });

    function assertProgramBookUpdate(
      response: superagent.Response,
      annualProgram: AnnualProgram,
      originalProgramBook: ProgramBook,
      plainProgramBook: IPlainProgramBookProps
    ): void {
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const enrichedProgramBook: IEnrichedProgramBook = response.body;
      assert.isOk(enrichedProgramBook);
      assert.isOk(enrichedProgramBook.id);
      assert.strictEqual(enrichedProgramBook.id, originalProgramBook.id);
      assert.isOk(enrichedProgramBook.audit);
      assert.isOk(enrichedProgramBook.audit.lastModifiedBy);
      assert.strictEqual(enrichedProgramBook.annualProgramId, annualProgram.id);
      assert.deepInclude(enrichedProgramBook, plainProgramBook);
    }

    async function createMockProjectInProgramBook(
      mockProgramBook: ProgramBook,
      projectOptions?: Partial<IEnrichedProject>
    ): Promise<IEnrichedProject> {
      const projectArg = await createMockProject(projectOptions);
      projectArg.annualDistribution.annualPeriods[0].programBookId = mockProgramBook.id;
      const doc = await projectModel.create(projectArg);
      const project = normalizeDataTest.normalizeData(doc.toObject());
      const intervention = await interventionDataGenerator.store({}, project);
      await projectDataCoupler.coupleThem({ project, interventions: [intervention] });
      return project;
    }

    const plainUpdateProps: IPlainProgramBookProps = {
      name: 'Carnet PI modifié',
      projectTypes: [ProjectType.nonIntegrated],
      programTypes: [PROGRAM_TYPE_PCPR],
      boroughIds: ['OUT', 'SLR'],
      inCharge: 'Olivier Chevrel Modifié',
      status: ProgramBookStatus.new
    };

    it('C55328  Positive - Should update a program book', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assertProgramBookUpdate(response, annualProgramNew, programBook, plainProgramBook);
    });

    it('C55369 - Positive - Should change status from new to opened', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      plainProgramBook.status = ProgramBookStatus.programming;
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assertProgramBookUpdate(response, annualProgramNew, programBook, plainProgramBook);
      assert.strictEqual(response.body.status, ProgramBookStatus.programming);
    });

    it('C55370 - Negative - Should return an unprocessable entity status when changing status from new to submittedFinal', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      plainProgramBook.sharedRoles = allSharedRolesProgramBookSubmittedFinal;

      plainProgramBook.status = ProgramBookStatus.submittedFinal;
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('Positive - Should return OK status when changing status to submittedFinal', async () => {
      const programBook3 = await createAndSaveProgramBook({
        status: ProgramBookStatus.submittedPreliminary,
        annualProgram: annualProgramNew,
        name: 'Carnet Intégré Test submittedFinal',
        projectTypes: [ProjectType.other]
      });

      const body = {
        name: programBook3.name,
        projectTypes: programBook3.projectTypes,
        status: ProgramBookStatus.submittedFinal,
        sharedRoles: allSharedRolesProgramBookSubmittedFinal
      };

      const response = await putProgramBook(programBook3.id, body);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.id, programBook3.id);
      assert.strictEqual(response.body.status, ProgramBookStatus.submittedFinal);
    });

    it('Negative - Should return an UNPROCESSABLE_ENTITY status when changing status to submittedFinal with sharedRole different from taxo and error code is ProgramBookNotSharedEntirely', async () => {
      const programBook3 = await createAndSaveProgramBook({
        status: ProgramBookStatus.submittedPreliminary,
        annualProgram: annualProgramNew,
        name: 'Carnet Intégré Test submittedFinal',
        projectTypes: [ProjectType.other]
      });

      const body = {
        name: programBook3.name,
        projectTypes: programBook3.projectTypes,
        status: ProgramBookStatus.submittedFinal,
        sharedRoles: [Role.REQUESTOR, Role.INTERNAL_GUEST_STANDARD, Role.EXECUTOR]
      };

      const response = await putProgramBook(programBook3.id, body);

      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const error = response.body.error.target.filter((t: any) => t.code === ErrorCodes.ProgramBookNotSharedEntirely);
      assert.strictEqual(error[0].code, ErrorCodes.ProgramBookNotSharedEntirely);
    });

    it('C55329  Positive - Should update a program book with project types and boroughs for different annual programs', async () => {
      // Create 2 program books for different annual programs
      const programBookLocal = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });
      const programBookLocal2 = await createAndSaveProgramBook({
        annualProgram: annualProgramNew2,
        name: 'Duplicate Test'
      });

      const plainProgramBook2 = getPlainProgramBookProps(plainUpdateProps);
      plainProgramBook2.name = programBookLocal.name;
      const response2 = await putProgramBook(programBookLocal2.id, plainProgramBook2);
      assertProgramBookUpdate(response2, annualProgramNew2, programBookLocal2, plainProgramBook2);
    });

    it('C55330  Negative - Should not update a program book with invalid program book id', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      const response = await putProgramBook('invalid-format', plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55331  Negative - Should not update a program book with nonexisting id', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      const response = await putProgramBook('1e1c990176c00222cdbfa7ac', plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C55332  Negative - Should not update a program book with invalid input', async () => {
      const plainProgramBook = getPlainProgramBookProps({
        name: null,
        projectTypes: [],
        boroughIds: []
      });
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55333  Negative - Should not update a program book when using MTL along with other boroughs', async () => {
      const plainProgramBook = getPlainProgramBookProps({
        boroughIds: ['MTL', 'IBZSGV']
      });
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('Should not update a program book if it contains projectType pni and an another type', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      plainProgramBook.projectTypes = [ProjectType.nonIntegrated, ProjectType.integrated];
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Should not update a program book if it contains projectType pni and no programTypes', async () => {
      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      plainProgramBook.projectTypes = [ProjectType.nonIntegrated];
      plainProgramBook.programTypes = [];
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it("C55335  Negative - Should not update a program book when annual program doesn't have the right status", async () => {
      const annualProgramLocal = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.submittedFinal
      });

      const programBookLocal = await createAndSaveProgramBook({
        status: ProgramBookStatus.submittedFinal,
        annualProgram: annualProgramLocal
      });

      const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
      plainProgramBook.status = ProgramBookStatus.submittedFinal;
      const response = await putProgramBook(programBookLocal.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55336  Negative - Should be forbidden with bad user', async () => {
      const forbiddenUsers = [userMocks.noAccess, userMocks.planner];

      for (const user of forbiddenUsers) {
        userMocker.mock(user);
        try {
          const plainProgramBook = getPlainProgramBookProps(plainUpdateProps);
          const response = await putProgramBook(annualProgramNew.id, plainProgramBook);
          assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
        } finally {
          userMocker.mock(userMocks.pilot);
        }
      }
    });

    it("C55383 - Positive - Should be able to update program book's project types if it does not contain projects with same types", async () => {
      await openProgramBook(programBook);
      await createMockProjectInProgramBook(programBook, { boroughId: BoroughCode.VRD });
      const plainProgramBook = getPlainProgramBookProps({
        projectTypes: [ProjectType.integrated],
        status: ProgramBookStatus.programming
      });
      plainProgramBook.boroughIds = [BoroughCode.OUT, BoroughCode.VRD];
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it('C60052 - Positive - Should change annual program status to programming when program book status is changing to programming', async () => {
      const originalAnnualProgramBook = await annualProgramRepository.findById(programBook2.annualProgram.id);
      assert.strictEqual(originalAnnualProgramBook.status, AnnualProgramStatus.new);
      const responseProgramBook = await openProgramBook(programBook2);
      assert.strictEqual(responseProgramBook.status, HttpStatusCodes.OK);
      assert.strictEqual(responseProgramBook.body.status, ProgramBookStatus.programming);
      const persistedAnnualProgram = await annualProgramRepository.findById(originalAnnualProgramBook.id);
      assert.strictEqual(persistedAnnualProgram.status, AnnualProgramStatus.programming);
    });

    it("C55384 - Positive - Should be able to update program book's boroughs if it contains projects without same boroughs", async () => {
      await createMockProjectInProgramBook(programBook, {
        boroughId: BoroughCode.OUT,
        projectTypeId: ProjectType.integratedgp
      });
      const plainProgramBook = getPlainProgramBookProps({
        boroughIds: [BoroughCode.OUT],
        status: ProgramBookStatus.programming
      });
      await openProgramBook(programBook);
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it("C55385 - Negative - Should not be able to update program book's project types if it contains projects with same types", async () => {
      await createMockProjectInProgramBook(programBook);
      const plainProgramBook = getPlainProgramBookProps({
        projectTypes: [ProjectType.other],
        status: ProgramBookStatus.programming
      });
      await openProgramBook(programBook);
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it("C55386 - Negative - Should not be able to update program book's boroughs if it contains projects with same boroughs", async () => {
      await createMockProjectInProgramBook(programBook, {
        boroughId: BoroughCode.OUT
      });
      const plainProgramBook = getPlainProgramBookProps({
        boroughIds: [BoroughCode.SLR],
        status: ProgramBookStatus.programming
      });
      await openProgramBook(programBook);
      const response = await putProgramBook(programBook.id, plainProgramBook);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  describe('programBooks/:id/projects > GET', () => {
    let enrichedProgramBook: ProgramBook;
    let enrichedProject: IEnrichedProject;

    beforeEach(async () => {
      enrichedProgramBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });

      enrichedProject = await createMockProject(null, {
        projectGeoAnnualDistribution: { annualPeriods: [{ programBookId: enrichedProgramBook.id }] }
      } as any);
    });

    afterEach(async () => {
      await programBookModel.remove({}).exec();
    });

    it(`C55533 Positive - Should return a list of projects for a specific programBook.id`, async () => {
      const response = await getProgramBookProjects(enrichedProgramBook.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isArray(response.body);
      delete response.body[0].constraints; // TODO remove this delete, should be managed by mapper or lookup
      assert.deepEqual(response.body[0], enrichedProject);
    });

    it(`C55534 Negative - Should return an error when the program book's id doesn't exist`, async () => {
      const response = await getProgramBookProjects(`${mongoose.Types.ObjectId()}`);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C55535 Negative - Should return an error when the program book's id isn't valid`, async () => {
      const response = await getProgramBookProjects('bad-request');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('programBooks/:id/projects > POST', () => {
    let programBook: ProgramBook;
    let programBook2: ProgramBook;
    let annualProgramOpen: AnnualProgram;
    let postProject: IEnrichedProject;
    let pniProject: IEnrichedProject;

    beforeEach(async () => {
      annualProgramOpen = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });

      annualProgramNew = await createAndSaveAnnualProgram();
      programBook = await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramOpen
      });
      programBook2 = await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramOpen
      });
      const mockProject = await getEnrichedProjectWithIntervention();
      const responseProject = (await projectRepository.save(mockProject)).getValue();
      postProject = responseProject;
      const mockPniProject: IEnrichedProject = {
        ...(await getEnrichedProjectWithIntervention(getCompleteEnrichedIntervention())),
        projectTypeId: ProjectType.nonIntegrated
      };
      pniProject = (await projectRepository.save(mockPniProject)).getValue();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    function programProject(project: IEnrichedProject, programBookId: string): Promise<supertest.Response> {
      return requestService.post(`${programBooksUrl}/${programBookId}/projects`, {
        body: { projectId: project.id }
      });
    }

    it('C55387 - Positive - Should be able to program a project in programBook', async () => {
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.annualDistribution.annualPeriods[0].programBookId, programBook.id);
    });

    it('C55340 - Positive - Should set priorityScenarios isOutdated property to true when programming a project in programBook', async () => {
      await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });

      const response = await requestService.get(`${programBooksUrl}/${programBook.id}`, {});
      const updatedProgramBook: IEnrichedProgramBook = response.body;

      programBook.priorityScenarios.forEach(ps => assert.isFalse(ps.isOutdated));
      updatedProgramBook.priorityScenarios.forEach(ps => assert.isTrue(ps.isOutdated));
    });

    it("Positive - Should be able to program a project in programBook if it's previous annualPeriods are programmed", async () => {
      const mockAnnualProgram = await createAndSaveAnnualProgram({
        year: appUtils.getCurrentYear() + 1,
        status: AnnualProgramStatus.new
      });
      const mockProgramBook = await createAndSaveProgramBook({
        annualProgram: mockAnnualProgram,
        status: ProgramBookStatus.programming
      });
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.annualDistribution.annualPeriods[0].programBookId, programBook.id);
      assert.strictEqual(response.body.annualDistribution.annualPeriods[0].status, ProjectStatus.programmed);
      assert.isNotOk(response.body.annualDistribution.annualPeriods[1].programBookId);
      assert.notEqual(response.body.annualDistribution.annualPeriods[1].status, ProjectStatus.programmed);

      const response2 = await requestService.post(`${programBooksUrl}/${mockProgramBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response2.status, HttpStatusCodes.OK);
      assert.strictEqual(response2.body.annualDistribution.annualPeriods[0].programBookId, programBook.id);
      assert.strictEqual(response2.body.annualDistribution.annualPeriods[1].programBookId, mockProgramBook.id);
      assert.strictEqual(response2.body.annualDistribution.annualPeriods[0].status, ProjectStatus.programmed);
      assert.strictEqual(response2.body.annualDistribution.annualPeriods[0].status, ProjectStatus.programmed);
    });

    it('C57043 - Positive - Should change programBook status to programming', async () => {
      const programBookResponse = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(programBookResponse.status, HttpStatusCodes.OK);
      const response = await requestService.get(`${programBooksUrl}/${programBook.id}`, {});
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.status, ProgramBookStatus.programming);
    });

    it('C55388 - Positive - Should change project status to programmed when programmed in program book', async () => {
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.body.status, ProjectStatus.programmed);
    });

    it('C55389 - Positive - Should move project from projectBook 1 to projectBook 2', async () => {
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.body.annualDistribution.annualPeriods[0].programBookId, programBook.id);
      const response2 = await requestService.post(`${programBooksUrl}/${programBook2.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.notEqual(response2.body.annualDistribution.annualPeriods[0].programBookId, programBook.id);
      assert.strictEqual(response2.body.annualDistribution.annualPeriods[0].programBookId, programBook2.id);
    });

    it('C55390 - Negative - Should not be able to program canceled projects in program book', async () => {
      postProject = await projectDataGenerator.store({
        status: ProjectStatus.canceled
      });
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C57044 - Negative - Should not change program book status', async () => {
      const project = getEnrichedCompleteProject();
      project.status = ProjectStatus.canceled;
      postProject = await projectModel.create(project);
      const programBookResponse = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(programBookResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const response = await requestService.get(`${programBooksUrl}/${programBook.id}`, {});
      assert.strictEqual(response.body.status, ProgramBookStatus.programming);
    });

    it('C55391 - Negative - Should not be able to program a project to a nonopened program book', async () => {
      const programBookUnopen = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        name: 'non open'
      });
      const mockProject = await getEnrichedProjectWithIntervention();
      postProject = await projectModel.create(mockProject);
      const response = await requestService.post(`${programBooksUrl}/${programBookUnopen.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55392 - Negative - Should not be able to program a project when its year is different of program book year', async () => {
      const project = getEnrichedCompleteProject();
      project.status = ProjectStatus.canceled;
      postProject = await projectModel.create(project);
      postProject.startYear += 10;
      postProject.endYear += 10;
      postProject = await projectModel.findOneAndUpdate({ _id: postProject.id }, postProject).exec();
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55393 - Negative - Should not be able to program a project when its type is different of program book allowed types', async () => {
      const project = getEnrichedCompleteProject();
      project.status = ProjectStatus.canceled;
      postProject = await projectModel.create(project);
      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('Negative - Should not be able to program a project in programBook if previous annualPeriods are not programmed', async () => {
      const annualProgramNewDate = await createAndSaveAnnualProgram({
        year: getAnnualProgramProps().year + 1,
        status: AnnualProgramStatus.new
      });
      programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNewDate,
        status: ProgramBookStatus.programming
      });

      const response = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    PROGRAMBOOK_PROGRAMMABLE_STATUSES.forEach(status => {
      it(`C57084 - Positive - Should program a project when the program book status is "${status}"`, async () => {
        const pb = await createAndSaveProgramBook({
          status,
          annualProgram: annualProgramOpen
        });
        const response = await programProject(postProject, pb.id);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
      });
    });

    enumValues<ProgramBookStatus>(ProgramBookStatus)
      .filter(unauthorizedStatus => !PROGRAMBOOK_PROGRAMMABLE_STATUSES.includes(unauthorizedStatus))
      .forEach(status => {
        it(`Negative - Should NOT program a project when the program book status is "${status}"`, async () => {
          const pb = await createAndSaveProgramBook({
            status,
            annualProgram: annualProgramOpen
          });
          const response = await programProject(postProject, pb.id);
          assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
        });
      });

    it('Positive - Should program a project when the program book is pni', async () => {
      const pb = await createAndSaveProgramBook({
        status: ProgramBookStatus.programming,
        annualProgram: annualProgramOpen,
        projectTypes: [ProjectType.nonIntegrated],
        programTypes: [PROGRAM_TYPE_PCPR]
      });
      const response = await programProject(pniProject, pb.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it.skip('C58392 - Positive - Should change annual program status to programmed when project is programmed in a program book', async () => {
      const responseProject = await requestService.post(`${programBooksUrl}/${programBook.id}/projects`, {
        body: { projectId: postProject.id }
      });
      assert.strictEqual(responseProject.status, HttpStatusCodes.OK);
      const response = await annualProgramRepository.findById(programBook.annualProgram.id);
      assert.strictEqual(response.status, AnnualProgramStatus.programming);
    });

    it('C60100 - Positive - Should remove the id from removed ids project after programing a project', async () => {
      await programBooksData.updateMockProgramBook(programBook, {
        removedProjectsIds: [postProject.id]
      });
      const res = await programProject(postProject, programBook.id);
      const persistedProgramBook: ProgramBook = await programBookRepository.findById(programBook.id);
      assert.strictEqual(res.status, HttpStatusCodes.OK);
      assert.notInclude(
        persistedProgramBook.removedProjects.map(rp => rp.id),
        postProject.id
      );
    });
  });

  describe('programBooks/:id > PUT (Share)', () => {
    let programBook: ProgramBook;
    let annualProgram: AnnualProgram;

    beforeEach(async () => {
      annualProgramNew = await createAndSaveAnnualProgram();
      annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.programming });

      programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        status: ProgramBookStatus.programming
      });
    });

    afterEach(async () => {
      await programBookModel.deleteMany({}).exec();
      await annualProgramModel.deleteMany({}).exec();
    });

    it('C57600 - Positive - Should be able to share a program book on its opening with the shared roles of the annual program', async () => {
      const sharedRoles = [Role.EXECUTOR, Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED];
      const annualProgramSharedRole = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming,
        sharedRoles
      });

      const programBook2 = await createAndSaveProgramBook({
        annualProgram: annualProgramSharedRole,
        status: ProgramBookStatus.new
      });
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.programming
      });
      const response = await requestService.put(`${programBooksUrl}/${programBook2.id}`, { body: plainProgramBook });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepStrictEqual(response.body.sharedRoles, sharedRoles);
    });

    it('C57091 - Positive - Should be able to share a program book with executor, internal guest standard and internal guest restricted', async () => {
      const sharedRoles = [Role.EXECUTOR, Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED];
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.programming,
        sharedRoles
      });
      const response = await requestService.put(`${programBooksUrl}/${programBook.id}`, { body: plainProgramBook });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepStrictEqual(response.body.sharedRoles, sharedRoles);
    });

    it('C57092 - Positive - Should be able to share a program book with requestor, internal guest standard and internal guest restricted', async () => {
      const sharedRoles = [Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED];
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.programming,
        sharedRoles
      });
      const response = await requestService.put(`${programBooksUrl}/${programBook.id}`, { body: plainProgramBook });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepStrictEqual(response.body.sharedRoles, sharedRoles);
    });

    it('C57093 - Negative - Should not be able to create a program book with shared roles', async () => {
      const sharedRoles = [Role.EXECUTOR, Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED];
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.programming,
        sharedRoles
      });
      const response = await requestService.post(`${annualProgramsUrl}/${annualProgram.id}/programBooks`, {
        body: plainProgramBook
      });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C57094 - Negative - Should not be able to share a program book with external guest', async () => {
      const sharedRoles = [Role.EXTERNAL_GUEST];
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.programming,
        sharedRoles
      });
      const putResponse = await requestService.put(`${programBooksUrl}/${programBook.id}`, { body: plainProgramBook });
      await requestService.put(`${programBooksUrl}/${programBook.id}`, { body: plainProgramBook });
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C57598 - Negative - Should not be able to share a program book when its status is new', async () => {
      const programBookNew = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        status: ProgramBookStatus.new
      });
      const sharedRoles = [Role.INTERNAL_GUEST_STANDARD];
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.new,
        sharedRoles
      });
      const putResponse = await requestService.put(`${programBooksUrl}/${programBookNew.id}`, {
        body: plainProgramBook
      });
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
    it('C57599 - Negative - Should not delete a program book with isAutomaticLoadingInProgress set true', async () => {
      const sharedRoles = [Role.EXECUTOR, Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED];
      const programBookIsAutomaticLoadingInProgress = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        isAutomaticLoadingInProgress: true
      });
      const plainProgramBook = getPlainProgramBookProps({
        status: ProgramBookStatus.programming,
        sharedRoles
      });
      const putResponse = await requestService.put(`${programBooksUrl}/${programBookIsAutomaticLoadingInProgress.id}`, {
        body: plainProgramBook
      });
      assert.strictEqual(putResponse.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const error = putResponse.body.error.target.filter(
        (t: any) => t.code === ErrorCodes.ProgramBookIsAutomaticLoadingInProgress
      );
      assert.strictEqual(error[0].code, ErrorCodes.ProgramBookIsAutomaticLoadingInProgress);
      assert.strictEqual(
        error[0].message,
        'A program book is no longer accessible for modification during an automatic loading true'
      );
    });
  });

  describe('programBooks/:id > DELETE', () => {
    let programBook: ProgramBook;
    let programBook2: ProgramBook;
    let programBookIsAutomaticLoadingInProgress: ProgramBook;

    beforeEach(async () => {
      annualProgramNew = await createAndSaveAnnualProgram();
      annualProgramNew2 = await createAndSaveAnnualProgram();
      programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });
      programBook2 = await createAndSaveProgramBook({
        annualProgram: annualProgramNew
      });
      programBookIsAutomaticLoadingInProgress = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        isAutomaticLoadingInProgress: true
      });
      await createMockProject(null, {
        projectGeoAnnualDistribution: { annualPeriods: [{ programBookId: programBook2.id }] }
      });
    });

    afterEach(async () => {
      await programBookModel.remove({}).exec();
      await annualProgramModel.deleteMany({}).exec();
      await projectModel.deleteMany({}).exec();
    });

    it('C60623 - Positive - Should delete a program book', async () => {
      const response = await deleteProgramBook(programBook.id);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const response2 = await getProgramBook(programBook.id);
      assert.strictEqual(response2.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C60624 - Negative - Should not delete a program book with project', async () => {
      const response = await deleteProgramBook(programBook2.id);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C60625 - Negative - Should not delete a program book with a wrong id', async () => {
      const response = await deleteProgramBook('wrong id');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C60626 - Negative - Should not delete a program book with an inexistant id', async () => {
      const response = await deleteProgramBook(mongoose.Types.ObjectId().toHexString());
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C60627 - Negative - Should not delete a program book with isAutomaticLoadingInProgress set true', async () => {
      const response = await deleteProgramBook(programBookIsAutomaticLoadingInProgress.id);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      const error = response.body.error.target.filter(
        (t: any) => t.code === ErrorCodes.ProgramBookIsAutomaticLoadingInProgress
      );
      assert.strictEqual(error[0].code, ErrorCodes.ProgramBookIsAutomaticLoadingInProgress);
      assert.strictEqual(
        error[0].message,
        'A program book is no longer accessible for modification during an automatic loading true'
      );
    });
  });
  describe('programBooks/:id/load > POST', () => {
    let pniProgramBook: ProgramBook;
    let pniProgramBookFail: ProgramBook;
    /**
     * POST a program book
     * @param programBookId
     * @returns void
     */
    function postProgramBookAutomaticLoading(programBookId: string): Promise<supertest.Response> {
      return requestService.post(`${programBooksUrl}/${programBookId}/load`, {});
    }

    beforeEach(async () => {
      pniProgramBook = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        projectTypes: [ProjectType.nonIntegrated],
        programTypes: [PROGRAM_TYPE_PCPR],
        status: ProgramBookStatus.programming
      });
      pniProgramBookFail = await createAndSaveProgramBook({
        annualProgram: annualProgramNew,
        status: ProgramBookStatus.new
      });
    });

    afterEach(async () => {
      await programBookModel.remove({}).exec();
    });
    describe('Postive', () => {
      it('C70001 - Positive - Should execute automatic loading program book', async () => {
        const response = await postProgramBookAutomaticLoading(pniProgramBook.id);
        assert.strictEqual(response.status, HttpStatusCodes.ACCEPTED);
      });
    });
    describe('Negative', () => {
      it('C70002 - Negative - Should not execute automatic loading program book', async () => {
        const response = await postProgramBookAutomaticLoading(pniProgramBookFail.id);
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
    });
  });
});
