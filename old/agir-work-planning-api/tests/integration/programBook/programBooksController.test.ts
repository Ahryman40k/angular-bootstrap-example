import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  IEnrichedProgramBook,
  ProgramBookStatus,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert, expect } from 'chai';

import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../../src/features/database/DB';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { ProgramBookModel } from '../../../src/features/programBooks/mongo/programBookModel';
import { createAndSaveProgramBook } from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ProjectModel } from '../../../src/features/projects/mongo/projectModel';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { projectDataCoupler } from '../../data/dataCouplers/projectDataCoupler';
import { interventionDataGenerator } from '../../data/dataGenerators/interventionDataGenerator';
import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { programBooksData } from '../../data/programBooksData';
import { userMocks } from '../../data/userMocks';
import { programBooksTestClient } from '../../utils/testClients/programBooksTestClient';
import { userMocker } from '../../utils/userUtils';

// tslint:disable:max-func-body-length
describe(`SearchProgramBooksController`, () => {
  let programBookModel: ProgramBookModel;
  let projectModel: ProjectModel;

  let annualProgramProgramming: AnnualProgram;
  const programBooks: ProgramBook[] = [];

  after(async () => {
    await programBookModel.remove({}).exec();
    await projectModel.remove({}).exec();
    userMocker.reset();
  });

  before(async () => {
    userMocker.mock(userMocks.pilot);
    programBookModel = db().models.ProgramBook;
    projectModel = db().models.Project;
    annualProgramProgramming = await createAndSaveAnnualProgram({
      status: AnnualProgramStatus.programming
    });

    for (let i = 0; i < 4; i++) {
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramProgramming
      });

      for (let j = 0; j < 4; j++) {
        let project = await projectDataGenerator.store({ status: ProjectStatus.planned });
        const intervention = await interventionDataGenerator.store();
        project = await projectDataCoupler.coupleThem({
          project,
          interventions: [intervention],
          programBooksCoupler: [{ year: project.startYear, programBook }]
        });
      }

      const removedProjects = [];
      for (let k = 0; k < 4; k++) {
        const removedProject = await programBooksData.createMockProjectInProgramBook(programBook, {
          status: ProjectStatus.programmed,
          programBookId: null
        });

        removedProject.annualDistribution.annualPeriods[0].programBookId = null;
        removedProjects.push(removedProject);
      }

      await projectRepository.saveBulk(removedProjects);
      await programBooksData.updateMockProgramBook(programBook, {
        removedProjectsIds: removedProjects.map(item => item.id)
      });

      programBooks.push(programBook);
    }
  });

  describe('/v1/programBooks - GET', () => {
    it('Positive - Should return a list of program books', async () => {
      const response = await programBooksTestClient.search('');
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, programBooks.length);
    });

    it('Positive - Should return specific program books by idquery argument', async () => {
      const ids = [programBooks[0].id, programBooks[1].id];
      const response = await programBooksTestClient.search(`id=${ids.join(',')}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, 2);
      assert.notEqual(response.body.items[0].id, response.body.items[1].id);
      assert.include(ids, response.body.items[0].id);
      assert.include(ids, response.body.items[1].id);
    });

    it('Negative - Should return empty results if idquery not found', async () => {
      const id = '999999999999999999999999';
      const response = await programBooksTestClient.search(`id=${id}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, 0);
    });

    it(`Negative - Should return error Forbiden when status eq ${ProgramBookStatus.new} and user has not permissions`, async () => {
      userMocker.mock(userMocks.planner);
      const response = await programBooksTestClient.search(`status=${ProgramBookStatus.new}`);
      assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
    });

    it(`Negative - Should return program books without status eq ${ProgramBookStatus.new}`, async () => {
      annualProgramProgramming = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramProgramming,
        status: ProgramBookStatus.new
      });
      userMocker.mock(userMocks.planner);
      const response = await programBooksTestClient.search('');
      assert.isFalse(response.body.items.some(item => item.id === programBook.id));
    });

    it('Negative - Should return invalid query error if idquery is invalid', async () => {
      const id = 'notValid';
      const response = await programBooksTestClient.search(`id=${id}`);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Positive - Should return program books with their annual program', async () => {
      const response = await programBooksTestClient.search(`expand=annualProgram`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, programBooks.length);
      const enrichedProgramBooks: IEnrichedProgramBook[] = response.body.items;
      enrichedProgramBooks.forEach(programBook => {
        assert.property(programBook, 'annualProgram');
      });
    });

    it('Positive - Should return program books with their projects', async () => {
      const response = await programBooksTestClient.search(`expand=projects`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, programBooks.length);
      const enrichedProgramBooks: IEnrichedProgramBook[] = response.body.items;
      enrichedProgramBooks.forEach(programBook => {
        assert.strictEqual(programBook.projects.items.length, 4);
      });
    });

    it('Positive - Should return program books with their removed projects', async () => {
      const response = await programBooksTestClient.search(`expand=removedProjects`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, programBooks.length);
      const enrichedProgramBooks: IEnrichedProgramBook[] = response.body.items;
      enrichedProgramBooks.forEach(programBook => {
        assert.strictEqual(programBook.removedProjects.items.length, 4);
      });
    });

    it('Positive - Should limit projects with projectLimit argument', async () => {
      const response = await programBooksTestClient.search(`expand=projects&projectLimit=2`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, programBooks.length);

      response.body.items.forEach(programBook => {
        assert.strictEqual(programBook.projects.paging.limit, 2);
        assert.isTrue(programBook.projects.items.length <= 2);
      });
    });

    it('Positive - Should offset projects with projectOffset argument', async () => {
      const responseNoOffset = await programBooksTestClient.search(`id=${programBooks[0].id}&expand=projects`);
      const responseWithOffset = await programBooksTestClient.search(
        `id=${programBooks[0].id}&expand=projects&projectOffset=2`
      );
      assert.strictEqual(responseWithOffset.status, HttpStatusCodes.OK);
      expect(responseWithOffset.body.items[0].projects.items[0].id).to.be.equal(
        responseNoOffset.body.items[0].projects.items[2].id
      );
    });

    it('Positive - Should limit removed projects with projectLimit argument', async () => {
      const response = await programBooksTestClient.search(`expand=removedProjects&projectLimit=2`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.paging.totalCount, programBooks.length);

      response.body.items.forEach(programBook => {
        assert.strictEqual(programBook.removedProjects.paging.limit, 2);
        assert.isTrue(programBook.removedProjects.items.length <= 2);
      });
    });

    it('Positive - Should offset removed projects with projectOffset argument', async () => {
      const responseNoOffset = await programBooksTestClient.search(`id=${programBooks[0].id}&expand=removedProjects`);
      const responseWithOffset = await programBooksTestClient.search(
        `id=${programBooks[0].id}&expand=removedProjects&projectOffset=2`
      );
      assert.strictEqual(responseWithOffset.status, HttpStatusCodes.OK);
      expect(responseWithOffset.body.items[0].removedProjects.items[0].id).to.be.equal(
        responseNoOffset.body.items[0].removedProjects.items[2].id
      );
    });

    [
      {
        fields: ['name']
      },
      {
        fields: ['status']
      },
      {
        fields: ['inCharge', 'boroughIds']
      },
      {
        fields: ['removedProjects']
      }
    ].forEach(test => {
      it(`Positive - Should only return ${test.fields.join(
        ','
      )} as mentionned in fields request parameter`, async () => {
        const response = await programBooksTestClient.search(`fields=${test.fields.join(',')}&expand=removedProjects`);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const foundProgramBooks: IEnrichedProgramBook[] = response.body.items;
        for (const programBook of foundProgramBooks) {
          assert.exists(programBook.id);
          assert.exists(programBook.annualProgramId);
          test.fields.forEach(field => {
            assert.exists(programBook[field], `${field} not found`);
          });
          assert.lengthOf(Object.keys(programBook), test.fields.length + 2);
        }
      });
    });

    it(`Positive - Should return program books with status eq ${ProgramBookStatus.new}`, async () => {
      userMocker.mock(userMocks.pilot);
      annualProgramProgramming = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      const programBook = await createAndSaveProgramBook({
        annualProgram: annualProgramProgramming,
        status: ProgramBookStatus.new
      });
      const response = await programBooksTestClient.search('');
      assert.isTrue(response.body.items.some(item => item.id === programBook.id));
    });
  });
});
