import { IFeature, IImportProjectRequest } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import sinon = require('sinon');

import { getRoadSections, getWorkAreaFeature } from '../../src/features/asset/tests/assetTestHelper';
import { RequirementFindOptions } from '../../src/features/requirements/models/requirementFindOptions';
import { requirementRepository } from '../../src/features/requirements/mongo/requirementRepository';
import { assetService } from '../../src/services/assetService';
import { projectWorkAreaService } from '../../src/services/projectWorkAreaService';
import { REQUIREMENT_TYPE_OTHER_REQUIREMENTS } from '../../src/shared/taxonomies/constants';
import { getBicProjectFeature } from '../data/importData';
import { userMocks } from '../data/userMocks';
import { importTestUtils } from '../utils/import/importTestUtils';
import { spatialAnalysisServiceStub } from '../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';
import { integrationAfter } from './_init.test';

const sandbox = sinon.createSandbox();

// tslint:disable-next-line: max-func-body-length
describe('Import controller (requirements)', () => {
  before(() => {
    userMocker.mock(userMocks.pilot);
    const mockRoadSections = getRoadSections();
    const mockWorkAreas = getWorkAreaFeature();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
    sinon.stub(projectWorkAreaService, 'generateWorkArea').returns(Promise.resolve(mockWorkAreas as any));
  });

  after(async () => {
    await integrationAfter();
    sinon.restore();
    userMocker.reset();
  });

  function assertRequirement(requirement: any, text: string) {
    assert.strictEqual(requirement.text, text);
    assert.strictEqual(requirement.subtypeId, REQUIREMENT_TYPE_OTHER_REQUIREMENTS);
    assert.exists(requirement.audit);
  }

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
  });

  // tslint:disable-next-line: max-func-body-length
  describe('/import/projects (requirement) > POST', () => {
    let feature: IFeature;

    beforeEach(() => {
      feature = getBicProjectFeature();
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it('C60774 - Positive - Should save a project requirement from the PROJET_EXIGENCE column', async () => {
      const bicProjectRequirement = importTestUtils.mockBicProject();
      const requirementPart1 = 'Lorem';
      const requirementPart2 = 'Ipsum';

      /* tslint:disable-next-line */
      bicProjectRequirement.PROJET_EXIGENCE = 'Lorem || Ipsum';

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectRequirement], features: [feature] };
      const responseCreate = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(responseCreate.status, HttpStatusCodes.CREATED);
      const requirements = await requirementRepository.findAll(
        RequirementFindOptions.create({ criterias: { itemId: responseCreate.body.id, itemType: 'project' } }).getValue()
      );
      assertRequirement(requirements[1], requirementPart1);
      assertRequirement(requirements[0], requirementPart2);
    });

    it('C60775 - Negative - Should not save a project requirement from an empty PROJET_EXIGENCE column', async () => {
      const bicProjectRequirement = importTestUtils.mockBicProject();
      bicProjectRequirement.PROJET_EXIGENCE = ``;

      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProjectRequirement], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.isTrue(_.isEmpty(response.body.requirements));
    });

    it('C60776 - Negative - Should not save a repeated project requirements', async () => {
      const bicProjectRequirement = importTestUtils.mockBicProject();
      bicProjectRequirement.PROJET_EXIGENCE = ``;

      /* tslint:disable-next-line */
      bicProjectRequirement.PROJET_EXIGENCE = 'Lorem || Ipsum';

      const importProjectRequest: IImportProjectRequest = {
        bicProjects: [bicProjectRequirement, bicProjectRequirement],
        features: [feature]
      };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);

      const requirements = await requirementRepository.findAll(
        RequirementFindOptions.create({ criterias: { itemId: response.body.id, itemType: 'project' } }).getValue()
      );
      assert.lengthOf(requirements, 2);
    });
  });
});
