import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib';
import {
  AnnualProgramExpand,
  AnnualProgramStatus,
  IEnrichedAnnualProgram,
  IUuid,
  ProgramBookStatus,
  Role,
  ShareableRole,
  TaxonomyGroup,
  User
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../config/constants';
import { annualProgramStateMachine } from '../../src/features/annualPrograms/annualProgramStateMachine';
import { AnnualProgram } from '../../src/features/annualPrograms/models/annualProgram';
import { AnnualProgramFindOptions } from '../../src/features/annualPrograms/models/annualProgramFindOptions';
import { IPlainAnnualProgramProps } from '../../src/features/annualPrograms/models/plainAnnualProgram';
import { AnnualProgramModel } from '../../src/features/annualPrograms/mongo/annualProgramModel';
import { annualProgramRepository } from '../../src/features/annualPrograms/mongo/annualProgramRepository';
import {
  createAndSaveAnnualProgram,
  getAnnualProgram,
  getAnnualProgramProps,
  getAnnualProgramShareableRolesCombinations,
  getManyAnnualProgram,
  getPlainAnnualProgramProps
} from '../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../src/features/database/DB';
import { ProgramBook } from '../../src/features/programBooks/models/programBook';
import { programBookRepository } from '../../src/features/programBooks/mongo/programBookRepository';
import { createAndSaveProgramBook, getProgramBook } from '../../src/features/programBooks/tests/programBookTestHelper';
import { taxonomyService } from '../../src/features/taxonomies/taxonomyService';
import { errorMtlMapper } from '../../src/shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../src/shared/domainErrors/invalidParameterError';
import { Result } from '../../src/shared/logic/result';
import { EXECUTOR_DEEU } from '../../src/shared/taxonomies/constants';
import { enumValues } from '../../src/utils/enumUtils';
import { appUtils } from '../../src/utils/utils';
import { programBooksData } from '../data/programBooksData';
import { createMockProject } from '../data/projectData';
import { userMocks } from '../data/userMocks';
import { requestService } from '../utils/requestService';
import { destroyDBTests, getAllForbiddenTransitionsBetweenStatuses, getFutureYear } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';
import { integrationAfter } from './_init.test';

// tslint:disable:max-func-body-length
describe('Annual Program Controller', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.ANNUAL_PROGRAM, EndpointTypes.API);
  const mockAnnualProgram = getPlainAnnualProgramProps({
    status: AnnualProgramStatus.new
  });
  let annualProgramModel: AnnualProgramModel;

  before(() => {
    annualProgramModel = db().models.AnnualProgram;
  });

  after(async () => {
    await integrationAfter();
  });

  beforeEach(() => {
    userMocker.mock(userMocks.pilot);
  });

  afterEach(async () => {
    await annualProgramModel.deleteMany({}).exec();
    userMocker.reset();
  });

  async function getAnnualPrograms(query: object): Promise<request.Response> {
    return requestService.get(apiUrl, undefined, query);
  }

  describe('/annualPrograms > POST', () => {
    const plainAnnualProgramToCreate = getPlainAnnualProgramProps();

    it('C55252 - Positive - Should return 201 status on an annual programmation creation with pilot user', async () => {
      let response: any;
      response = await requestService.post(apiUrl, { body: plainAnnualProgramToCreate });
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
    });
    it('C55253 - Positive - Should save an annual programmation with pilot user and return programmation with new as status', async () => {
      let response: any;
      response = await requestService.post(apiUrl, { body: plainAnnualProgramToCreate });
      assert.strictEqual(response.body.status, AnnualProgramStatus.new);
    });
    it('C55254 - Negative - Should return 403 status when saving without pilot user', async () => {
      let response: any;
      userMocker.mock(userMocks.noAccess);
      response = await requestService.post(apiUrl, { body: plainAnnualProgramToCreate });
      assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
    });
    it('C55255 - Negative - Should return 422 status when saving more than one programmation with the same executive in the same year', async () => {
      let response: any;
      await requestService.post(apiUrl, { body: plainAnnualProgramToCreate });
      response = await requestService.post(apiUrl, { body: plainAnnualProgramToCreate });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
    it('C55256 - Negative - Should return 400 status if year is missing in request body', async () => {
      let response: any;
      const annualProgram = _.cloneDeep(plainAnnualProgramToCreate);
      delete annualProgram.year;
      response = await requestService.post(apiUrl, { body: annualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C55257 - Negative - Should return 400 status if executorId is missing in request body', async () => {
      let response: any;
      const annualProgram = _.cloneDeep(plainAnnualProgramToCreate);
      delete annualProgram.executorId;
      response = await requestService.post(apiUrl, { body: annualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it('C55258 - Negative - Should return 400 status if budgetCap is missing in request body', async () => {
      let response: any;
      const annualProgram = _.cloneDeep(plainAnnualProgramToCreate);
      delete annualProgram.budgetCap;
      response = await requestService.post(apiUrl, { body: annualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    it(`C55259 - Negative - Should return 422 status when year is lower than the current year less thirthteen`, async () => {
      let response: any;
      const annualProgram = _.cloneDeep(plainAnnualProgramToCreate);
      annualProgram.year = annualProgram.year - 13;
      response = await requestService.post(apiUrl, { body: annualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });
  describe('/annualPrograms > PUT', () => {
    let currentAnnualProgram: IEnrichedAnnualProgram;
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      const response = await requestService.post(apiUrl, { body: mockAnnualProgram });
      currentAnnualProgram = response.body;
    });
    afterEach(async () => {
      await annualProgramModel.remove({}).exec();
      userMocker.reset();
    });

    async function createNewMockStatus(
      fromStatus: AnnualProgramStatus,
      toStatus: AnnualProgramStatus
    ): Promise<{ id: IUuid; input: IPlainAnnualProgramProps }> {
      const saveWithFromStatus = getAnnualProgram({
        status: fromStatus
      });
      const savedFromStatus = (await annualProgramRepository.save(saveWithFromStatus)).getValue();
      return {
        id: savedFromStatus.id,
        input: getPlainAnnualProgramProps({
          status: toStatus,
          year: getFutureYear()
        })
      };
    }

    it('C55343 - Should have status 200 when updating whole object properties and return the modify object except status and id', async () => {
      let response: any;
      const input = {
        executorId: 'dep',
        year: mockAnnualProgram.year + 1,
        description: 'new description',
        budgetCap: mockAnnualProgram.budgetCap + 1000,
        status: mockAnnualProgram.status
      };
      response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    [...annualProgramStateMachine.transitions].forEach(transition => {
      it(`Should have status 200 when updating from status ${transition.from} to status ${transition.to}`, async () => {
        let response: any;
        const input = _.cloneDeep({
          ...mockAnnualProgram,
          status: transition.to
        });
        input.status = AnnualProgramStatus.new;
        response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: input });
        assert.strictEqual(response.status, HttpStatusCodes.OK);
      });
    });

    it('C55345- Should have status 400 when updating object with wrong executorId taxonomy', async () => {
      let response: any;
      const input = _.cloneDeep(mockAnnualProgram);
      input.executorId = 'derp';
      response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55346 - Should have status 400 when updating object without year', async () => {
      let response: any;
      const input = _.cloneDeep(mockAnnualProgram);
      input.year = null;
      response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55347 - Should have status 400 when updating object without budgetCap', async () => {
      let response: any;
      const input = _.cloneDeep(mockAnnualProgram);
      input.budgetCap = null;
      response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55348 - Should have status 404 when inexistant id', async () => {
      const id = mongoose.Types.ObjectId().toHexString();
      let response: any;
      response = await requestService.put(`${apiUrl}/${id}`, { body: mockAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C55349 - Should have status 400 when wrong id format', async () => {
      let response: any;
      response = await requestService.put(`${apiUrl}/badId`, { body: mockAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C55350 - Negative - Should have status 422 when updating with year which is lower than the present year less thirthteen', async () => {
      let response: any;
      const input = _.cloneDeep(mockAnnualProgram);
      input.year = input.year - 13;
      response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    [
      ...getAllForbiddenTransitionsBetweenStatuses(
        enumValues(AnnualProgramStatus),
        annualProgramStateMachine.transitions
      )
    ].forEach(invalidTransition => {
      it('Should have status 422 when updating with status which is impossible status to transit to', async () => {
        // Presave annual Program with from status
        const annualProgram = (
          await annualProgramRepository.save(
            AnnualProgram.create(
              getAnnualProgramProps({
                status: invalidTransition.from as AnnualProgramStatus
              })
            ).getValue()
          )
        ).getValue();

        let response: any;
        const input = _.cloneDeep({
          ...mockAnnualProgram,
          status: invalidTransition.to
        });
        response = await requestService.put(`${apiUrl}/${annualProgram.id}`, { body: input });
        assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      });
    });

    it('C55363 - Should have status 200 when updating from status programming to submittedFinal', async () => {
      let response: any;
      const sharedRoles = await taxonomyService.getTaxonomyValueString<Role>(
        TaxonomyGroup.shareableRole,
        ShareableRole.annualProgram
      );
      const { id, input } = await createNewMockStatus(
        AnnualProgramStatus.programming,
        AnnualProgramStatus.submittedFinal
      );
      input.sharedRoles = sharedRoles;
      response = await requestService.put(`${apiUrl}/${id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it('Should have status 200 when updating from status programming and submitting all shared roles', async () => {
      let response: any;
      const sharedRoles = await taxonomyService.getTaxonomyValueString<Role>(
        TaxonomyGroup.shareableRole,
        ShareableRole.annualProgram
      );
      const { id, input } = await createNewMockStatus(AnnualProgramStatus.programming, AnnualProgramStatus.programming);
      input.sharedRoles = sharedRoles;
      response = await requestService.put(`${apiUrl}/${id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.status, AnnualProgramStatus.submittedFinal);
    });

    it('Should have an error when updating from status programming to submittedFinal with no sharedRoles', async () => {
      let response: any;
      const { id, input } = await createNewMockStatus(
        AnnualProgramStatus.programming,
        AnnualProgramStatus.submittedFinal
      );
      response = await requestService.put(`${apiUrl}/${id}`, { body: input });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(response?.body.error.target[0].succeeded, false);
      assert.strictEqual(
        JSON.stringify(response?.body.error.target[0].target),
        '"The Annual Program should be shared to all of those roles: EXECUTOR,INTERNAL-GUEST-STANDARD,INTERNAL-GUEST-RESTRICTED"'
      );
    });

    it("C55394 - Positive - Should be able to update program book's year and executor if its empty project", async () => {
      const createdAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      await createMockProject({ startYear: createdAnnualProgram.year });

      const plain = getPlainAnnualProgramProps({
        executorId: EXECUTOR_DEEU,
        year: createdAnnualProgram.year + 1
      });
      const response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: plain });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
    });

    it('C55395 - Negative - Should not be able to update annualProgram year if it contains project(s)', async () => {
      const createdAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming
      });
      const mockProgramBook = await createAndSaveProgramBook({
        annualProgram: createdAnnualProgram
      });
      await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
        startYear: createdAnnualProgram.year
      });

      const plain = getPlainAnnualProgramProps({
        year: createdAnnualProgram.year + 1
      });
      const response = await requestService.put(`${apiUrl}/${createdAnnualProgram.id}`, { body: plain });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C55432 - Negative - Should not be able to update annualProgram executor if it contains project(s)', async () => {
      const createdAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      const mockProgramBook = await createAndSaveProgramBook({
        annualProgram: createdAnnualProgram
      });
      await programBooksData.createMockProjectInProgramBook(mockProgramBook, {
        startYear: createdAnnualProgram.year
      });
      const plain = getPlainAnnualProgramProps({
        executorId: EXECUTOR_DEEU
      });
      const response = await requestService.put(`${apiUrl}/${createdAnnualProgram.id}`, { body: plain });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it(`C57617 - Negative - Should not update a new program book shared roles when updating annual program shared roles`, async () => {
      const createdAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      const mockProgramBook = await createAndSaveProgramBook({
        annualProgram: createdAnnualProgram,
        status: ProgramBookStatus.new,
        sharedRoles: []
      });

      const plain = getPlainAnnualProgramProps({
        sharedRoles: [Role.INTERNAL_GUEST_STANDARD]
      });
      const response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: plain });

      const programBook = await programBookRepository.findById(mockProgramBook.id);
      assert.notEqual(response.body.sharedRoles, programBook.sharedRoles);
    });
  });

  describe('/annualPrograms > GET', () => {
    let annualProgramsCount: number;
    let annualPrograms: AnnualProgram[];

    beforeEach(async () => {
      annualPrograms = [
        ...getManyAnnualProgram(50),
        getAnnualProgram({
          status: AnnualProgramStatus.submittedFinal
        }),
        ...getAnnualProgramShareableRolesCombinations()
      ];
      annualProgramsCount = annualPrograms.length;
      const annualProgramResults = await Promise.all(annualPrograms.map(ap => annualProgramRepository.save(ap)));
      annualPrograms = annualProgramResults.map(saved => saved.getValue());
    });

    afterEach(async () => {
      await destroyDBTests();
      userMocker.reset();
    });

    async function assertSharedAnnualPrograms(annualProgramsInDB: AnnualProgram[], user: User): Promise<void> {
      const annualProgramFindOptions = AnnualProgramFindOptions.create({
        criterias: {
          sharedRoles: user.roles
        }
      });
      if (annualProgramFindOptions.isFailure) {
        throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(annualProgramFindOptions)));
      }
      const expectedAnnualPrograms = await annualProgramRepository.findAll(annualProgramFindOptions.getValue());
      const expectedAnnualProgramsIds = expectedAnnualPrograms.map(ap => ap.id).sort();
      const actualAnnualProgramsId = annualProgramsInDB.map(ap => ap.id).sort();
      assert.deepEqual(actualAnnualProgramsId, expectedAnnualProgramsIds);
    }

    it('C55325 - Positive - Should have status 200 and return a annual program array sorted from most recent to least recent', async () => {
      const response = await requestService.get(apiUrl, {});

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.strictEqual(response.body.items.length, annualProgramsCount);
    });

    it('C57118  Positive - Should only return annual programs shared with user', async () => {
      const shareableUsers = [userMocks.executor, userMocks.internalGuestStandard, userMocks.internalGuestRestricted];
      for (const user of shareableUsers) {
        userMocker.mock(user);
        const response = await requestService.get(apiUrl, {});

        const actualAnnualPrograms: AnnualProgram[] = response.body.items;
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isOk(actualAnnualPrograms.length);
        await assertSharedAnnualPrograms(actualAnnualPrograms, user);
      }
    });

    it('C57119  Positive - Should return minimal annual programs that program books are shared with user', async () => {
      const notSharedAnnualProgram = annualPrograms.find(x => !x.sharedRoles?.length);
      await programBookRepository.save(
        getProgramBook({
          annualProgram: notSharedAnnualProgram,
          sharedRoles: [Role.EXECUTOR]
        })
      );
      userMocker.mock(userMocks.executor);

      const response = await requestService.get(apiUrl, {});

      const annualProgramsResponse: IEnrichedAnnualProgram[] = response.body.items;
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const responseNotSharedAnnualProgram = annualProgramsResponse.find(ap => ap.id === notSharedAnnualProgram.id);
      assert.exists(responseNotSharedAnnualProgram);
      assert.deepEqual(responseNotSharedAnnualProgram, {
        id: notSharedAnnualProgram.id,
        executorId: notSharedAnnualProgram.executorId,
        year: notSharedAnnualProgram.year,
        status: notSharedAnnualProgram.status,
        limitedAccess: true,
        programBooks: []
      } as any);
    });

    it('C57765 - Positive - Should return annual program with program books', async () => {
      let response: any;
      userMocker.mock(userMocks.pilot);
      const annualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming
      });
      await createAndSaveProgramBook({ annualProgram });
      try {
        response = await requestService.get(apiUrl, undefined, `expand=${AnnualProgramExpand.programBooks}`);
      } finally {
        userMocker.reset();
      }

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const annualProgramsResponse: IEnrichedAnnualProgram[] = response.body.items;
      assert.isTrue(annualProgramsResponse.some(x => x.programBooks.length >= 1));
    });
  });

  describe('/annualPrograms?expand=programBooks', () => {
    let dbAnnualProgram: AnnualProgram;
    let dbProgramBook: ProgramBook;

    beforeEach(async () => {
      dbAnnualProgram = (
        await annualProgramRepository.save(getAnnualProgram({ sharedRoles: [Role.EXECUTOR, Role.REQUESTOR] }))
      ).getValue();
      dbProgramBook = (
        await programBookRepository.save(
          getProgramBook({
            status: ProgramBookStatus.programming,
            annualProgram: dbAnnualProgram,
            sharedRoles: [Role.EXECUTOR, Role.REQUESTOR]
          })
        )
      ).getValue();
    });

    afterEach(() => {
      userMocker.reset();
    });

    it('C58098  Positive - Should retrieve an annual program with its program books', async () => {
      const response = await getAnnualPrograms({ expand: AnnualProgramExpand.programBooks });
      const actualAnnualPrograms: IEnrichedAnnualProgram[] = response.body?.items;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(actualAnnualPrograms);
      assert.ok(actualAnnualPrograms.length);
      assert.strictEqual(actualAnnualPrograms[0].id, dbAnnualProgram.id);
      assert.ok(actualAnnualPrograms[0].programBooks);
      assert.strictEqual(actualAnnualPrograms[0].programBooks[0].id, dbProgramBook.id);
    });

    it('C58099  Positive - Should retrieve an annual program with its accessible program books only', async () => {
      await Promise.all(
        [
          getProgramBook({
            status: ProgramBookStatus.programming,
            annualProgram: dbAnnualProgram,
            sharedRoles: undefined
          }),
          getProgramBook({
            status: ProgramBookStatus.programming,
            annualProgram: dbAnnualProgram,
            sharedRoles: null
          }),
          getProgramBook({
            status: ProgramBookStatus.programming,
            annualProgram: dbAnnualProgram,
            sharedRoles: []
          }),
          getProgramBook({
            status: ProgramBookStatus.programming,
            annualProgram: dbAnnualProgram,
            sharedRoles: [Role.REQUESTOR]
          })
        ].map(pb => programBookRepository.save(pb))
      );

      userMocker.mock(userMocks.executor);

      const response = await getAnnualPrograms({ expand: AnnualProgramExpand.programBooks });
      const actualAnnualPrograms: IEnrichedAnnualProgram[] = response.body?.items;

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(actualAnnualPrograms);
      assert.ok(actualAnnualPrograms.length);
      const actualAnnualProgram = actualAnnualPrograms.find(p => p);
      assert.strictEqual(actualAnnualProgram.id, dbAnnualProgram.id);
      assert.ok(actualAnnualProgram.programBooks);
      assert.strictEqual(actualAnnualProgram.programBooks.length, 1);
      assert.strictEqual(actualAnnualProgram.programBooks[0].id, dbProgramBook.id);
    });

    [
      {
        description: `its program books with status new when user has permission PROGRAM_BOOK:READ:NEW`,
        userMockType: userMocks.pilot,
        expected: {
          hasProgramBooksNew: true
        }
      },
      {
        description: `NO program books with status NEW  when user has NO permission PROGRAM_BOOK:READ:NEW`,
        userMockType: userMocks.plannerSe,
        expected: {
          hasProgramBooksNew: false
        }
      }
    ].forEach(test => {
      it(`Positive - Should retrieve an annual program with ${test.description}`, async () => {
        await Promise.all(
          [
            getProgramBook({
              status: ProgramBookStatus.new,
              annualProgram: dbAnnualProgram,
              sharedRoles: [Role.REQUESTOR]
            })
          ].map(pb => programBookRepository.save(pb))
        );
        userMocker.mock(test.userMockType);
        const response = await getAnnualPrograms({ expand: AnnualProgramExpand.programBooks });
        const actualAnnualPrograms: IEnrichedAnnualProgram[] = response.body?.items;

        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.ok(actualAnnualPrograms);
        assert.ok(actualAnnualPrograms.length);
        assert.strictEqual(actualAnnualPrograms[0].id, dbAnnualProgram.id);
        const actualAnnualProgram = actualAnnualPrograms.find(p => p);
        assert.ok(actualAnnualProgram.programBooks);
        const programBooksNew = actualAnnualProgram.programBooks.filter(pb => pb.status === 'new');

        const condition = test.expected.hasProgramBooksNew ? programBooksNew.length > 0 : programBooksNew.length === 0;
        assert.isTrue(condition);
      });
    });
  });

  describe('/annualPrograms > PUT (Share)', () => {
    let currentAnnualProgram: AnnualProgram;
    beforeEach(async () => {
      currentAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.programming
      });
    });
    afterEach(async () => {
      await annualProgramModel.deleteMany({}).exec();
    });

    it('Positive - Should keep the past sharedRoles', async () => {
      const sharedRoles = [Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED];
      const annualProgramId = currentAnnualProgram.id;
      const plainAnnualProgram = getPlainAnnualProgramProps({
        status: currentAnnualProgram.status,
        sharedRoles
      });
      const response = await requestService.put(`${apiUrl}/${annualProgramId}`, { body: plainAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepStrictEqual(response.body.sharedRoles, currentAnnualProgram.sharedRoles);
    });

    it('C57108 - Positive - Should be able to share annualProgram with these roles : internal guest standard, internal guest restricted', async () => {
      const sharedRoles = await taxonomyService.getTaxonomyValueString<Role>(
        TaxonomyGroup.shareableRole,
        ShareableRole.annualProgram
      );
      const annualProgramId = currentAnnualProgram.id;
      const plainAnnualProgram = getPlainAnnualProgramProps({
        status: currentAnnualProgram.status,
        sharedRoles
      });
      const response = await requestService.put(`${apiUrl}/${annualProgramId}`, { body: plainAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.deepStrictEqual(response.body.sharedRoles, sharedRoles);
    });

    it('C57109 - Positive - Should save empty array when empty array is sent as shared roles', async () => {
      const annualProgramId = currentAnnualProgram.id;
      const plainAnnualProgram = getPlainAnnualProgramProps({
        status: currentAnnualProgram.status,
        sharedRoles: []
      });
      const response = await requestService.put(`${apiUrl}/${annualProgramId}`, { body: plainAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isEmpty(response.body.sharedRoles);
    });

    it('C57110 - Negative - Should not be able to share annualProgram with invalid role', async () => {
      const sharedRoles = ['INVALID' as Role];
      const annualProgramId = currentAnnualProgram.id;
      const plainAnnualProgram = getPlainAnnualProgramProps({
        status: currentAnnualProgram.status,
        sharedRoles
      });
      const response = await requestService.put(`${apiUrl}/${annualProgramId}`, { body: plainAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C57111 - Negative - Should not be able to create annualProgram with shared roles', async () => {
      const plainAnnualProgram = getPlainAnnualProgramProps({
        sharedRoles: [Role.INTERNAL_GUEST_STANDARD]
      });
      const response = await requestService.post(`${apiUrl}`, { body: plainAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C57115 - Negative - Should not be able to share annualProgram if its status is new', async () => {
      currentAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new,
        sharedRoles: [Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED]
      });
      const plainAnnualProgram = getPlainAnnualProgramProps({
        status: AnnualProgramStatus.new,
        sharedRoles: [Role.INTERNAL_GUEST_STANDARD, Role.INTERNAL_GUEST_RESTRICTED]
      });
      const response = await requestService.put(`${apiUrl}/${currentAnnualProgram.id}`, { body: plainAnnualProgram });
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  // Delete one annual program in new or opened state as pilot.
  describe('/annualPrograms/:id > DELETE', () => {
    /**
     * Delete one annualProgram
     * @param annualProgramId the id of one annual program
     */
    function deleteAnnualProgram(annualProgramId: string): Promise<request.Response> {
      return requestService.delete(`${apiUrl}/${annualProgramId}`, {});
    }

    let mockEnrichedAnnualPrograms: AnnualProgram[] = [];
    const allowedStatus = [AnnualProgramStatus.new];
    const forbiddenRoles = [
      userMocks.executor,
      userMocks.externalGuest,
      userMocks.internalGuestRestricted,
      userMocks.internalGuestStandard,
      userMocks.noAccess,
      userMocks.planner,
      userMocks.requestor
    ];

    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      const annualProgramNew = (
        await annualProgramRepository.save(
          getAnnualProgram(
            getAnnualProgramProps({
              status: AnnualProgramStatus.new
            })
          )
        )
      ).getValue();
      const annualProgramOpened = (
        await annualProgramRepository.save(
          getAnnualProgram(
            getAnnualProgramProps({
              status: AnnualProgramStatus.new
            })
          )
        )
      ).getValue();
      mockEnrichedAnnualPrograms.push(annualProgramNew);
      mockEnrichedAnnualPrograms.push(annualProgramOpened);
    });

    afterEach(async () => {
      await destroyDBTests();
      mockEnrichedAnnualPrograms = [];
      userMocker.reset();
    });

    it('C60660 - Positive - Should delete an existing annual program', async () => {
      for (const mockEnrichedAnnualProgram of mockEnrichedAnnualPrograms) {
        assert.include(allowedStatus, mockEnrichedAnnualProgram.status);
        const response = await deleteAnnualProgram(mockEnrichedAnnualProgram.id);
        assert.isNull(await annualProgramRepository.findById(mockEnrichedAnnualProgram.id));
        assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      }
    });

    it('C60661 - Negative - Should not delete an annual program with a wrong id', async () => {
      const response = await deleteAnnualProgram('wrong id');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C60662 - Negative - Should not delete an annual program with an inexistant id', async () => {
      const response = await deleteAnnualProgram(mongoose.Types.ObjectId().toHexString());
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C60663 - Negative - Should not delete an annual program with a forbidden user role', async () => {
      for (const role of forbiddenRoles) {
        userMocker.mock(role);
        const response = await deleteAnnualProgram(mockEnrichedAnnualPrograms[0].id);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });

    it('C60664 - Negative - Should not delete an annual program if it contains a program book', async () => {
      await createAndSaveProgramBook({
        annualProgram: mockEnrichedAnnualPrograms[0]
      });
      const response = await deleteAnnualProgram(mockEnrichedAnnualPrograms[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });
});
