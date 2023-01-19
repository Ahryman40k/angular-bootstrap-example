import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AnnualProgramStatus,
  AssetType,
  IEnrichedObjective,
  IPlainObjective,
  ITaxonomy,
  ITaxonomyAssetType,
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType,
  ProgramBookStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { chunk, cloneDeep, filter, flatten, omit, uniq } from 'lodash';
import * as mongoose from 'mongoose';
import sinon = require('sinon');
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { AnnualProgram } from '../../../src/features/annualPrograms/models/annualProgram';
import { AnnualProgramModel } from '../../../src/features/annualPrograms/mongo/annualProgramModel';
import { createAndSaveAnnualProgram } from '../../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { db } from '../../../src/features/database/DB';
import { PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES } from '../../../src/features/priorityScenarios/validators/priorityScenarioValidator';
import { objectiveMapperDTO } from '../../../src/features/programBooks/mappers/objectiveMapperDTO';
import { Objective } from '../../../src/features/programBooks/models/objective';
import { IPlainObjectiveProps } from '../../../src/features/programBooks/models/plainObjective';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../../src/features/programBooks/models/programBookFindOptions';
import { ProgramBookModel } from '../../../src/features/programBooks/mongo/programBookModel';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import { getObjective, getPlainObjectiveProps } from '../../../src/features/programBooks/tests/objectiveTestHelper';
import {
  createAndSaveDefaultProgramBook,
  createAndSaveProgramBook,
  programbookRestrictionsTestData
} from '../../../src/features/programBooks/tests/programBookTestHelper';
import { ICreateProgramBookObjectiveCommandProps } from '../../../src/features/programBooks/useCases/createProgramBookObjective/createProgramBookObjectiveCommand';
import { createProgramBookObjectiveUseCase } from '../../../src/features/programBooks/useCases/createProgramBookObjective/createProgramBookObjectiveUseCase';
import { IDeleteProgramBookObjectiveCommandProps } from '../../../src/features/programBooks/useCases/deleteProgramBookObjective/deleteProgramBookObjectiveCommand';
import { deleteProgramBookObjectiveUseCase } from '../../../src/features/programBooks/useCases/deleteProgramBookObjective/deleteProgramBookObjectiveUseCase';
import { IUpdateProgramBookObjectiveCommandProps } from '../../../src/features/programBooks/useCases/updateProgramBookObjective/updateProgramBookObjectiveCommand';
import { updateProgramBookObjectiveUseCase } from '../../../src/features/programBooks/useCases/updateProgramBookObjective/updateProgramBookObjectiveUseCase';
import { OBJECTIVES_ALLOWED_PROGRAM_BOOK_STATUSES } from '../../../src/features/programBooks/validators/objectiveValidator';
import { TaxonomyFindOptions } from '../../../src/features/taxonomies/models/taxonomyFindOptions';
import { taxonomyRepository } from '../../../src/features/taxonomies/mongo/taxonomyRepository';
import { assertUseCaseRestrictions } from '../../../src/shared/restrictions/tests/restrictionsValidatorTestHelper';
import {
  WORK_TYPE_ABANDON,
  WORK_TYPE_CANOPE,
  WORK_TYPE_CONSTRUCTION,
  WORK_TYPE_RECONSTRUCTION,
  WORK_TYPE_REHABILITATION
} from '../../../src/shared/taxonomies/constants';
import { appUtils } from '../../../src/utils/utils';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { removeEmpty } from '../../utils/testHelper';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe('Program Book Objectives', () => {
  const programBooksUrl = appUtils.createPublicFullPath(constants.locationPaths.PROGRAM_BOOK, EndpointTypes.API);
  let annualProgramModel: AnnualProgramModel;
  let programBookModel: ProgramBookModel;
  let taxonomies: ITaxonomy[];

  before(async () => {
    taxonomies = await taxonomyRepository.findAll(TaxonomyFindOptions.create({ criterias: {} }).getValue());
    programBookModel = db().models.ProgramBook;
    annualProgramModel = db().models.AnnualProgram;
  });

  after(async () => {
    await integrationAfter();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function postProgramBookObjective(programBook: ProgramBook, objective: IPlainObjective): Promise<request.Response> {
    return requestService.post(`${programBooksUrl}/${programBook.id}/objectives`, {
      body: objective
    });
  }

  function putProgramBookObjective(
    programBook: ProgramBook,
    objective: IPlainObjective,
    objectiveId: string
  ): Promise<request.Response> {
    return requestService.put(`${programBooksUrl}/${programBook.id}/objectives/${objectiveId}`, {
      body: objective
    });
  }

  async function findProgramBookObjectivesKey(programBookId: string): Promise<Objective[]> {
    const programBookFindOptions = ProgramBookFindOptions.create({
      criterias: {
        id: programBookId,
        objectivePin: true
      }
    }).getValue();
    const programBooks = await programBookRepository.findAll(programBookFindOptions);
    return programBooks[0]?.objectives?.filter(o => o.pin) || [];
  }

  function assertPositiveObjective(enrichedObjectiveResponse: IEnrichedObjective, plainObjective: IPlainObjective) {
    assert.strictEqual(enrichedObjectiveResponse.name, plainObjective.name);
    assert.strictEqual(enrichedObjectiveResponse.targetType, plainObjective.targetType);
    assert.strictEqual(enrichedObjectiveResponse.objectiveType, plainObjective.objectiveType);
    assert.strictEqual(enrichedObjectiveResponse.values.reference, plainObjective.referenceValue);
    assert.strictEqual(enrichedObjectiveResponse.requestorId, plainObjective.requestorId || undefined);
    assert.deepStrictEqual(enrichedObjectiveResponse.assetTypeIds, plainObjective.assetTypeIds || undefined);
    assert.deepStrictEqual(enrichedObjectiveResponse.workTypeIds, plainObjective.workTypeIds || undefined);
    assert.exists(enrichedObjectiveResponse.audit);
  }

  function getUnrelatedAssetTypes(workTypeId: string): string[] {
    const assetTypeTaxonomies = taxonomies.filter(x => x.group === TaxonomyGroup.assetType) as ITaxonomyAssetType[];
    return assetTypeTaxonomies.filter(x => !x.properties?.workTypes?.includes(workTypeId)).map(x => x.code);
  }

  function getUnrelatedWorkTypes(assetTypeId: string): string[] {
    const assetTypeTaxonomies = taxonomies.filter(x => x.group === TaxonomyGroup.assetType) as ITaxonomyAssetType[];
    const assetTypeWorkTypes = assetTypeTaxonomies.find(x => x.code === assetTypeId).properties.workTypes || [];
    const workTypeIds = uniq(flatten(assetTypeTaxonomies.map(x => x.properties.workTypes)));
    return workTypeIds?.filter(x => !assetTypeWorkTypes?.includes(x)) || [];
  }

  function doUnrelatedPostRequest(
    workTypeId: string,
    assetTypeId: string,
    mockObjectiveParam: IPlainObjective,
    programBook: ProgramBook
  ): Promise<request.Response> {
    const cloneObjective = cloneDeep(mockObjectiveParam);
    cloneObjective.assetTypeIds = [assetTypeId];
    cloneObjective.workTypeIds = [workTypeId];
    return postProgramBookObjective(programBook, cloneObjective);
  }

  function doUnrelatedPutRequest(
    workTypeId: string,
    assetTypeId: string,
    mockObjectiveParam: IPlainObjective,
    programBook: ProgramBook
  ): Promise<request.Response> {
    const cloneObjective = cloneDeep(mockObjectiveParam);
    cloneObjective.assetTypeIds = [assetTypeId];
    cloneObjective.workTypeIds = [workTypeId];
    return putProgramBookObjective(programBook, cloneObjective, programBook.objectives[0].id);
  }

  describe('programBooks/:programBookId/objectives > POST', () => {
    let annualProgram: AnnualProgram;
    let programBook: ProgramBook;
    let mockObjectiveProps: IPlainObjectiveProps;
    let mockObjectiveCustomProps: IPlainObjectiveProps;
    let spyObjectiveCalculateValue: sinon.SinonSpy;

    async function setupProgramBookObjectivesKey(programBk: ProgramBook): Promise<ProgramBook> {
      const objectives = [getObjective({ pin: true }), getObjective({ pin: true }), getObjective({ pin: true })];
      await Promise.all(objectives.map(obj => programBk.addOrReplaceObjective(obj)));
      const savedResult = await programBookRepository.save(programBk);
      return savedResult.getValue();
    }

    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.new });
      programBook = await createAndSaveProgramBook({
        annualProgram,
        status: ProgramBookStatus.programming
      });
      mockObjectiveCustomProps = getPlainObjectiveProps({
        targetType: ProgramBookObjectiveTargetType.budget,
        objectiveType: ProgramBookObjectiveType.threshold,
        requestorId: 'dtac'
      });
      mockObjectiveProps = getPlainObjectiveProps();
      programBook = await setupProgramBookObjectivesKey(programBook);
      spyObjectiveCalculateValue = sandbox.spy(Objective.prototype, 'calculateValue');
    });
    afterEach(async () => {
      userMocker.reset();
      await programBookModel.remove({}).exec();
      await annualProgramModel.remove({}).exec();
    });

    it('C59947 - Positive - Should be able to create an objective as a pilot user', async () => {
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertPositiveObjective(response.body, mockObjectiveCustomProps);
      assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
    });

    it('C59966 - Positive - Should be able to create an objective as a pilot user', async () => {
      mockObjectiveCustomProps.targetType = ProgramBookObjectiveTargetType.length;
      mockObjectiveCustomProps.workTypeIds = [WORK_TYPE_CONSTRUCTION, WORK_TYPE_ABANDON];
      mockObjectiveCustomProps.assetTypeIds = [AssetType.fireHydrant, AssetType.trafficLight];
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assertPositiveObjective(response.body, mockObjectiveCustomProps);
      assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
    });

    [
      {
        description: 'work types',
        assetTypeIds: [AssetType.bikePath, AssetType.roadway],
        workTypeIds: [WORK_TYPE_CONSTRUCTION, WORK_TYPE_REHABILITATION, WORK_TYPE_RECONSTRUCTION]
      },
      {
        description: 'asset types',
        assetTypeIds: [AssetType.bikePath, AssetType.roadway, AssetType['roadway-intersection']],
        workTypeIds: [WORK_TYPE_CONSTRUCTION, WORK_TYPE_RECONSTRUCTION]
      }
    ].forEach(test => {
      it(`Positive - Should create a custom objective with more than two ${test.description}`, async () => {
        mockObjectiveCustomProps.assetTypeIds = test.assetTypeIds;
        mockObjectiveCustomProps.workTypeIds = test.workTypeIds;
        const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assertPositiveObjective(response.body, mockObjectiveCustomProps);
        assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
      });
    });

    PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES.forEach(status => {
      it(`Positive - Should be able to create an objective with program book status ${status}`, async () => {
        const currentProgramBook = await createAndSaveProgramBook({ annualProgram, status });
        assert.strictEqual(currentProgramBook.status, status);
        const response = await postProgramBookObjective(currentProgramBook, mockObjectiveCustomProps);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
      });
    });

    [
      {
        description: 'Positive - Should outdate priority scenarios when creating an objective of type threshold',
        input: {
          objectiveType: ProgramBookObjectiveType.threshold
        },
        expected: {
          isOutdated: true
        }
      },
      {
        description:
          'Negative - Should not outdate priority scenarios when creating an objective of type performance indicator',
        input: {
          objectiveType: ProgramBookObjectiveType.performanceIndicator
        },
        expected: {
          isOutdated: false
        }
      }
    ].forEach(test => {
      it(test.description, async () => {
        mockObjectiveCustomProps.targetType = ProgramBookObjectiveTargetType.length;
        mockObjectiveCustomProps.workTypeIds = [WORK_TYPE_CONSTRUCTION, WORK_TYPE_ABANDON];
        mockObjectiveCustomProps.assetTypeIds = [AssetType.fireHydrant, AssetType.trafficLight];
        mockObjectiveCustomProps.objectiveType = test.input.objectiveType;
        const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        const updatedProgramBook = await programBookRepository.findById(programBook.id);
        assert.strictEqual(updatedProgramBook.priorityScenarios[0].isOutdated, test.expected.isOutdated);
        assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
      });
    });

    it('C60057 - Negative - Should not be able to create an objective twice', async () => {
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const response2 = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response2.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C59950 - Negative - Should not be able to create a custom objective with requestors', async () => {
      (mockObjectiveCustomProps as any).requestorId = [mockObjectiveCustomProps.requestorId, 'dtac'];
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59953 - Negative - Should not be able to create a custom objective with empty reference value', async () => {
      delete mockObjectiveCustomProps.referenceValue;
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59954 - Negative - Should not be able to create an objective without objective target type', async () => {
      delete mockObjectiveCustomProps.targetType;
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Negative - Should not be able to create an objective without objective type', async () => {
      delete mockObjectiveCustomProps.objectiveType;
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59955 - Negative - Should not be able to create a target bid number objective with empty value', async () => {
      delete mockObjectiveProps.referenceValue;
      const response = await postProgramBookObjective(programBook, mockObjectiveProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59956 - Negative - Should not be able to create a target bid number objective with negative value', async () => {
      mockObjectiveProps.referenceValue = -1;
      const response = await postProgramBookObjective(programBook, mockObjectiveProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59957 - Negative - Should not be able to create a target bid number objective with value zero', async () => {
      mockObjectiveProps.referenceValue = 0;
      const response = await postProgramBookObjective(programBook, mockObjectiveProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59960 - Negative - Should not be able to save an objective with unrelated asset type with work type', async () => {
      const workTypeIds = chunk(
        taxonomies.filter(taxo => taxo.group === TaxonomyGroup.workType).map(x => x.code),
        10
      );
      for (const workTypeId of workTypeIds[0]) {
        const unrelatedAssetTypeIds = getUnrelatedAssetTypes(workTypeId);

        let i = 0;
        for (const assetTypeId of filter(unrelatedAssetTypeIds)) {
          const response = await doUnrelatedPostRequest(workTypeId, assetTypeId, mockObjectiveCustomProps, programBook);
          assert.strictEqual(
            response.status,
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
            `The work type ${workTypeId} can't be use with the asset type ${assetTypeId}`
          );
          i++;
          if (i === 2) break;
        }
      }
    });

    it('C60672 - Negative - Should not be able to save more than three objective pin with value true', async () => {
      mockObjectiveCustomProps.pin = true;
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      const objectives = await findProgramBookObjectivesKey(programBook.id);
      assert.strictEqual(objectives.length, 3);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C59961 - Negative - Should not be able to save an objective with unrelated work type with asset type', async () => {
      const assetTypeIds = chunk(
        taxonomies.filter(taxo => taxo.group === TaxonomyGroup.assetType).map(x => x.code),
        10
      );
      for (const assetTypeId of assetTypeIds[0]) {
        const unrelatedWorkTypeIds = getUnrelatedWorkTypes(assetTypeId);

        let i = 0;
        for (const workTypeId of unrelatedWorkTypeIds) {
          const response = await doUnrelatedPostRequest(workTypeId, assetTypeId, mockObjectiveCustomProps, programBook);
          assert.strictEqual(
            response.status,
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
            `The asset type ${assetTypeId} can't be use with the work type ${workTypeId}`
          );
          i++;
          if (i === 2) break;
        }
      }
    });

    it('C59967 - Negative - Should not be able to save an objective with unrelated assets types with works types', async () => {
      mockObjectiveCustomProps.targetType = ProgramBookObjectiveTargetType.length;
      mockObjectiveCustomProps.workTypeIds = [WORK_TYPE_CONSTRUCTION, WORK_TYPE_CANOPE];
      mockObjectiveCustomProps.assetTypeIds = [AssetType.fireHydrant, AssetType.trafficLight];
      const response = await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C59962 - Negative - Should not be able to create a custom objective with wrong requestor', async () => {
      mockObjectiveProps.requestorId = 'wrong';
      const response = await postProgramBookObjective(programBook, mockObjectiveProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59963 - Negative - Should not be able to create a custom objective with wrong asset type', async () => {
      mockObjectiveProps.assetTypeIds = ['wrong'];
      const response = await postProgramBookObjective(programBook, mockObjectiveProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59964 - Negative - Should not be able to create a custom objective with wrong work type', async () => {
      mockObjectiveProps.workTypeIds = ['wrong'];
      const response = await postProgramBookObjective(programBook, mockObjectiveProps);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C60968 - Positive - Should call the objective calculation after the post', async () => {
      await postProgramBookObjective(programBook, mockObjectiveCustomProps);
      assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
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
        const props: ICreateProgramBookObjectiveCommandProps = {
          programBookId: currentProgramBook.id,
          ...mockObjectiveCustomProps
        };
        await assertUseCaseRestrictions<ICreateProgramBookObjectiveCommandProps, IEnrichedObjective>(
          test,
          createProgramBookObjectiveUseCase,
          props
        );
      });
    });
  });

  describe('programBooks/:programBookId/objectives > GET', () => {
    /**
     * Gets all objectives for a specific programBook
     * @param programBookId
     * @returns objectives for a specific programBook
     */
    function getProgramBookObjectives(programBookId: string): Promise<request.Response> {
      return requestService.get(`${programBooksUrl}/${programBookId}/objectives`, {});
    }

    let mockEnrichedAnnualProgram: AnnualProgram;
    let mockEnrichedProgramBook: ProgramBook;
    let mockEnrichedObjectives: Objective[];

    beforeEach(async () => {
      mockEnrichedObjectives = [getObjective()];
      userMocker.mock(userMocks.pilot);
      mockEnrichedAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      mockEnrichedProgramBook = await createAndSaveProgramBook({
        annualProgram: mockEnrichedAnnualProgram,
        status: ProgramBookStatus.programming,
        objectives: mockEnrichedObjectives
      });
      // mockEnrichedObjectives[0].id = mockEnrichedProgramBook.objectives[0].id;
    });

    afterEach(async () => {
      userMocker.reset();
      await programBookModel.remove({}).exec();
      await annualProgramModel.remove({}).exec();
    });

    it(`C59937 - Positive - Should get objectives for a specific program book`, async () => {
      const response = await getProgramBookObjectives(mockEnrichedProgramBook.id);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isArray(response.body);
      const enrichedObjective = removeEmpty(await objectiveMapperDTO.getFromModel(mockEnrichedObjectives[0]));
      assert.deepEqual(response.body[0], enrichedObjective);
    });

    it(`C59938 - Negative - Should not get objectives for a non-existent program book`, async () => {
      const response = await getProgramBookObjectives(`${mongoose.Types.ObjectId()}`);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it(`C59939 - Negative - Should not get objectives with invalid program book id`, async () => {
      const response = await getProgramBookObjectives('bad-request');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('programBooks/:programBookId/objectives/:id > PUT', () => {
    async function setupProgramBookObjectives(programBk: ProgramBook): Promise<ProgramBook> {
      [
        getObjective(),
        getObjective({ pin: true }),
        getObjective({ pin: true }),
        getObjective({ pin: true })
      ].forEach(ob => programBk.addOrReplaceObjective(ob));
      return (await programBookRepository.save(programBk)).getValue();
    }

    let annualProgram: AnnualProgram;
    let programBook: ProgramBook;
    let mockObjective: IPlainObjectiveProps;
    let mockObjectiveCustom: IPlainObjectiveProps;
    let spyObjectiveCalculateValue: sinon.SinonSpy;
    beforeEach(async () => {
      userMocker.mock(userMocks.pilot);
      annualProgram = await createAndSaveAnnualProgram({ status: AnnualProgramStatus.new });
      programBook = await createAndSaveProgramBook({
        annualProgram,
        status: ProgramBookStatus.programming
      });
      mockObjectiveCustom = getPlainObjectiveProps({
        targetType: ProgramBookObjectiveTargetType.budget,
        requestorId: 'dtac'
      });
      mockObjective = getPlainObjectiveProps();
      programBook = await setupProgramBookObjectives(programBook);
      spyObjectiveCalculateValue = sandbox.spy(Objective.prototype, 'calculateValue');
    });
    afterEach(async () => {
      userMocker.reset();
      await programBookModel.remove({}).exec();
      await annualProgramModel.remove({}).exec();
    });

    it('C59973 - Positive - Should be able to update an objective as a pilot user', async () => {
      const objectiveId = programBook.objectives.find(o => !o.pin).id;
      const plainUpdate = getPlainObjectiveProps({
        targetType: ProgramBookObjectiveTargetType.budget,
        requestorId: 'dtac'
      });
      const response = await putProgramBookObjective(programBook, plainUpdate, objectiveId);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const programBookReturned = await programBookRepository.findById(programBook.id);
      const objective = programBookReturned.objectives.find(obj => obj.id === objectiveId);
      const expectedObjective = getObjective(plainUpdate, objectiveId);
      assert.deepStrictEqual(
        removeEmpty(omit(await objectiveMapperDTO.getFromModel(objective), 'audit')),
        removeEmpty(omit(await objectiveMapperDTO.getFromModel(expectedObjective), 'audit'))
      );
      assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
    });

    [
      {
        description: 'work types',
        assetTypeIds: [AssetType.bikePath, AssetType.roadway],
        workTypeIds: [WORK_TYPE_CONSTRUCTION, WORK_TYPE_REHABILITATION, WORK_TYPE_RECONSTRUCTION]
      },
      {
        description: 'asset types',
        assetTypeIds: [AssetType.bikePath, AssetType.roadway, AssetType['roadway-intersection']],
        workTypeIds: [WORK_TYPE_CONSTRUCTION, WORK_TYPE_RECONSTRUCTION]
      }
    ].forEach(test => {
      it(`Positive - Should not be able to update a custom objective with more than two ${test.description}`, async () => {
        mockObjectiveCustom.assetTypeIds = test.assetTypeIds;
        mockObjectiveCustom.workTypeIds = test.workTypeIds;
        const response = await putProgramBookObjective(programBook, mockObjectiveCustom, programBook.objectives[0].id);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const programBookReturned = await programBookRepository.findById(programBook.id);
        const objective = programBookReturned.objectives.find(obj => obj.id === programBook.objectives[0].id);
        const expectedObjective = getObjective(mockObjectiveCustom, programBook.objectives[0].id);
        assert.deepStrictEqual(
          removeEmpty(omit(await objectiveMapperDTO.getFromModel(objective), 'audit')),
          removeEmpty(omit(await objectiveMapperDTO.getFromModel(expectedObjective), 'audit'))
        );
        assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
      });
    });

    [
      {
        description: 'Positive - Should outdate priority scenarios when updating an objective of type threshold',
        input: {
          objectiveType: ProgramBookObjectiveType.threshold
        },
        expected: {
          isOutdated: true
        }
      },
      {
        description:
          'Negative - Should not outdate priority scenarios when updating an objective of type performance indicator',
        input: {
          objectiveType: ProgramBookObjectiveType.performanceIndicator
        },
        expected: {
          isOutdated: false
        }
      }
    ].forEach(test => {
      it(test.description, async () => {
        const objectiveId = programBook.objectives.find(o => !o.pin).id;
        const plainUpdate = getPlainObjectiveProps({
          targetType: ProgramBookObjectiveTargetType.budget,
          objectiveType: test.input.objectiveType,
          requestorId: 'dtac'
        });
        const response = await putProgramBookObjective(programBook, plainUpdate, objectiveId);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const programBookReturned = await programBookRepository.findById(programBook.id);
        assert.strictEqual(programBookReturned.priorityScenarios[0].isOutdated, test.expected.isOutdated);
        assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
      });
    });

    OBJECTIVES_ALLOWED_PROGRAM_BOOK_STATUSES.forEach(status => {
      it(`Positive - Should be able to update an objective with program book status ${status}`, async () => {
        const pb = await createAndSaveProgramBook({
          annualProgram,
          status,
          objectives: [getObjective(mockObjectiveCustom)]
        });
        assert.strictEqual(pb.status, status);
        assert.isNotEmpty(pb.objectives);

        const objectiveId = pb.objectives[0].id;
        const response = await putProgramBookObjective(pb, mockObjectiveCustom, objectiveId);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.isTrue(spyObjectiveCalculateValue.calledOnce, `calculateValue should be called once`);
      });
    });

    it('C59975 - Negative - Should not be able to create a custom objective with requestors', async () => {
      (mockObjectiveCustom as any).requestorId = [mockObjectiveCustom.requestorId, 'dtac'];
      const response = await putProgramBookObjective(programBook, mockObjectiveCustom, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59978 - Negative - Should not be able to create a custom objective with empty reference value', async () => {
      delete mockObjectiveCustom.referenceValue;
      const response = await putProgramBookObjective(programBook, mockObjectiveCustom, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59979 - Negative - Should not be able to create an objective without objective target type', async () => {
      delete mockObjectiveCustom.targetType;
      const response = await putProgramBookObjective(programBook, mockObjectiveCustom, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('Negative - Should not be able to create an objective without objective type', async () => {
      delete mockObjectiveCustom.objectiveType;
      const response = await putProgramBookObjective(programBook, mockObjectiveCustom, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59980 - Negative - Should not be able to create a target bid number objective with empty value', async () => {
      delete mockObjective.referenceValue;
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59981 - Negative - Should not be able to create a target bid number objective with negative value', async () => {
      mockObjective.referenceValue = -1;
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59982 - Negative - Should not be able to create a target bid number objective with value zero', async () => {
      mockObjective.referenceValue = 0;
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59985 - Negative - Should not be able to save an objective with unrelated asset type with work type', async () => {
      const workTypeIds = chunk(
        taxonomies.filter(taxo => taxo.group === TaxonomyGroup.workType).map(x => x.code),
        10
      );

      for (const workTypeId of workTypeIds[0]) {
        const unrelatedAssetTypeIds = getUnrelatedAssetTypes(workTypeId);

        let i = 0;
        for (const assetTypeId of unrelatedAssetTypeIds) {
          const response = await doUnrelatedPutRequest(workTypeId, assetTypeId, mockObjectiveCustom, programBook);
          assert.strictEqual(
            response.status,
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
            `The work type ${workTypeId} can't be use with the asset type ${assetTypeId}`
          );
          i++;
          if (i === 2) break;
        }
      }
    });

    it('C60671 - Negative - Should not be able to save more than three objective pin with value true', async () => {
      mockObjective.pin = true;
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      const objectives = await findProgramBookObjectivesKey(programBook.id);
      assert.strictEqual(objectives.length, 3);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C59986 - Negative - Should not be able to save an objective with unrelated work type with asset type', async () => {
      const assetTypeIds = chunk(
        taxonomies.filter(taxo => taxo.group === TaxonomyGroup.assetType).map(x => x.code),
        10
      );
      for (const assetTypeId of assetTypeIds[0]) {
        const unrelatedWorkTypeIds = getUnrelatedWorkTypes(assetTypeId);

        let i = 0;
        for (const workTypeId of unrelatedWorkTypeIds) {
          const response = await doUnrelatedPutRequest(workTypeId, assetTypeId, mockObjectiveCustom, programBook);
          assert.strictEqual(
            response.status,
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
            `The asset type ${assetTypeId} can't be use with the work type ${workTypeId}`
          );
          i++;
          if (i === 2) break;
        }
      }
    });

    it('C59988 - Negative - Should not be able to create a custom objective with wrong requestor', async () => {
      mockObjective.requestorId = 'wrong';
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59989 - Negative - Should not be able to create a custom objective with wrong asset type', async () => {
      mockObjective.assetTypeIds = ['wrong'];
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59990 - Negative - Should not be able to create a custom objective with wrong work type', async () => {
      mockObjective.workTypeIds = ['wrong'];
      const response = await putProgramBookObjective(programBook, mockObjective, programBook.objectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const currentProgramBook = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
          {
            boroughIds: test.props.boroughIds,
            objectives: [getObjective()],
            status: ProgramBookStatus.programming
          }
        );

        const props: IUpdateProgramBookObjectiveCommandProps = {
          programBookId: currentProgramBook.id,
          objectiveId: currentProgramBook.objectives.find(x => x).id,
          ...mockObjective
        };
        await assertUseCaseRestrictions<IUpdateProgramBookObjectiveCommandProps, IEnrichedObjective>(
          test,
          updateProgramBookObjectiveUseCase,
          props
        );
      });
    });
  });

  describe('programBooks/:programBookId/objectives/:id > DELETE', () => {
    /**
     * Delete one objective in a specific programBook
     * @param programBookId
     * @returns objectives for a specific programBook
     */
    function deleteProgramBookObjective(programBookId: string, objectiveId: string): Promise<request.Response> {
      return requestService.delete(`${programBooksUrl}/${programBookId}/objectives/${objectiveId}`, {});
    }

    let mockEnrichedAnnualProgram: AnnualProgram;
    let mockEnrichedProgramBook: ProgramBook;
    let mockEnrichedObjectives: Objective[];

    beforeEach(async () => {
      mockEnrichedObjectives = [getObjective()];
      userMocker.mock(userMocks.pilot);
      mockEnrichedAnnualProgram = await createAndSaveAnnualProgram({
        status: AnnualProgramStatus.new
      });
      mockEnrichedProgramBook = await createAndSaveProgramBook({
        annualProgram: mockEnrichedAnnualProgram,
        status: ProgramBookStatus.programming,
        objectives: mockEnrichedObjectives
      });
    });

    afterEach(async () => {
      userMocker.reset();
      await programBookModel.remove({}).exec();
      await annualProgramModel.remove({}).exec();
    });

    it('C59940 - Positive - Should delete an existing objective', async () => {
      const response = await deleteProgramBookObjective(mockEnrichedProgramBook.id, mockEnrichedObjectives[0].id);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const persistedProgramBooks: ProgramBook[] = await programBookRepository.findAll(
        ProgramBookFindOptions.create({
          criterias: {}
        }).getValue()
      );
      assert.strictEqual(persistedProgramBooks[0].objectives.length, mockEnrichedObjectives.length - 1);
    });

    it('C59941 - Negative - Should not delete a non existing objective', async () => {
      const response = await deleteProgramBookObjective(mockEnrichedProgramBook.id, 'bidon');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
    programbookRestrictionsTestData.forEach(test => {
      it(test.scenario, async () => {
        const currentProgramBook = await createAndSaveDefaultProgramBook(
          { executorId: test.props.executorId, status: AnnualProgramStatus.programming },
          {
            boroughIds: test.props.boroughIds,
            objectives: [getObjective()],
            status: ProgramBookStatus.programming
          }
        );

        const props: IDeleteProgramBookObjectiveCommandProps = {
          programBookId: currentProgramBook.id,
          objectiveId: currentProgramBook.objectives.find(x => x).id
        };
        await assertUseCaseRestrictions<IDeleteProgramBookObjectiveCommandProps, void>(
          test,
          deleteProgramBookObjectiveUseCase,
          props
        );
      });
    });
  });
});
