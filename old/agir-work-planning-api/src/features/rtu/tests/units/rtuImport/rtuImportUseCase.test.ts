import { Feature, feature, Polygon } from '@turf/turf';
import { ErrorCodes, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as sinon from 'sinon';

import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { spatialAnalysisService } from '../../../../../services/spatialAnalysisService';
import { workAreaService } from '../../../../../services/workAreaService';
import { ErrorCode } from '../../../../../shared/domainErrors/errorCode';
import { ForbiddenError } from '../../../../../shared/domainErrors/forbiddenError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { Result } from '../../../../../shared/logic/result';
import { infoRtuService } from '../../../../../shared/rtuImport/infoRtuService';
import { IRtuFilterResponse } from '../../../../../shared/rtuImport/rtuFilterResponse';
import { IRtuProjetsResponse } from '../../../../../shared/rtuImport/rtuProjetsResponse';
import { IRtuSessionResponse } from '../../../../../shared/rtuImport/rtuSessionResponse';
import { appUtils } from '../../../../../utils/utils';
import { taxonomyService } from '../../../../taxonomies/taxonomyService';
import { RtuImportTarget } from '../../../models/rtuImportError';
import { RtuImportStatus } from '../../../models/rtuImportLog';
import { RtuImportLogFindOptions } from '../../../models/rtuImportLogFindOptions';
import { RtuProjectFindOptions } from '../../../models/rtuProjectFindOptions';
import { rtuImportLogRepository } from '../../../mongo/rtuImportLogRepository';
import { rtuProjectRepository } from '../../../mongo/rtuProjectRepository';
import { rtuImportUseCase } from '../../../useCases/rtuImport/rtuImportUseCase';
import {
  assertRtuProject,
  assertRtuProjectError,
  boroughFeatures,
  geometrieProject,
  getInfoRtuProject,
  getRtuImportError,
  getRtuProjectError,
  getTaxonomy
} from '../../rtuProjectTestHelper';

const sandbox = sinon.createSandbox();

const RTU_IMPORT_TEST_DELAY = 500;

// tslint:disable:max-func-body-length
describe(`rtuImportUseCase`, () => {
  function stubOpenRtuImportSession(response: Result<IRtuSessionResponse>) {
    sandbox.stub(infoRtuService, 'openInfoRtuSession').resolves(response);
  }
  function stubSetFilterRtuImport(response: Result<IRtuFilterResponse>) {
    sandbox.stub(infoRtuService, 'setFilterRtuImport').resolves(response);
  }
  function stubGetRtuImportProjects(response: Result<IRtuProjetsResponse>) {
    sandbox.stub(infoRtuService, 'getRtuImportProjects').resolves(response);
  }
  function stubGetPolygonsFromGeometries(response: Feature<Polygon>) {
    sandbox.stub(workAreaService, 'getPolygonFromGeometries').resolves(response);
  }
  function stubTaxonomyService(group: TaxonomyGroup, response: ITaxonomy[]) {
    sandbox
      .stub(taxonomyService, 'getGroup')
      .callThrough()
      .withArgs(group)
      .resolves(response);
  }
  function stubOkRtuImportSession() {
    stubOpenRtuImportSession(
      Result.ok({
        status: 'OK',
        result: {
          sessionId: 123456
        }
      })
    );
    stubSetFilterRtuImport(
      Result.ok({
        status: 'OK'
      })
    );
    stubGetPolygonsFromGeometries(feature(geometrieProject) as Feature<Polygon>);
    stubTaxonomyService(TaxonomyGroup.infoRtuPartner, [getTaxonomy()]);
  }

  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
  });

  describe(`Negative invalid session start`, () => {
    it(`should return forbiddenError when auth infos are bad`, async () => {
      stubOpenRtuImportSession(Result.fail(new ForbiddenError({})));
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, ForbiddenError, 'should be ForbiddenError');
    });
    it(`should return UnexpectedError when response from server was not ok`, async () => {
      stubOpenRtuImportSession(Result.fail(new UnexpectedError({})));
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnexpectedError, 'should be UnexpectedError');
    });
    it(`should return UnexpectedError when server response was ok but in the result body status is not ok`, async () => {
      stubOpenRtuImportSession(
        Result.ok({
          status: 'NOT_OK',
          result: {
            sessionId: 123456
          }
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, UnexpectedError, 'should be UnexpectedError');
    });
  });

  describe(`Negative invalid projects`, () => {
    it(`should finish in error when not projects are gotten by rtu service`, async () => {
      stubOkRtuImportSession();
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: []
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_IMPORT_TEST_DELAY);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      // validate we have only one log in BD
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.EMPTY_LIST, target: RtuImportTarget.PROJECTS }).props
      );
      assert.isEmpty(savedImport.failedProjects);
    });

    it(`should error log finish in error because mandatory fields not present`, async () => {
      stubOkRtuImportSession();
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: [getInfoRtuProject({ name: '', noReference: null, contact: null })]
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(500);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      // validate we have only one log in BD
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.INVALID, target: RtuImportTarget.PROJECTS, values: { value1: 1 } }).props
      );
      assert.isNotEmpty(savedImport.failedProjects);
      const expectedRtuProjectError = getRtuProjectError({ projectName: '', projectNoReference: null });
      expectedRtuProjectError.errorDetails.push(
        getRtuImportError({ code: ErrorCodes.InvalidInput, target: 'name', values: { value1: '' } })
      );
      expectedRtuProjectError.errorDetails.push(getRtuImportError({ target: 'noReference', values: { value1: null } }));
      expectedRtuProjectError.errorDetails.push(getRtuImportError({ target: RtuImportTarget.CONTACT }));
      assertRtuProjectError(savedImport.failedProjects[0], expectedRtuProjectError);
    });

    it(`should error log finish in error because mandatory contact fields not present`, async () => {
      stubOkRtuImportSession();
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: [getInfoRtuProject({ contact: { name: '', email: null } })]
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_IMPORT_TEST_DELAY);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      // validate we have only one log in BD
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.INVALID, target: RtuImportTarget.PROJECTS, values: { value1: 1 } }).props
      );
      assert.isNotEmpty(savedImport.failedProjects);
      const expectedRtuProjectError = getRtuProjectError();
      expectedRtuProjectError.errorDetails.push(
        getRtuImportError({ code: ErrorCodes.InvalidInput, target: 'name', values: { value1: '' } })
      );
      expectedRtuProjectError.errorDetails.push(getRtuImportError({ target: 'email', values: { value1: null } }));
      assertRtuProjectError(savedImport.failedProjects[0], expectedRtuProjectError);
    });

    it(`should error log finish in error because geometrie has a bad format`, async () => {
      stubOpenRtuImportSession(
        Result.ok({
          status: 'OK',
          result: {
            sessionId: 123456
          }
        })
      );
      stubSetFilterRtuImport(
        Result.ok({
          status: 'OK'
        })
      );
      sandbox.stub(workAreaService, 'getPolygonFromGeometries').throws(new Error('wfs bad geometrie'));
      stubTaxonomyService(TaxonomyGroup.infoRtuPartner, [getTaxonomy()]);
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: [getInfoRtuProject()]
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));

      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_IMPORT_TEST_DELAY);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      // validate we have only one log in BD
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.INVALID, target: RtuImportTarget.PROJECTS, values: { value1: 1 } }).props
      );
      assert.isNotEmpty(savedImport.failedProjects);
      const expectedRtuProjectError = getRtuProjectError();
      expectedRtuProjectError.errorDetails.push(
        getRtuImportError({ code: ErrorCodes.InvalidInput, target: RtuImportTarget.PLACES })
      );
      assertRtuProjectError(savedImport.failedProjects[0], expectedRtuProjectError);
    });

    it(`should error log finish in error because of taxonomy validations`, async () => {
      stubOkRtuImportSession();
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: [getInfoRtuProject({ status: { name: 'TDD' } })]
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_IMPORT_TEST_DELAY);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      // validate we have only one log in BD
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.INVALID, target: RtuImportTarget.PROJECTS, values: { value1: 1 } }).props
      );
      assert.isNotEmpty(savedImport.failedProjects);
      const expectedRtuProjectError = getRtuProjectError();
      expectedRtuProjectError.errorDetails.push(
        getRtuImportError({ code: ErrorCodes.Taxonomy, target: 'status', values: { value1: 'TDD' } })
      );
      assertRtuProjectError(savedImport.failedProjects[0], expectedRtuProjectError);
    });

    it(`should finish in error RtuImportLog when error in delete all`, async () => {
      stubOkRtuImportSession();
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: [getInfoRtuProject()]
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));

      sandbox.stub(rtuProjectRepository, 'delete').resolves(Result.fail('error deleting'));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_IMPORT_TEST_DELAY);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.DELETE, target: RtuImportTarget.DATABASE }).props
      );
      assert.isEmpty(savedImport.failedProjects);
    });

    it(`should finish in error RtuImportLog when unexpected error in save bulk`, async () => {
      stubOkRtuImportSession();
      stubGetRtuImportProjects(
        Result.ok({
          status: 'OK',
          result: [getInfoRtuProject()]
        })
      );
      sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));

      sandbox.stub(rtuProjectRepository, 'saveBulk').resolves(Result.fail('error saveBulk'));
      const result = await rtuImportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_IMPORT_TEST_DELAY);
      const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
      assert.equal(listImport.length, 1);
      const savedImport = listImport[0];
      assert.strictEqual(savedImport.status, RtuImportStatus.FAILURE);
      assert.deepEqual(
        savedImport.errorDetail.props,
        getRtuImportError({ code: ErrorCode.INSERT_MANY, target: RtuImportTarget.DATABASE }).props
      );
      assert.isEmpty(savedImport.failedProjects);
    });
  });

  it(`should finish successful RtuImportLog when all projects are ok`, async () => {
    stubOkRtuImportSession();
    stubGetRtuImportProjects(
      Result.ok({
        status: 'OK',
        result: [getInfoRtuProject()]
      })
    );
    sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.ok(boroughFeatures));

    const result = await rtuImportUseCase.execute();
    assert.isTrue(result.isRight());
    // give it half a second due to fire and forget
    await appUtils.delay(RTU_IMPORT_TEST_DELAY);
    const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
    const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
    assert.equal(listImport.length, 1);
    const savedImport = listImport[0];
    assert.strictEqual(savedImport.status, RtuImportStatus.SUCCESSFUL);
    assert.strictEqual(savedImport.errorDetail, undefined);
    assert.isEmpty(savedImport.failedProjects);
    // validate rtu projects in BD
    const rtuProjectFindOptions = RtuProjectFindOptions.create({ criterias: {} }).getValue();
    const listRtuProjects = await rtuProjectRepository.findAll(rtuProjectFindOptions);
    assert.isNotEmpty(listRtuProjects);
    const expectedRtuProject = await infoRtuService.mapInfoRtuProjectToRtuProject(getInfoRtuProject(), []);
    assertRtuProject(listRtuProjects[0], expectedRtuProject.getValue());
  });

  it(`should finish successful RtuImportLog when all projects are ok even when the wfs call has failed`, async () => {
    stubOkRtuImportSession();
    stubGetRtuImportProjects(
      Result.ok({
        status: 'OK',
        result: [getInfoRtuProject()]
      })
    );
    sandbox.stub(spatialAnalysisService, 'getFeaturesBylayerId').resolves(Result.fail('call wfs failed'));

    const result = await rtuImportUseCase.execute();
    assert.isTrue(result.isRight());
    // give it half a second due to fire and forget
    await appUtils.delay(RTU_IMPORT_TEST_DELAY);
    const rtuImportLogFindOptions = RtuImportLogFindOptions.create({ criterias: {} }).getValue();
    const listImport = await rtuImportLogRepository.findAll(rtuImportLogFindOptions);
    assert.equal(listImport.length, 1);
    const savedImport = listImport[0];
    assert.strictEqual(savedImport.status, RtuImportStatus.SUCCESSFUL);
    assert.strictEqual(savedImport.errorDetail, undefined);
    assert.isEmpty(savedImport.failedProjects);
    // validate rtu projects in BD
    const rtuProjectFindOptions = RtuProjectFindOptions.create({ criterias: {} }).getValue();
    const listRtuProjects = await rtuProjectRepository.findAll(rtuProjectFindOptions);
    assert.isNotEmpty(listRtuProjects);
    const expectedRtuProject = await infoRtuService.mapInfoRtuProjectToRtuProject(getInfoRtuProject(), []);
    assertRtuProject(listRtuProjects[0], expectedRtuProject.getValue());
  });
});

describe(`test mapInfoRtuProjectToRtuProject `, () => {
  const testCase = [
    {
      description: `should find the right areaId when there is no district`,
      payload: { district: '' },
      expected: 'SO',
      filteredBoroughsAndCities: boroughFeatures
    },
    {
      description: `should find the right areaId when there is district`,
      payload: { district: 'Ville-Marie' },
      expected: 'VM',
      filteredBoroughsAndCities: boroughFeatures
    }
  ];

  testCase.forEach(test => {
    it(`${test.description}`, async () => {
      await infoRtuService.getListAreaIds();
      const result = await infoRtuService.mapInfoRtuProjectToRtuProject(
        getInfoRtuProject(test.payload),
        test.filteredBoroughsAndCities
      );
      assert.equal(result.getValue().areaId, test.expected);
    });
  });

  it(`should not find the right areaId because the wfs call failed `, async () => {
    await infoRtuService.getListAreaIds();
    const result = await infoRtuService.mapInfoRtuProjectToRtuProject(getInfoRtuProject({ district: '' }), []);
    assert.equal(result.isFailure, true);
  });
});
