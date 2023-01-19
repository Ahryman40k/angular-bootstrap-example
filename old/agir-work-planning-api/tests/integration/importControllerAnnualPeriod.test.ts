import {
  AnnualProgramStatus,
  IBicProject,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IFeature,
  IImportProjectRequest,
  ProgramBookStatus,
  ProjectStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import sinon = require('sinon');

import { AnnualProgram } from '../../src/features/annualPrograms/models/annualProgram';
import { createAndSaveAnnualProgram } from '../../src/features/annualPrograms/tests/annualProgramTestHelper';
import { getRoadSections, getWorkAreaFeature } from '../../src/features/asset/tests/assetTestHelper';
import { ProgramBook } from '../../src/features/programBooks/models/programBook';
import { createAndSaveProgramBook } from '../../src/features/programBooks/tests/programBookTestHelper';
import { assetService } from '../../src/services/assetService';
import { projectWorkAreaService } from '../../src/services/projectWorkAreaService';
import { appUtils } from '../../src/utils/utils';
import { getBicProjectFeature } from '../data/importData';
import { userMocks } from '../data/userMocks';
import { importTestUtils } from '../utils/import/importTestUtils';
import { spatialAnalysisServiceStub } from '../utils/stub/spatialAnalysisService.stub';
import { destroyDBTests } from '../utils/testHelper';
import { userMocker } from '../utils/userUtils';
import { integrationAfter } from './_init.test';

const sandbox = sinon.createSandbox();
// tslint:disable-next-line: max-func-body-length
describe('Import controller', () => {
  after(async () => {
    await integrationAfter();
  });

  before(() => {
    const mockRoadSections = getRoadSections();
    const mockWorkAreas = getWorkAreaFeature();
    sinon.stub(assetService, 'getRoadSections').returns(Promise.resolve(mockRoadSections));
    sinon.stub(projectWorkAreaService, 'generateWorkArea').returns(Promise.resolve(mockWorkAreas as any));
    userMocker.mock(userMocks.admin);
  });

  after(() => {
    sinon.restore();
    userMocker.reset();
  });

  async function createAnnualProgram(bicProject: IBicProject) {
    return createAndSaveAnnualProgram({
      status: AnnualProgramStatus.new,
      year: appUtils.parseInt(bicProject.ANNEE_DEBUT)
    });
  }

  async function createProgramBook(bicProject: IBicProject, annualProgram: AnnualProgram) {
    return await createAndSaveProgramBook({
      annualProgram,
      status: ProgramBookStatus.programming,
      projectTypes: [ProjectType.integrated, ProjectType.integratedgp],
      boroughIds: [bicProject.ARRONDISSEMENT_AGIR]
    });
  }

  beforeEach(() => {
    spatialAnalysisServiceStub.init(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
  });

  // tslint:disable-next-line: max-func-body-length
  describe('/import/projects (annual periods) > POST', () => {
    let bicProject: IBicProject;
    let feature: IFeature;
    let mockAnnualProgramDi: AnnualProgram;
    let mockProgramBookDi: ProgramBook;

    beforeEach(async () => {
      bicProject = importTestUtils.mockBicProject(ProjectStatus.programmed);
      bicProject.ANNEE_FIN = (+bicProject.ANNEE_FIN + 2).toString();
      const bicProject2 = _.cloneDeep(bicProject);
      bicProject2.ANNEE_FIN = (+bicProject2.ANNEE_FIN + 1).toString();
      feature = getBicProjectFeature();
      mockAnnualProgramDi = await createAnnualProgram(bicProject);
      mockProgramBookDi = await createProgramBook(bicProject, mockAnnualProgramDi);
      const mockAnnualProgramDi2 = await createAnnualProgram(bicProject);
      await createProgramBook(bicProject2, mockAnnualProgramDi2);
    });

    afterEach(async () => {
      await destroyDBTests();
    });

    it('C61189 - Positive - Should save annual period for each years between the start year and the end year', async () => {
      bicProject.ANNEE_FIN = (+bicProject.ANNEE_FIN + 1).toString();
      const yearRange = _.range(+bicProject.ANNEE_DEBUT, +bicProject.ANNEE_FIN + 1);
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const annualPeriods = (response.body as IEnrichedProject).annualDistribution.annualPeriods;
      assert.isFalse(_.isEmpty(annualPeriods));
      assert.lengthOf(annualPeriods, yearRange.length);
      assert.isTrue(annualPeriods.some(annualPeriod => annualPeriod.status === bicProject.STATUT_PROJET));
      assert.strictEqual(annualPeriods[0].programBookId, mockProgramBookDi.id);
      assert.isNotOk(annualPeriods[1].programBookId);
      assert.isTrue(annualPeriods[1].status !== ProjectStatus.programmed);
      yearRange.forEach(year => {
        assert.lengthOf(
          annualPeriods.filter(annualPeriod => annualPeriod.year === year),
          1
        );
      });
    });

    // TODO: Remove skip when annual period budget calculations will be done.
    it.skip('C61456 - Positive - Should save bugdet in each annual period for each years between the start year and the end year', async () => {
      const yearRange = _.range(+bicProject.ANNEE_DEBUT, +bicProject.ANNEE_FIN + 1);
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      bicProject.BUDGET_ANNEE_1 = 300000;
      bicProject.BUDGET_ANNEE_2 = 319000;
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const annualPeriods: IEnrichedProjectAnnualPeriod[] = (response.body as IEnrichedProject).annualDistribution
        .annualPeriods;
      assert.isFalse(_.isEmpty(annualPeriods));
      assert.lengthOf(annualPeriods, yearRange.length);

      annualPeriods.forEach((annualPeriod, index) => {
        let budget = 0;
        if (index < 2) {
          budget = Math.floor(+bicProject[`BUDGET_ANNEE_${index + 1}`] / 1000);
        }
        assert.strictEqual(annualPeriod.additionalCostsTotalBudget, budget);
      });
    });

    it('C61455 - Negative - Should not save project if the first annual period is not programmed but the second is', async () => {
      bicProject.ANNEE_DEBUT = (+bicProject.ANNEE_DEBUT - 1).toString();
      const importProjectRequest: IImportProjectRequest = { bicProjects: [bicProject], features: [feature] };
      const response = await importTestUtils.postBicProject(importProjectRequest);
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
});
