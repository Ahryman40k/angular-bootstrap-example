import {
  AnnualProgramStatus,
  IEnrichedProject,
  ProgramBookStatus,
  ProjectExternalReferenceType,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as moment from 'moment';
import * as sinon from 'sinon';

import { isNil } from 'lodash';
import { programBooksData } from '../../../../../../tests/data/programBooksData';
import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { AlreadyExistsError } from '../../../../../shared/domainErrors/alreadyExistsError';
import { ErrorCode } from '../../../../../shared/domainErrors/errorCode';
import { Result } from '../../../../../shared/logic/result';
import { IInfoRtuProject } from '../../../../../shared/rtuImport/infoRtuProject';
import { infoRtuService } from '../../../../../shared/rtuImport/infoRtuService';
import { IRtuContactResponse } from '../../../../../shared/rtuImport/IRtuContactResponse';
import { IRtuSessionResponse } from '../../../../../shared/rtuImport/rtuSessionResponse';
import { appUtils } from '../../../../../utils/utils';
import { getAuditDTO } from '../../../../audit/test/auditTestHelper';
import { ImportFlag } from '../../../../imports/enums/importFlag';
import { ProgramBook } from '../../../../programBooks/models/programBook';
import { createAndSaveDefaultProgramBook } from '../../../../programBooks/tests/programBookTestHelper';
import { ProjectFindOptions } from '../../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../../projects/mongo/projectRepository';
import { RtuExportTarget } from '../../../models/rtuExportError';
import { RtuExportStatus } from '../../../models/rtuExportLog';
import { RtuExportLogFindOptions } from '../../../models/rtuExportLogFindOptions';
import { RtuProjectExportStatus } from '../../../models/rtuProjectExport/rtuProjectExport';
import { rtuExportLogRepository } from '../../../mongo/rtuExportLogRepository';
import { rtuExportUseCase } from '../../../useCases/rtuExport/rtuExportUseCase';
import {
  assertFailedAgirProjectExport,
  assertRtuExport,
  assertSucccessAgirProjectExport,
  getRtuExportError,
  getRtuExportLog,
  getRtuProjectExportSummary
} from '../../rtuExportTestHelper';

const sandbox = sinon.createSandbox();

const RTU_EXPORT_TEST_DELAY = 500;

// tslint:disable:max-func-body-length
describe(`rtuExportUseCase`, () => {
  function stubOpenInfoRtuSession(response: Result<IRtuSessionResponse>) {
    sandbox.stub(infoRtuService, 'openInfoRtuSession').resolves(response);
  }
  function stubGetContactById(response: Result<IRtuContactResponse>) {
    sandbox.stub(infoRtuService, 'getContactById').resolves(response);
  }
  function stubCreateRtuProject(response: Result<IInfoRtuProject>) {
    sandbox.stub(infoRtuService, 'createRtuProject').resolves(response);
  }
  function stubUpdateRtuProject(response: Result<IInfoRtuProject>) {
    sandbox.stub(infoRtuService, 'updateRtuProject').resolves(response);
  }
  function stubOkSaveRtuProject() {
    stubOkRtuImportSession();
    stubOkGetContactById();
    stubCreateRtuProject(
      Result.ok({
        id: 'PXXX'
      })
    );
    stubUpdateRtuProject(
      Result.ok({
        id: 'PXXX'
      })
    );
  }
  function stubOkRtuImportSession() {
    stubOpenInfoRtuSession(
      Result.ok({
        status: 'OK',
        result: {
          sessionId: 123456
        }
      })
    );
  }
  function stubOkGetContactById() {
    stubGetContactById(
      Result.ok({
        status: 'OK',
        result: {
          id: '0901060',
          officeId: '0901',
          num: '060',
          phone: '1234567890',
          cell: null,
          phoneExtensionNumber: null,
          fax: null,
          email: 'name.name@montreal.ca',
          prefix: 'M.',
          name: 'Name Name',
          title: 'Agent technique en ingenierie municipale',
          typeNotfc: null,
          paget: null,
          profile: 'FFFFFFFOO',
          globalRole: 'PI',
          idInterim: null,
          inAutoNotification: null,
          inDiffusion: 'O',
          areaName: null,
          role: null,
          partnerType: null,
          partnerId: null
        }
      })
    );
  }
  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
  });

  describe(`Negative other export in progress`, () => {
    it(`should return alreadyExistsError when there is another export in progress`, async () => {
      // add in progress export
      await rtuExportLogRepository.save(getRtuExportLog());
      const result = await rtuExportUseCase.execute();
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, AlreadyExistsError, 'should be AlreadyExistsError');
    });
  });

  describe(`Negative invalid projects`, () => {
    it(`should have status failure in export log when a project failed to export`, () => {
      // add in succesfull log with one failed project
      const rtuProjectExportSummary = getRtuProjectExportSummary({ status: RtuProjectExportStatus.FAILURE });
      const createExportProject = getRtuExportLog({
        status: RtuExportStatus.SUCCESSFUL,
        projects: [rtuProjectExportSummary]
      });
      assert.strictEqual(createExportProject.status, RtuExportStatus.FAILURE);
    });

    it(`should export have status failure when mapping some project fail`, async () => {
      stubOkSaveRtuProject();
      const programBook = await createAndSaveDefaultProgramBook();
      const correctProject = await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.finalOrdered
      });
      const incorrectProject = await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.finalOrdered,
        boroughId: 'ZZZ'
      });

      const result = await rtuExportUseCase.execute();
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      assert.isTrue(result.isRight());
      const rtuExportLogFindOptions = RtuExportLogFindOptions.create({ criterias: {} }).getValue();
      const listImport = await rtuExportLogRepository.findAll(rtuExportLogFindOptions);
      assert.equal(listImport.length, 1);
      const savedExport = listImport[0];
      // tslint:disable-next-line: no-console
      assert.strictEqual(savedExport.status, RtuExportStatus.FAILURE);
      assert.deepEqual(
        savedExport.errorDetail.props,
        getRtuExportError({ code: ErrorCode.INVALID, target: RtuExportTarget.PROJECTS, values: { value1: 1 } }).props
      );
      assert.isNotEmpty(savedExport.projects);
      assert.equal(savedExport.projects.length, 2);
      // VALIDATE INFO RTU STATUS IN AGIR PROJECTS
      const afeterExportProjects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            id: [correctProject.id, incorrectProject.id]
          }
        }).getValue()
      );
      assertFailedAgirProjectExport(afeterExportProjects[0]);
      assertSucccessAgirProjectExport(afeterExportProjects[1]);
    });
  });

  describe(`Positive export rtu projects`, () => {
    let programBook: ProgramBook;
    const exportableProjectStatuses = [ProjectStatus.preliminaryOrdered, ProjectStatus.finalOrdered];
    afterEach(async () => {
      await destroyDBTests();
      sandbox.restore();
    });
    beforeEach(async () => {
      programBook = await createAndSaveDefaultProgramBook();
    });
    it(`should finish successful RtuExportLog when no export log in progress and no exported projects failed`, async () => {
      stubOkSaveRtuProject();
      const result = await rtuExportUseCase.execute();
      assert.isTrue(result.isRight());
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      const savedExport = await assertRtuExport();
      assert.isEmpty(savedExport.projects);
    });

    it(`should export projects when it is the fist time export execution`, async () => {
      stubOkSaveRtuProject();
      // projects don't have exportRtu property
      // projects must be preliminaryOrdered or finalOrdered
      const [correctProject1, correctProject2] = await Promise.all(
        exportableProjectStatuses.map(status =>
          programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
            status
          })
        )
      );

      const result = await rtuExportUseCase.execute();
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      assert.isTrue(result.isRight());
      const savedExport = await assertRtuExport();
      assert.isNotEmpty(savedExport.projects);
      assert.equal(savedExport.projects.length, 2);
      // VALIDATE INFO RTU STATUS IN AGIR PROJECTS
      const afterExportProjects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            id: [correctProject1.id, correctProject2.id]
          }
        }).getValue()
      );
      for (const p of afterExportProjects) {
        assertSucccessAgirProjectExport(p);
      }
    });

    it(`should export only projects with adequate status`, async () => {
      stubOkSaveRtuProject();
      const validStatus = exportableProjectStatuses.find(s => s);
      const invalidStatus = ProjectStatus.planned;
      const [correctProject, incorrectProject] = await Promise.all(
        [validStatus, invalidStatus].map(status =>
          programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
            status
          })
        )
      );
      const result = await rtuExportUseCase.execute();
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      assert.isTrue(result.isRight());
      const savedExport = await assertRtuExport();
      assert.isNotEmpty(savedExport.projects);
      // only one project must be inserted
      assert.equal(savedExport.projects.length, 1);
      // VALIDATE INFO RTU STATUS IN AGIR PROJECTS
      const afterExportProjects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            id: [correctProject.id, incorrectProject.id]
          }
        }).getValue()
      );
      const exportedProject = afterExportProjects.find(p => !isNil(p.rtuExport));
      const notExportedProject = afterExportProjects.find(p => isNil(p.rtuExport));
      assertSucccessAgirProjectExport(exportedProject);
      assert.exists(notExportedProject);
    });

    it(`should export projects that only have a geometry`, async () => {
      stubOkSaveRtuProject();
      // this project have a geometry
      const correctProject1 = await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.finalOrdered
      });
      // this project doesn't have a geometry
      await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.postponed,
        geometry: null
      });

      const result = await rtuExportUseCase.execute();
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      assert.isTrue(result.isRight());
      const savedExport = await assertRtuExport();
      assert.isNotEmpty(savedExport.projects);
      assert.equal(savedExport.projects.length, 1);
      // VALIDATE INFO RTU STATUS IN AGIR PROJECTS
      const afterExportProjects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            id: [correctProject1.id]
          }
        }).getValue()
      );
      assertSucccessAgirProjectExport(afterExportProjects[0]);
    });

    it(`should exclude Projects coming from BIC import`, async () => {
      stubOkSaveRtuProject();
      const projectOptions: IEnrichedProject[] = [
        // 1
        {
          importFlag: ImportFlag.internal,
          externalReferenceIds: []
        },
        // 2
        {
          importFlag: ImportFlag.external,
          externalReferenceIds: [
            {
              type: ProjectExternalReferenceType.infoRTUReferenceNumber,
              value: ''
            },
            {
              type: ProjectExternalReferenceType.ptiNumber,
              value: ''
            }
          ]
        },
        // 3
        {
          importFlag: ImportFlag.internal,
          externalReferenceIds: [
            {
              type: ProjectExternalReferenceType.infoRTUReferenceNumber,
              value: ''
            },
            {
              type: ProjectExternalReferenceType.ptiNumber,
              value: ''
            },
            {
              type: ProjectExternalReferenceType.infoRtuId,
              value: ''
            }
          ]
        },
        // 4
        {
          importFlag: ImportFlag.external,
          externalReferenceIds: [
            {
              type: ProjectExternalReferenceType.ptiNumber,
              value: ''
            },
            {
              type: ProjectExternalReferenceType.infoRtuId,
              value: ''
            }
          ]
        },
        // 5
        {
          importFlag: null,
          externalReferenceIds: []
        }
      ];
      const expectedCount = 2;

      for (const pr of projectOptions) {
        await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
          status: ProjectStatus.finalOrdered,
          ...pr
        });
      }
      // should export
      const result = await rtuExportUseCase.execute();
      await appUtils.delay(RTU_EXPORT_TEST_DELAY + 250);
      assert.isTrue(result.isRight());
      const savedExport = await assertRtuExport();
      assert.equal(savedExport.projects.length, expectedCount);
      // should exclude projects
      const projectFindOptions = ProjectFindOptions.create({
        criterias: {
          excludeImportBic: true
        },
        offset: 0,
        limit: 10
      }).getValue();
      const projects = await projectRepository.findPaginated(projectFindOptions);
      assert.equal(projects.paging.totalCount, expectedCount);
      assert.isTrue(
        projects.items.every(pr => {
          return (
            pr.importFlag !== ImportFlag.internal &&
            (pr.externalReferenceIds || []).every(el => el.type !== ProjectExternalReferenceType.infoRTUReferenceNumber)
          );
        })
      );
    });

    it(`should export projects that are modified after been exported`, async () => {
      stubOkSaveRtuProject();
      // this project have a geometry
      // this project must no be exported
      await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.programmed,
        audit: await getAuditDTO({
          lastModifiedAt: '2020-06-10T15:52:54.089Z'
        }),
        rtuExport: {
          status: 'successful',
          exportAt: new Date().toISOString()
        }
      });
      // this project must be exported
      const correctProject1 = await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.postponed,
        externalReferenceIds: [
          {
            type: ProjectExternalReferenceType.infoRtuId,
            value: 'xxx'
          }
        ],
        audit: await getAuditDTO({
          lastModifiedAt: moment()
            .add(1, 'days')
            .toISOString()
        }),
        rtuExport: {
          status: 'successful',
          exportAt: moment()
            .add(-1, 'days')
            .toDate()
            .toISOString()
        }
      });

      const result = await rtuExportUseCase.execute();
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      assert.isTrue(result.isRight());
      const savedExport = await assertRtuExport();
      assert.isNotEmpty(savedExport.projects);
      assert.equal(savedExport.projects.length, 1);
      // VALIDATE INFO RTU STATUS IN AGIR PROJECTS
      const afeterExportProjects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            id: [correctProject1.id]
          }
        }).getValue()
      );
      assertSucccessAgirProjectExport(afeterExportProjects[0]);
    });

    it(`should cancel project that has been exported and is not longer in a program book`, async () => {
      stubOkSaveRtuProject();
      // this project have a geometry
      programBook = await createAndSaveDefaultProgramBook(
        { status: AnnualProgramStatus.new },
        { status: ProgramBookStatus.submittedFinal }
      );
      // this project must no be cancel
      await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.programmed,
        audit: await getAuditDTO({
          lastModifiedAt: '2020-06-10T15:52:54.089Z'
        }),
        rtuExport: {
          status: 'successful',
          exportAt: new Date().toISOString()
        }
      });
      // this project must be exported
      const correctProject1 = await programBooksData.createMockProjectWithInterventionInProgramBook(programBook, {
        status: ProjectStatus.postponed,
        externalReferenceIds: [
          {
            type: ProjectExternalReferenceType.infoRtuId,
            value: 'xxx'
          }
        ],
        audit: await getAuditDTO({
          lastModifiedAt: moment()
            .add(1, 'days')
            .toISOString()
        }),
        rtuExport: {
          status: 'successful',
          exportAt: moment()
            .add(-1, 'days')
            .toDate()
            .toISOString()
        }
      });

      const result = await rtuExportUseCase.execute();
      // give it half a second due to fire and forget
      await appUtils.delay(RTU_EXPORT_TEST_DELAY);
      assert.isTrue(result.isRight());
      const savedExport = await assertRtuExport();
      assert.isNotEmpty(savedExport.projects);
      assert.equal(savedExport.projects.length, 1);
      // VALIDATE INFO RTU STATUS IN AGIR PROJECTS
      const afeterExportProjects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            id: [correctProject1.id]
          }
        }).getValue()
      );
      assertSucccessAgirProjectExport(afeterExportProjects[0]);
    });
  });
});
