import {
  BoroughCode,
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  INexoImportLog,
  InterventionExternalReferenceType,
  InterventionStatus,
  ModificationType,
  NexoFileType,
  NexoImportStatus,
  ProjectExpand,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { omit } from 'lodash';
import * as sinon from 'sinon';

import { getInitialProject } from '../../../../../tests/data/projectData';
import { getStorageGetResponse } from '../../../../../tests/utils/stub/storageApiService.stub';
import { assertFailures, destroyDBTests, INVALID_UUID, NOT_FOUND_UUID } from '../../../../../tests/utils/testHelper';
import { AlreadyExistsError } from '../../../../shared/domainErrors/alreadyExistsError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import {
  SHOULD_BE_UNPROCESSABLE_ERROR,
  UnprocessableEntityError
} from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { PROGRAM_TYPE_PCPR } from '../../../../shared/taxonomies/constants';
import { enumValues } from '../../../../utils/enumUtils';
import { appUtils } from '../../../../utils/utils';
import { getAsset } from '../../../asset/tests/assetTestHelper';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportLog } from '../../models/nexoImportLog';
import {
  IInterventionSEHeaders,
  InterventionSERow,
  minimalInterventionSE,
  NEXO_CARNET,
  NO_DOSSIER_SE
} from '../../models/rows/interventionsSERow';
import { minimalNexoRow, NexoRow } from '../../models/rows/nexoRow';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { startNexoImportUseCase } from '../../useCases/startNexoImport/startNexoImportUseCase';
import { NEXO_CODE_PHASE_CANCELED } from '../../validators/nexoImportFileValidator';
import {
  assertNexoImportedIntervention,
  assertNexoImportFailure,
  assertNexoProjectCreated,
  assertNexoProjectDelete,
  assertNexoProjectUpdate,
  deleteNexoBookTaxonomy,
  EXISTING_NEXO_DOSSIER,
  getInterventionSERowHeaders,
  getInterventionSERowProps,
  getNexoImportFile,
  getNexoImportLog,
  getNexoXLXSFile,
  insertNexoBookTaxonomy,
  NEXO_DELAY,
  setupNexoProjectDelete
} from '../nexoTestHelper';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe(`startNexoImportUseCase`, () => {
  let nexoImportLog: NexoImportLog;

  function stubDownload(response?: any, success = true) {
    const method = 'get';
    if (!success) {
      sandbox.stub(storageApiService, method).rejects();
    }
    sandbox.stub(storageApiService, method).resolves(response);
  }

  async function getNexoImportLogFromDB(id: string): Promise<INexoImportLog> {
    return nexoImportLogMapperDTO.getFromModel(await nexoImportLogRepository.findById(id));
  }

  before(async () => {
    await insertNexoBookTaxonomy();
    // reset taxonomies cache
    taxonomyService.reset();
  });

  after(async () => {
    await deleteNexoBookTaxonomy();
    // reset taxonomies cache
    taxonomyService.reset();
  });

  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
  });

  describe(`Negative`, () => {
    beforeEach(async () => {
      nexoImportLog = (
        await nexoImportLogRepository.save(
          getNexoImportLog({
            status: NexoImportStatus.IN_PROGRESS
          })
        )
      ).getValue();
    });

    [
      {
        description: 'Invalid id',
        requestError: {
          id: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: 'id has a bad format'
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const result = await startNexoImportUseCase.execute(test.requestError);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    it(`should return notFoundError when given nexoImportLog id do not exists`, async () => {
      const result = await startNexoImportUseCase.execute({
        id: NOT_FOUND_UUID
      });
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
    });

    it(`should return alreadyExistsError when an import already is running`, async () => {
      const pendingImportLog: NexoImportLog = getNexoImportLog({
        status: NexoImportStatus.PENDING
      });
      const nexoImportToRun = (await nexoImportLogRepository.save(pendingImportLog)).getValue();
      const result = await startNexoImportUseCase.execute({
        id: nexoImportToRun.id
      });
      assert.isTrue(result.isLeft());
      assert.strictEqual(result.value.constructor, AlreadyExistsError, 'should be AlreadyExistsError');
    });

    [
      {
        description: 'already success',
        status: NexoImportStatus.SUCCESS
      },
      {
        description: 'already failure',
        status: NexoImportStatus.FAILURE
      }
    ].forEach(test => {
      it(`should return UnprocessableEntityError given import is ${test.description}`, async () => {
        const successImportLog: NexoImportLog = getNexoImportLog({
          status: test.status
        });
        await nexoImportLogRepository.save(successImportLog);
        const result = await startNexoImportUseCase.execute({
          id: successImportLog.id
        });
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, UnprocessableEntityError, SHOULD_BE_UNPROCESSABLE_ERROR);
      });
    });

    it(`should return failure when missing columns`, async () => {
      const datas: IInterventionSEHeaders[] = [getInterventionSERowHeaders(), getInterventionSERowHeaders()];
      const missingColumns = ['Budget'];
      const missingDatas = datas.map(data => {
        return omit(data, missingColumns);
      });
      const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, missingDatas as IInterventionSEHeaders[]);

      stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

      const result = await startNexoImportUseCase.execute({
        id: nexoImportLog.id
      });
      assert.isTrue(result.isRight());
      // give it a delay due to fire and forget
      await appUtils.delay(NEXO_DELAY);
      const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
      assertNexoImportFailure(executedImportDTO, {
        [NexoFileType.INTERVENTIONS_SE]: [`La colonne ${missingColumns.join(',')} est manquante`]
      });
    });

    it(`should return failure when first file is not ${NexoFileType.INTERVENTIONS_SE}`, async () => {
      // COMPLETE previous import
      await nexoImportLogRepository.save(
        getNexoImportLog(
          {
            status: NexoImportStatus.SUCCESS
          },
          nexoImportLog.id
        )
      );

      const pendingImportLog: NexoImportLog = getNexoImportLog({
        status: NexoImportStatus.PENDING,
        files: [
          getNexoImportFile({
            type: NexoFileType.INTERVENTIONS_BUDGET_SE
          })
        ]
      });
      const nexoImportToRun = (await nexoImportLogRepository.save(pendingImportLog)).getValue();
      const result = await startNexoImportUseCase.execute({
        id: nexoImportToRun.id
      });
      // give it a delay due to fire and forget
      await appUtils.delay(NEXO_DELAY);
      assert.isTrue(result.isRight());
      const executedImportDTO = await getNexoImportLogFromDB(nexoImportToRun.id);
      assertNexoImportFailure(executedImportDTO, {
        [NexoFileType.INTERVENTIONS_BUDGET_SE]: [
          `Le premier fichier d'import n'est pas ${NexoFileType.INTERVENTIONS_SE}`
        ]
      });
    });
  });
  // NOSONAR
  describe(`Positive`, () => {
    const geom1 = `{
      "type": "LineString",
      "coordinates": [[-73.56006771311111, 45.49876714511111], [-73.55963587711111, 45.49922586911111]]
    }`;
    const geom2 = `{
      "type": "LineString",
      "coordinates": [[-73.56006771322222, 45.49876714522222], [-73.55963587722222, 45.49922586922222]]
    }`;
    const geom3 = `{
      "type": "LineString",
      "coordinates": [[-73.56006771333333, 45.49876714533333], [-73.55963587733333, 45.49922586933333]]
    }`;
    const geom4 = `{
      "type": "LineString",
      "coordinates": [[-73.56006771344444, 45.49876714544444], [-73.55963587744444, 45.49922586944444]]
    }`;
    beforeEach(async () => {
      nexoImportLog = (
        await nexoImportLogRepository.save(
          getNexoImportLog({
            status: NexoImportStatus.PENDING
          })
        )
      ).getValue();
    });

    [
      {
        description: `All basic datas`,
        rowData: {}
      },
      {
        description: `null carnet value`,
        rowData: {
          carnet: null
        }
      },
      {
        description: `empty string carnet value`,
        rowData: {
          carnet: ''
        }
      },
      {
        description: `dateMAJProjet as 2017-12-14 16:12:28`,
        rowData: {
          dateMAJProjet: new Date('2017-12-14 16:12:28')
        }
      }
    ].forEach(test => {
      it(`should start NexoImportLog with ${test.description} and create interventions and projects`, async () => {
        const datas = [
          getInterventionSERowHeaders({
            geom: geom2
          }),
          getInterventionSERowHeaders({
            geom: geom1
          }),
          // Project do not exists, not di not pni
          getInterventionSERowHeaders({
            geom: geom2,
            noDossierSE: 'ANOTHER_NO_DOSSIER',
            comparaison: 'ANOTHER_COMPARAISON',
            carnet: '',
            codeExecutant: '2',
            ...test.rowData
          })
        ];
        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY + 500);
        assert.isTrue(result.isRight());

        const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
        assert.include(
          [NexoImportStatus.SUCCESS, NexoImportStatus.IN_PROGRESS],
          executedImportDTO.status,
          `should be ${NexoImportStatus.SUCCESS} or ${NexoImportStatus.IN_PROGRESS}`
        );

        // check that interventions have been created
        const findInterventionsOptions = InterventionFindOptions.create({
          criterias: {
            nexoReferenceNumber: datas.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE)
          }
        }).getValue();
        const importedInterventions = await interventionRepository.findAll(findInterventionsOptions);
        assert.isNotEmpty(importedInterventions);
        assert.equal(importedInterventions.length, 2);
        for (let data of datas) {
          data = appUtils.lowerizeObjectKeys(data);
          const matchedIntervention = importedInterventions.find(i =>
            i.externalReferenceIds.find(extId => extId.value === data.noDossierSE)
          );
          await assertNexoImportedIntervention(data, matchedIntervention);
        }

        const interventionWith2Assets = importedInterventions.find(i =>
          i.externalReferenceIds.find(ext => ext.value === NO_DOSSIER_SE)
        );
        assert.strictEqual(interventionWith2Assets.assets.length, 2);
        // check assets values
        assert.isTrue(
          interventionWith2Assets.assets
            .map(a => a.geometry)
            .some(() => datas.map(data => appUtils.stringifiedJSONToJSON(data[`Geom`])))
        );
        assert.isTrue(
          interventionWith2Assets.assets
            .map(a => a.length.value)
            .some(() => datas.map(data => data[`LongueurExistant`]))
        );
        assert.isTrue(
          interventionWith2Assets.assets
            .map(
              a =>
                a.externalReferenceIds.find(
                  extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
                ).value
            )
            .some(() => datas.map(data => data[`Comparaison`]))
        );
        assert.isTrue(
          interventionWith2Assets.assets
            .map(
              a =>
                a.externalReferenceIds.find(extId => extId.type === InterventionExternalReferenceType.nexoAssetId).value
            )
            .some(() => datas.map(data => data[`IDActif`]))
        );

        // check that project have been created
        await assertNexoProjectCreated(importedInterventions);

        // check that interventions were added to importLog
        const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
        const importLogInterventions = fileImported.interventions;
        assert.strictEqual(importLogInterventions.length, datas.length, `should be ${datas.length}`);
        assert.strictEqual(fileImported.numberOfItems, datas.length);
        for (const [index, intervention] of importLogInterventions.entries()) {
          assert.strictEqual(appUtils.lowerizeObjectKeys(datas[index]).comparaison, intervention.id);
          assert.strictEqual(index + 1, intervention.lineNumber);
          assert.strictEqual(
            intervention.importStatus,
            NexoImportStatus.SUCCESS,
            `should be ${NexoImportStatus.SUCCESS}`
          );
          assert.strictEqual(
            intervention.modificationType,
            ModificationType.CREATION,
            `should be ${ModificationType.CREATION}`
          );
        }
        // check that projects were added to importLog
        const importLogProjects = fileImported.projects;
        assert.strictEqual(importLogProjects.length, 1, `should be 1`);
        for (const project of importLogProjects) {
          // The project created is for not pni/dre
          assert.strictEqual('ANOTHER_NO_DOSSIER', project.id);
          assert.strictEqual(project.importStatus, NexoImportStatus.SUCCESS, `should be ${NexoImportStatus.SUCCESS}`);
          assert.strictEqual(
            project.modificationType,
            ModificationType.CREATION,
            `should be ${ModificationType.CREATION}`
          );
        }
      });
    });

    [
      {
        description: `Import intervention without idActif`
      }
    ].forEach(test => {
      it(`should run NexoImportLog with ${test.description} and create interventions`, async () => {
        const datas = [
          getInterventionSERowHeaders({
            ...minimalNexoRow,
            iDActif: null,
            diametre: null,
            materiau: null,
            dateInstallation: null,
            longueurExistant: null,
            longueurIntervention: null,
            pourcentage: null,
            versionPI: null,
            noDossierSE: 'add-one-intervention-PNI-without-asset',
            codePhase: '2',
            uniteResponsable: 'DRE-Section Sud',
            responsable: 'Sofiane Djad',
            arrondissement: 'Ville-Marie',
            rue: 'Rue Saint-Maurice',
            de: 'Rue Dupré',
            a: 'Rue Saint-Henri',
            precision: null,
            phase: 'Actif',
            codeActif: '4',
            actif: 'Aqueduc',
            codeTravaux: '3',
            travaux: 'Construction',
            quantiteProjet: 256,
            typeQuantite: 'Linéaire',
            codeExecutant: '5',
            executant: 'DEEU',
            anneeDebutTravaux: appUtils.getCurrentYear(),
            anneeFinTravaux: appUtils.getCurrentYear(),
            budget: 361340,
            carnet: NEXO_CARNET,
            descriptionCarnet: `Réhabilitation aqueduc ${appUtils.getCurrentYear()} DI`,
            codeStatutCarnet: '3',
            statutCarnet: 'Publié',
            dateMAJProjet: new Date(`${appUtils.getCurrentYear() - 1}-02-14 08:41:16.000`),
            comparaison: 'add-one-intervention-PNI-without-asset-Construction',
            geom: `{"type": "LineString","coordinates":[[-73.56006771326065,45.49876714523858],[-73.55963587760925,45.49922586978999]]}`
          })
        ];
        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY + 500);
        assert.isTrue(result.isRight());

        const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
        assert.include(
          [NexoImportStatus.SUCCESS, NexoImportStatus.IN_PROGRESS],
          executedImportDTO.status,
          `should be ${NexoImportStatus.SUCCESS} or ${NexoImportStatus.IN_PROGRESS}`
        );

        // check that interventions have been created
        const findInterventionsOptions = InterventionFindOptions.create({
          criterias: {
            nexoReferenceNumber: datas.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE)
          }
        }).getValue();
        const importedInterventions = await interventionRepository.findAll(findInterventionsOptions);
        assert.isNotEmpty(importedInterventions);
        assert.equal(importedInterventions.length, 1);
        for (let data of datas) {
          data = appUtils.lowerizeObjectKeys(data);
          const matchedIntervention = importedInterventions.find(i =>
            i.externalReferenceIds.find(extId => extId.value === data.noDossierSE)
          );
          await assertNexoImportedIntervention(data, matchedIntervention);
        }

        // check that no project have been created
        const projects = await projectRepository.findAll(
          ProjectFindOptions.create({
            criterias: {}
          }).getValue()
        );
        assert.isEmpty(projects);

        // check that interventions were added to importLog
        const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
        const importLogInterventions = fileImported.interventions;
        assert.strictEqual(importLogInterventions.length, datas.length, `should be ${datas.length}`);
        assert.strictEqual(fileImported.numberOfItems, datas.length);
        for (const [index, intervention] of importLogInterventions.entries()) {
          assert.strictEqual(appUtils.lowerizeObjectKeys(datas[index]).comparaison, intervention.id);
          assert.strictEqual(index + 1, intervention.lineNumber);
          assert.strictEqual(
            intervention.importStatus,
            NexoImportStatus.SUCCESS,
            `should be ${NexoImportStatus.SUCCESS}`
          );
          assert.strictEqual(
            intervention.modificationType,
            ModificationType.CREATION,
            `should be ${ModificationType.CREATION}`
          );
        }
      });
    });

    it(`should start NexoImportLog with a new intervention codePhase 4 (canceled) and no intervention created`, async () => {
      const NOT_INSERTED_INTERVENTION = 'NOT_INSERTED_INTERVENTION';
      const datas = [
        getInterventionSERowHeaders({
          geom: geom1,
          codePhase: NEXO_CODE_PHASE_CANCELED,
          carnet: '',
          codeExecutant: '2',
          comparaison: NOT_INSERTED_INTERVENTION
        })
      ];
      const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
      stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

      const result = await startNexoImportUseCase.execute({
        id: nexoImportLog.id
      });
      // give it a delay due to fire and forget
      await appUtils.delay(NEXO_DELAY + 500);
      assert.isTrue(result.isRight());

      const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
      assert.include(
        [NexoImportStatus.SUCCESS, NexoImportStatus.IN_PROGRESS],
        executedImportDTO.status,
        `should be ${NexoImportStatus.SUCCESS} or ${NexoImportStatus.IN_PROGRESS}`
      );

      // check that no interventions has been created
      const findInterventionsOptions = InterventionFindOptions.create({
        criterias: {}
      }).getValue();
      const importedInterventions = await interventionRepository.findAll(findInterventionsOptions);
      assert.isEmpty(importedInterventions);

      // check that no project has been created
      const findProjectsOptions = ProjectFindOptions.create({
        criterias: {}
      }).getValue();
      const importedProjects = await projectRepository.findAll(findProjectsOptions);
      assert.isEmpty(importedProjects);

      // check there is an intervention entry in nexoImportLog
      const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
      const importLogInterventions = fileImported.interventions;
      const foundInterventionLog = importLogInterventions.find(i => i.id === NOT_INSERTED_INTERVENTION);
      assert.isDefined(foundInterventionLog);
      assert.strictEqual(foundInterventionLog.importStatus, NexoImportStatus.SUCCESS);
      assert.strictEqual(foundInterventionLog.modificationType, ModificationType.DELETION);
    });

    [
      {
        description: `Update project`
      }
    ].forEach(test => {
      it(`should start NexoImportLog with ${test.description}, create interventions and update project`, async () => {
        const NEXO_DOSSIER_NOT_UPDATING = 'NEXO_DOSSIER_NOT_UPDATING';
        let existingProjectUpdate = getInitialProject();
        const existingProjectNotUpdated = getInitialProject();
        existingProjectUpdate.externalReferenceIds = [
          {
            type: InterventionExternalReferenceType.nexoReferenceNumber,
            value: EXISTING_NEXO_DOSSIER
          }
        ];
        existingProjectNotUpdated.externalReferenceIds = [
          {
            type: InterventionExternalReferenceType.nexoReferenceNumber,
            value: NEXO_DOSSIER_NOT_UPDATING
          }
        ];
        existingProjectUpdate = (await projectRepository.save(existingProjectUpdate)).getValue();
        await projectRepository.save(existingProjectNotUpdated);

        const allProjectsFind = ProjectFindOptions.create({
          criterias: {},
          expand: ProjectExpand.interventions
        }).getValue();
        const allProjects = await projectRepository.findAll(allProjectsFind);
        assert.strictEqual(allProjects.length, 2, `should be 2`);
        assert.isDefined(
          allProjects.find(project =>
            project.externalReferenceIds.find(
              extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
            )
          )
        );

        const datas = [
          // Project exists, not di not pni
          getInterventionSERowHeaders({
            noDossierSE: EXISTING_NEXO_DOSSIER,
            carnet: '',
            codeExecutant: '2'
          })
        ];
        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());

        const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
        assert.include(
          [NexoImportStatus.SUCCESS, NexoImportStatus.IN_PROGRESS],
          executedImportDTO.status,
          `should be ${NexoImportStatus.SUCCESS} or ${NexoImportStatus.IN_PROGRESS}`
        );

        // check that interventions have been created
        const findInterventionsOptions = InterventionFindOptions.create({
          criterias: {
            nexoReferenceNumber: datas.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE)
          }
        }).getValue();
        const importedInterventions = await interventionRepository.findAll(findInterventionsOptions);
        assert.isNotEmpty(importedInterventions);
        assert.equal(importedInterventions.length, datas.length);
        for (let data of datas) {
          data = appUtils.lowerizeObjectKeys(data);
          const matchedIntervention = importedInterventions.find(i =>
            i.externalReferenceIds.find(extId => extId.value === data.noDossierSE)
          );
          await assertNexoImportedIntervention(data, matchedIntervention);
        }
        await assertNexoProjectUpdate(existingProjectUpdate, EXISTING_NEXO_DOSSIER);
      });
    });

    describe(`Update interventions`, () => {
      describe(`with non pni existing intervention`, () => {
        // set up existing interventions to update
        const EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE = 'EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE';
        const EXISTING_NEXO_INTERVENTION_COMPARAISON = 'EXISTING_NEXO_INTERVENTION_COMPARAISON';
        const EXISTING_NEXO_ASSET_ID = 'EXISTING_NEXO_ASSET_ID';
        const existingInterventionProps: Partial<IInterventionSEHeaders> = {
          geom: geom1,
          noDossierSE: EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE,
          comparaison: EXISTING_NEXO_INTERVENTION_COMPARAISON,
          carnet: 'NULL',
          codeExecutant: '2',
          iDActif: EXISTING_NEXO_ASSET_ID
        };
        let existingIntervention: IEnrichedIntervention;
        beforeEach(async () => {
          // Clean row values as it is a direct creation not going through parsing
          const interventionSE = InterventionSERow.create({
            ...NexoRow.cleanRowValues(getInterventionSERowProps(existingInterventionProps))
          });
          const interventionToSave = await interventionSE.getValue().toIntervention(
            [
              getAsset({
                typeId: 'sewerSegment',
                geometry: interventionSE.getValue().geom,
                externalReferenceIds: [
                  {
                    type: InterventionExternalReferenceType.nexoReferenceNumber,
                    value: EXISTING_NEXO_INTERVENTION_COMPARAISON
                  },
                  {
                    type: InterventionExternalReferenceType.nexoAssetId,
                    value: EXISTING_NEXO_ASSET_ID
                  }
                ]
              })
            ],
            []
          );
          const interventionSaveResult = await interventionRepository.save(interventionToSave);
          existingIntervention = interventionSaveResult.getValue();
          const externalRefId = existingIntervention.externalReferenceIds.find(
            extId => extId.value === EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE
          );
          assert.isDefined(externalRefId);
        });

        const PROJECT_OPERATION_CREATE = 'create';
        const PROJECT_OPERATION_UPDATE = 'update';
        const PROJECT_OPERATION_DELETE = 'delete';
        [
          {
            description: 'executor is dre/pni',
            data: {
              codeExecutant: '4',
              carnet: NEXO_CARNET
            },
            project: ''
          },
          {
            description: 'executor is NOT dre/pni and CREATE project',
            data: {
              codeExecutant: '2',
              carnet: ''
            },
            project: PROJECT_OPERATION_CREATE
          },
          {
            description: 'executor is NOT dre/pni and UPDATE project',
            data: {
              codeExecutant: '2',
              carnet: ''
            },
            project: PROJECT_OPERATION_UPDATE
          },
          {
            description: 'executor is pni and DELETE existing project',
            data: {
              codeExecutant: '4',
              carnet: NEXO_CARNET
            },
            project: PROJECT_OPERATION_DELETE
          }
        ].forEach(test => {
          it(`should start NexoImportLog, update interventions with ${test.description}`, async () => {
            if (test.project === PROJECT_OPERATION_CREATE) {
              // no project exists
              const findProjectsOptions = ProjectFindOptions.create({
                criterias: {}
              }).getValue();
              const allProjects = await projectRepository.findAll(findProjectsOptions);
              assert.isEmpty(allProjects);
            }

            let existingProjectUpdate: IEnrichedProject;
            if ([PROJECT_OPERATION_UPDATE, PROJECT_OPERATION_DELETE].includes(test.project)) {
              // create project
              existingProjectUpdate = getInitialProject();
              existingProjectUpdate.externalReferenceIds = [
                {
                  type: InterventionExternalReferenceType.nexoReferenceNumber,
                  value: EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE
                }
              ];
              const existingProjectUpdateResult = await projectRepository.save(existingProjectUpdate);
              existingProjectUpdate = existingProjectUpdateResult.getValue();

              const findProjectsOptions = ProjectFindOptions.create({
                criterias: {}
              }).getValue();
              const allProjects = await projectRepository.findAll(findProjectsOptions);
              assert.isNotEmpty(allProjects);

              // if is in deleting mode, create elements to be deleted/updated by project deletion
              if (test.project === PROJECT_OPERATION_DELETE) {
                await setupNexoProjectDelete(existingProjectUpdate);
              }
            }

            // Run another import to update interventions
            const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
            const dataToUpdateProps: IInterventionSEHeaders = {
              ...existingInterventionProps,
              geom: geom1,
              noDossierSE: EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE,
              comparaison: EXISTING_NEXO_INTERVENTION_COMPARAISON,
              arrondissement: 'Lachine',
              uniteResponsable: 'DRE-Section Nord',
              anneeDebutTravaux: minimalInterventionSE.anneeDebutTravaux + 1,
              anneeFinTravaux: minimalInterventionSE.anneeFinTravaux + 1,
              budget: minimalInterventionSE.budget + 1000,
              responsable: 'anyone',
              dateMAJProjet,
              rue: `new street`,
              de: `new de`,
              a: `new a`,
              ...test.data
            } as IInterventionSEHeaders;
            const datasUpdate = [getInterventionSERowHeaders(dataToUpdateProps)];

            const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datasUpdate);
            stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));
            const result = await startNexoImportUseCase.execute({
              id: nexoImportLog.id
            });
            // give it a delay due to fire and forget
            await appUtils.delay(NEXO_DELAY + 2000);
            assert.isTrue(result.isRight());

            // find interventions updated
            const findInterventionsOptions = InterventionFindOptions.create({
              criterias: {
                nexoReferenceNumber: datasUpdate.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE)
              }
            }).getValue();
            const updatedInterventions = await interventionRepository.findAll(findInterventionsOptions);
            const updatedIntervention = updatedInterventions.find(
              i =>
                i.externalReferenceIds.find(extId => extId.value === EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE) &&
                i.workTypeId === existingIntervention.workTypeId &&
                i.assets[0].typeId === existingIntervention.assets[0].typeId
            );
            assert.isDefined(updatedIntervention);

            // check that intervention has changed
            assert.strictEqual(updatedIntervention.id, existingIntervention.id);

            assert.notEqual(updatedIntervention.boroughId, existingIntervention.boroughId);
            assert.strictEqual(updatedIntervention.boroughId, BoroughCode.LCH);

            assert.notEqual(updatedIntervention.interventionYear, existingIntervention.interventionYear);
            assert.strictEqual(updatedIntervention.interventionYear, dataToUpdateProps.anneeDebutTravaux);
            assert.notEqual(updatedIntervention.planificationYear, existingIntervention.planificationYear);
            assert.strictEqual(updatedIntervention.planificationYear, dataToUpdateProps.anneeDebutTravaux);
            assert.notEqual(updatedIntervention.endYear, existingIntervention.endYear);
            assert.strictEqual(updatedIntervention.endYear, dataToUpdateProps.anneeFinTravaux);

            assert.notEqual(updatedIntervention.estimate.allowance, existingIntervention.estimate.allowance);

            assert.isUndefined(updatedIntervention.roadNetworkTypeId);

            assert.notEqual(updatedIntervention.assets, existingIntervention.assets);
            const updatedInterventionAssetGeom = updatedIntervention.assets.find(a => a).geometry;
            // tslint:disable-next-line:no-string-literal
            const incomingAssetGeom: IGeometry = appUtils.stringifiedJSONToJSON(datasUpdate[0]['Geom']);
            assert.strictEqual(updatedInterventionAssetGeom.type, incomingAssetGeom.type);

            assert.notEqual(updatedIntervention.importRevisionDate, existingIntervention.importRevisionDate);

            assert.notEqual(updatedIntervention.streetName, existingIntervention.streetName);
            assert.strictEqual(updatedIntervention.streetName, dataToUpdateProps.rue);
            assert.notEqual(updatedIntervention.streetFrom, existingIntervention.streetFrom);
            assert.strictEqual(updatedIntervention.streetFrom, dataToUpdateProps.de);
            assert.notEqual(updatedIntervention.streetTo, existingIntervention.streetTo);
            assert.strictEqual(updatedIntervention.streetTo, dataToUpdateProps.a);

            // programId only if carnet is not null or empty
            if (test.data.carnet === NEXO_CARNET) {
              assert.notEqual(updatedIntervention.programId, existingIntervention.programId);
              assert.strictEqual(updatedIntervention.programId, PROGRAM_TYPE_PCPR);
              assert.isTrue(updatedIntervention.decisionRequired);
            }

            let numberOfProjects = 0; // 0 is for DI or PNI
            let nexoLogProjectModificationType: ModificationType = ModificationType.CREATION;
            if (test.project === PROJECT_OPERATION_CREATE) {
              await assertNexoProjectCreated([updatedIntervention]);
              numberOfProjects = 1;
            }
            if (test.project === PROJECT_OPERATION_UPDATE) {
              await assertNexoProjectUpdate(existingProjectUpdate, EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE);
              nexoLogProjectModificationType = ModificationType.MODIFICATION;
              numberOfProjects = 1;
            }
            if (test.project === PROJECT_OPERATION_DELETE) {
              await assertNexoProjectDelete(existingProjectUpdate);
              nexoLogProjectModificationType = ModificationType.DELETION;
              numberOfProjects = 1;
              assert.isNull(updatedIntervention.project);
              assert.isNotNull(updatedIntervention.annualDistribution);
            }

            // check that projects were added to importLog
            const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
            const importLogProjects = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE)
              .projects;
            assert.strictEqual(importLogProjects.length, numberOfProjects, `should be ${numberOfProjects}`);
            for (const project of importLogProjects) {
              assert.strictEqual(EXISTING_NEXO_INTERVENTION_NO_DOSSIER_SE, project.id);
              assert.strictEqual(
                project.importStatus,
                NexoImportStatus.SUCCESS,
                `should be ${NexoImportStatus.SUCCESS}`
              );
              assert.strictEqual(
                project.modificationType,
                nexoLogProjectModificationType,
                `should be ${nexoLogProjectModificationType}`
              );
            }
          });
        });
      });
      describe(`with PNI existing intervention`, () => {
        // set up existing interventions to update
        const EXISTING_PNI_NEXO_INTERVENTION = 'EXISTING_PNI_NEXO_INTERVENTION';
        beforeEach(async () => {
          // Clean row values as it is a direct creation not going through parsing
          const interventionSE = InterventionSERow.create({
            ...NexoRow.cleanRowValues(
              getInterventionSERowProps({
                geom: geom1,
                noDossierSE: EXISTING_PNI_NEXO_INTERVENTION,
                comparaison: EXISTING_PNI_NEXO_INTERVENTION,
                carnet: NEXO_CARNET, // PNI
                codeExecutant: '4'
              })
            )
          });
          await interventionSE.getValue().toIntervention(
            [
              getAsset({
                geometry: interventionSE.getValue().geom
              })
            ],
            []
          );
        });

        [
          {
            description: 'to NON PNI',
            data: {
              codeExecutant: '2',
              carnet: '' // NOT_PNI
            },
            project: ''
          }
        ].forEach(test => {
          it(`should start NexoImportLog, update interventions ${test.description}`, async () => {
            const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
            const dataToUpdateProps: IInterventionSEHeaders = {
              geom: geom1,
              noDossierSE: EXISTING_PNI_NEXO_INTERVENTION,
              comparaison: EXISTING_PNI_NEXO_INTERVENTION,
              dateMAJProjet,
              ...test.data
            } as IInterventionSEHeaders;
            const datasUpdate = [getInterventionSERowHeaders(dataToUpdateProps)];

            const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datasUpdate);
            stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));
            const result = await startNexoImportUseCase.execute({
              id: nexoImportLog.id
            });
            // give it a delay due to fire and forget
            await appUtils.delay(NEXO_DELAY);
            assert.isTrue(result.isRight());

            // find interventions updated
            const findInterventionsOptions = InterventionFindOptions.create({
              criterias: {
                nexoReferenceNumber: datasUpdate.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE)
              }
            }).getValue();
            const updatedInterventions = await interventionRepository.findAll(findInterventionsOptions);
            const updatedIntervention = updatedInterventions.find(i =>
              i.externalReferenceIds.find(extId => extId.value === EXISTING_PNI_NEXO_INTERVENTION)
            );
            assert.isDefined(updatedIntervention);
            // from PNI to PI => programId is set to null
            assert.isNull(updatedIntervention.programId);
          });
        });
      });
    });

    describe(`Delete interventions`, () => {
      describe(`all elements imported`, () => {
        const NEXO_NO_DOSSIER = 'NEXO_NO_DOSSIER';
        // set up existing interventions to delete
        const EXISTING_NEXO_INTERVENTION_TO_DELETE = 'EXISTING_NEXO_INTERVENTION_TO_DELETE';
        const EXISTING_NEXO_INTERVENTION_TO_KEEP = 'EXISTING_NEXO_INTERVENTION_TO_KEEP';
        const row1 = {
          geom: geom1,
          noDossierSE: NEXO_NO_DOSSIER,
          comparaison: EXISTING_NEXO_INTERVENTION_TO_DELETE,
          carnet: 'NULL',
          codeExecutant: '2'
        };
        const row2 = {
          geom: geom2,
          noDossierSE: NEXO_NO_DOSSIER,
          comparaison: EXISTING_NEXO_INTERVENTION_TO_KEEP,
          carnet: 'NULL',
          codeExecutant: '2',
          codeTravaux: '4'
        };
        beforeEach(async () => {
          // run a first import
          const datas = [getInterventionSERowProps(row1), getInterventionSERowProps(row2)];
          const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
          stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));
          const result = await startNexoImportUseCase.execute({
            id: nexoImportLog.id
          });
          await appUtils.delay(NEXO_DELAY + 1000);
          assert.isTrue(result.isRight());

          const allInterventions = await interventionRepository.findAll(
            InterventionFindOptions.create({
              criterias: {
                nexoReferenceNumber: [NEXO_NO_DOSSIER],
                status: enumValues(InterventionStatus)
              }
            }).getValue()
          );
          assert.strictEqual(allInterventions.length, 2, `there should be 2 interventions created`);

          sandbox.restore();

          nexoImportLog = (
            await nexoImportLogRepository.save(
              getNexoImportLog({
                status: NexoImportStatus.PENDING
              })
            )
          ).getValue();
        });

        const PROJECT_OPERATION_UPDATE = 'update';
        const PROJECT_OPERATION_DELETE = 'delete';
        const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
        [
          {
            description: 'no associated project',
            data: [
              getInterventionSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER,
                comparaison: EXISTING_NEXO_INTERVENTION_TO_DELETE,
                dateMAJProjet,
                codePhase: NEXO_CODE_PHASE_CANCELED,
                codeExecutant: '4',
                carnet: NEXO_CARNET,
                geom: geom1
              })
            ],
            project: ''
          },
          {
            description: 'UPDATE project',
            data: [
              getInterventionSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER,
                comparaison: EXISTING_NEXO_INTERVENTION_TO_DELETE,
                dateMAJProjet,
                codePhase: NEXO_CODE_PHASE_CANCELED,
                codeExecutant: '2',
                carnet: '',
                geom: geom1
              })
            ],
            project: PROJECT_OPERATION_UPDATE
          },
          {
            description: 'DELETE project',
            data: [
              getInterventionSERowHeaders({
                ...row1,
                dateMAJProjet,
                codePhase: NEXO_CODE_PHASE_CANCELED
              }),
              getInterventionSERowHeaders({
                ...row2,
                dateMAJProjet,
                codePhase: NEXO_CODE_PHASE_CANCELED
              })
            ],
            project: PROJECT_OPERATION_DELETE
          }
        ].forEach(test => {
          it(`should start NexoImportLog, delete interventions with ${test.description}`, async () => {
            let existingProjectUpdate: IEnrichedProject;
            if ([PROJECT_OPERATION_UPDATE, PROJECT_OPERATION_DELETE].includes(test.project)) {
              const findProjectsOptions = ProjectFindOptions.create({
                criterias: {
                  nexoReferenceNumber: [NEXO_NO_DOSSIER]
                }
              }).getValue();
              const allProjects = await projectRepository.findAll(findProjectsOptions);
              assert.isNotEmpty(allProjects);
              existingProjectUpdate = allProjects.find(p => p);

              // if is in deleting mode, create elements to be deleted/updated by project deletion
              if (test.project === PROJECT_OPERATION_DELETE) {
                await setupNexoProjectDelete(existingProjectUpdate);
              }
            }

            // Check if interventions exist before import
            const interventionsToDeleteFindOptions = InterventionFindOptions.create({
              criterias: {
                nexoReferenceNumber: test.data.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE),
                status: enumValues(InterventionStatus)
              }
            }).getValue();
            const existingInterventions = await interventionRepository.findAll(interventionsToDeleteFindOptions);
            assert.lengthOf(existingInterventions, 2);
            const existingExternalIds = appUtils.concatArrayOfArrays(
              existingInterventions.map(i => i.externalReferenceIds.map(extId => extId.value))
            );
            assert.isTrue(existingExternalIds.every(id => [NEXO_NO_DOSSIER].includes(id)));

            const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, test.data);
            stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

            // Run use case
            const result = await startNexoImportUseCase.execute({
              id: nexoImportLog.id
            });
            // give it a delay due to fire and forget
            await appUtils.delay(NEXO_DELAY);
            assert.isTrue(result.isRight());

            // Search for existing interventions
            if (test.project !== PROJECT_OPERATION_DELETE) {
              const interventionsKeeped = await interventionRepository.findAll(interventionsToDeleteFindOptions);
              assert.lengthOf(interventionsKeeped, 1);
              const keepedExternalIds = appUtils.concatArrayOfArrays(
                interventionsKeeped.map(i => i.externalReferenceIds.map(extId => extId.value))
              );
              assert.isTrue(keepedExternalIds.includes(NEXO_NO_DOSSIER));
            }

            // Check that deletion was stored on nexoImportLog
            const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
            const interventionsImportLog = executedImportDTO.files.find(
              file => file.type === NexoFileType.INTERVENTIONS_SE
            ).interventions;
            assert.isNotEmpty(interventionsImportLog);
            const deletedLog = interventionsImportLog.find(iLog => iLog.modificationType === ModificationType.DELETION);
            assert.isDefined(deletedLog);
            assert.strictEqual(deletedLog.importStatus, NexoImportStatus.SUCCESS);
            assert.strictEqual(deletedLog.id, EXISTING_NEXO_INTERVENTION_TO_DELETE);

            if (test.project === PROJECT_OPERATION_UPDATE) {
              await assertNexoProjectUpdate(existingProjectUpdate, NEXO_NO_DOSSIER, 1);
            }
            if (test.project === PROJECT_OPERATION_DELETE) {
              await assertNexoProjectDelete(existingProjectUpdate);
            }
          });
        });
      });

      it(`should delete a project (non imported) when matching nexo intervention is canceled`, async () => {
        // create project
        let existingProject = getInitialProject();
        existingProject = (await projectRepository.save(existingProject)).getValue();

        // existing PNI instervention
        const EXISTING_PNI_NEXO_INTERVENTION_NO_DOSSIER_SE = 'EXISTING_PNI_NEXO_INTERVENTION_NO_DOSSIER_SE';
        const EXISTING_PNI_NEXO_INTERVENTION_COMPARAISON = 'EXISTING_PNI_NEXO_INTERVENTION_COMPARAISON';
        const ASSET_ID = 'ASSET_ID';

        const interventionToImportProps = {
          geom: geom1,
          noDossierSE: EXISTING_PNI_NEXO_INTERVENTION_NO_DOSSIER_SE,
          comparaison: EXISTING_PNI_NEXO_INTERVENTION_COMPARAISON,
          carnet: NEXO_CARNET, // PNI
          codeExecutant: '4',
          iDActif: ASSET_ID
        };
        // Clean row values as it is a direct creation not going through parsing
        const interventionSE = InterventionSERow.create({
          ...NexoRow.cleanRowValues(getInterventionSERowProps(interventionToImportProps))
        });
        const existingIntervention = await interventionSE.getValue().toIntervention(
          [
            getAsset({
              typeId: 'sewerSegment',
              geometry: interventionSE.getValue().geom,
              externalReferenceIds: [
                {
                  type: InterventionExternalReferenceType.nexoReferenceNumber,
                  value: EXISTING_PNI_NEXO_INTERVENTION_COMPARAISON
                },
                {
                  type: InterventionExternalReferenceType.nexoAssetId,
                  value: ASSET_ID
                }
              ]
            })
          ],
          []
        );
        existingIntervention.setProject({ id: existingProject.id });
        const interventionInProject = (await interventionRepository.save(existingIntervention)).getValue();
        await projectRepository.save({
          ...existingProject,
          interventionIds: [interventionInProject.id]
        });

        // find projet
        const allProjectFindOptions = ProjectFindOptions.create({
          criterias: {}
        }).getValue();
        let allProjects = await projectRepository.findAll(allProjectFindOptions);
        assert.isNotEmpty(allProjects);

        // Run import with interventions to delete
        const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
        const dataToDeleteProps: IInterventionSEHeaders = {
          ...interventionToImportProps,
          dateMAJProjet,
          codePhase: NEXO_CODE_PHASE_CANCELED
        } as IInterventionSEHeaders;
        const datasDelete = [getInterventionSERowHeaders(dataToDeleteProps)];

        // Check if interventions exist before import
        const interventionsToUpdateFindOptions = InterventionFindOptions.create({
          criterias: {
            nexoReferenceNumber: datasDelete.map(data => appUtils.lowerizeObjectKeys(data).noDossierSE)
          }
        }).getValue();
        const existingInterventions = await interventionRepository.findAll(interventionsToUpdateFindOptions);
        assert.isNotEmpty(existingInterventions);
        assert.strictEqual(existingInterventions.length, 1);

        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datasDelete);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        // Run use case
        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());

        // Search for existing interventions after update
        const existingInterventionsAfterUpdate = await interventionRepository.findAll(interventionsToUpdateFindOptions);
        assert.isEmpty(existingInterventionsAfterUpdate);

        // The project was deleted
        allProjects = await projectRepository.findAll(allProjectFindOptions);
        assert.isEmpty(allProjects);
      });
    });

    describe(`Interventions Assets handling`, () => {
      const NEXO_DOSSIER = 'NEXO_DOSSIER';
      let datas: IInterventionSEHeaders[];

      const commonValues: Partial<IInterventionSEHeaders> = {
        noDossierSE: NEXO_DOSSIER,
        codePhase: '2',
        codeExecutant: '2',
        carnet: '',
        codeActif: '1',
        codeTravaux: '3',
        anneeDebutTravaux: 2021,
        anneeFinTravaux: 2021
      };
      // 3 interventions with same codeTravaux and same codeActif
      const row1: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        geom: geom1,
        comparaison: 'ComparaisonIdRow1',
        iDActif: 'iDActifRow1'
      };
      const row2: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        geom: geom2,
        comparaison: 'ComparaisonIdRow2',
        iDActif: 'iDActifRow2'
      };
      const row3: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        geom: geom3,
        comparaison: 'ComparaisonIdRow3',
        iDActif: 'iDActifRow3'
      };
      beforeEach(async () => {
        // Run first import
        datas = [
          getInterventionSERowHeaders(row1),
          getInterventionSERowHeaders(row2),
          getInterventionSERowHeaders(row3)
        ];
        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());
      });

      // UPDATE WITH ONE ROW
      const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
      [
        {
          description: `one asset is removed`,
          datas: [
            getInterventionSERowHeaders({
              ...row2,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            }),
            getInterventionSERowHeaders({
              ...row1,
              dateMAJProjet
            }),
            getInterventionSERowHeaders({
              ...row3,
              dateMAJProjet
            })
          ],
          remainingAssetsGeom: [geom1, geom3],
          interventionslogResults: [ModificationType.DELETION]
        },
        {
          description: `two assets are removed, one is added`,
          datas: [
            getInterventionSERowHeaders({
              ...row1,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            }),
            getInterventionSERowHeaders({
              ...row2,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            }),
            getInterventionSERowHeaders({
              ...row3,
              dateMAJProjet,
              geom: geom4
            })
          ],
          remainingAssetsGeom: [geom3, geom4],
          interventionslogResults: [ModificationType.DELETION, ModificationType.DELETION, ModificationType.MODIFICATION]
        }
      ].forEach(test => {
        it(`should update intervention and ${test.description}`, async () => {
          // After first import, there should be only one intervention created with 3 assets
          const allInterventionsFindOptions = InterventionFindOptions.create({
            criterias: {
              status: enumValues(InterventionStatus)
            }
          }).getValue();
          const interventionCreated = await interventionRepository.findOne(allInterventionsFindOptions);
          assert.isDefined(interventionCreated, `Intervention was created`);
          assert.strictEqual(interventionCreated.assets.length, 3);

          // init another import
          nexoImportLog = (
            await nexoImportLogRepository.save(
              getNexoImportLog({
                status: NexoImportStatus.PENDING
              })
            )
          ).getValue();

          // Run import with interventions to cancel
          sandbox.restore();

          const xlxsfile2 = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, test.datas);
          // Replace the stub
          stubDownload(Result.ok(getStorageGetResponse(xlxsfile2.buffer)));

          const resultCancel = await startNexoImportUseCase.execute({
            id: nexoImportLog.id
          });

          // give it a delay due to fire and forget
          await appUtils.delay(NEXO_DELAY);
          assert.isTrue(resultCancel.isRight());

          const interventionUpdated = await interventionRepository.findOne(allInterventionsFindOptions);
          assert.isDefined(interventionUpdated, `Intervention was updated`);
          assert.isTrue(interventionUpdated.assets.map(a => a.geometry).every(() => test.remainingAssetsGeom));
          assert.notEqual(interventionUpdated.annualDistribution, interventionCreated.annualDistribution);

          const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
          const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
          // check that interventions were added to importLog
          const importLogInterventions = fileImported.interventions;
          assert.isTrue(importLogInterventions.map(i => i.modificationType).every(() => test.interventionslogResults));
        });
      });
    });

    // TODO BUGFIX https://jira.montreal.ca/browse/APOC-7311
    describe(`Cancel interventions`, () => {
      const NEXO_DOSSIER = 'NEXO_DOSSIER';
      const NEXO_COMPARAISON_1 = 'NEXO_COMPARAISON_1';
      const NEXO_COMPARAISON_2 = 'NEXO_COMPARAISON_2';
      const NEXO_COMPARAISON_3 = 'NEXO_COMPARAISON_3';
      let datas: IInterventionSEHeaders[];

      const commonValues: Partial<IInterventionSEHeaders> = {
        noDossierSE: NEXO_DOSSIER,
        codePhase: '2',
        codeExecutant: '2',
        carnet: '',
        codeActif: '1',
        codeTravaux: '3'
      };
      const row1: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        geom: geom1,
        anneeDebutTravaux: 2021,
        anneeFinTravaux: 2022,
        comparaison: NEXO_COMPARAISON_1
      };
      const row2: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        geom: geom2,
        anneeDebutTravaux: 2022,
        anneeFinTravaux: 2023,
        codeTravaux: '1',
        comparaison: NEXO_COMPARAISON_2
      };
      const row3: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        geom: geom3,
        anneeDebutTravaux: 2020,
        anneeFinTravaux: 2020,
        codeActif: '9',
        comparaison: NEXO_COMPARAISON_3
      };
      beforeEach(async () => {
        // Run first import
        datas = [
          getInterventionSERowHeaders(row1),
          getInterventionSERowHeaders(row2),
          // Project do not exists, not di not pni
          getInterventionSERowHeaders(row3)
        ];
        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());
      });

      // CANCEL INTERVENTIONS
      const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
      [
        {
          description: `1 intervention cancelled`,
          datas: [
            getInterventionSERowHeaders({
              ...row2,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            })
          ],
          remainingInterventions: 2,
          remainingAnnualPeriods: 3
        },
        {
          description: `all interventions cancelled`,
          datas: [
            getInterventionSERowHeaders({
              ...row1,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            }),
            getInterventionSERowHeaders({
              ...row2,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            }),
            getInterventionSERowHeaders({
              ...row3,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            })
          ],
          remainingInterventions: 0,
          remainingAnnualPeriods: 0
        }
      ].forEach(test => {
        it(`should delete intervention and update a project when ${test.description}`, async () => {
          // find projet
          const projectFindOptions = ProjectFindOptions.create({
            criterias: {
              nexoReferenceNumber: [NEXO_DOSSIER],
              status: enumValues(ProjectStatus)
            }
          }).getValue();
          let allProjects = await projectRepository.findAll(projectFindOptions);
          const foundProject = allProjects.find(p => p);
          assert.strictEqual(foundProject.interventionIds.length, datas.length);

          // init another import
          nexoImportLog = (
            await nexoImportLogRepository.save(
              getNexoImportLog({
                status: NexoImportStatus.PENDING
              })
            )
          ).getValue();

          // Run import with interventions to delete
          sandbox.restore();

          const xlxsfile2 = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, test.datas);
          // Replace the stub
          stubDownload(Result.ok(getStorageGetResponse(xlxsfile2.buffer)));

          const resultCancel = await startNexoImportUseCase.execute({
            id: nexoImportLog.id
          });

          // give it a delay due to fire and forget
          await appUtils.delay(NEXO_DELAY);
          assert.isTrue(resultCancel.isRight());

          allProjects = await projectRepository.findAll(projectFindOptions);
          const foundUpdatedProject = allProjects.find(p => p);
          if (test.remainingInterventions === 0) {
            // Project was deleted
            assert.isUndefined(foundUpdatedProject);
          } else {
            assert.strictEqual(foundUpdatedProject.interventionIds.length, test.remainingInterventions);
            assert.strictEqual(
              foundUpdatedProject.annualDistribution.annualPeriods.length,
              test.remainingAnnualPeriods
            );
          }

          const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
          const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
          // check that projects were added to importLog
          const importLogProjects = fileImported.projects;
          assert.strictEqual(importLogProjects.length, 1, `should be 1`);
        });
      });
    });

    describe(`Cancel and update`, () => {
      const NEXO_DOSSIER = 'NEXO_DOSSIER';
      let datas: IInterventionSEHeaders[];

      const commonValues: Partial<IInterventionSEHeaders> = {
        noDossierSE: NEXO_DOSSIER,
        codePhase: '2',
        codeExecutant: '2',
        carnet: '',
        codeActif: '1',
        codeTravaux: '3'
      };
      const row1: Partial<IInterventionSEHeaders> = {
        ...commonValues,
        anneeDebutTravaux: appUtils.getCurrentYear(),
        anneeFinTravaux: appUtils.getCurrentYear(),
        geom: geom1,
        comparaison: `addoneinterventionDREgeom1`,
        iDActif: 'ASSET_ID_1'
      };
      beforeEach(async () => {
        // Run first import
        datas = [getInterventionSERowHeaders(row1)];
        const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
        stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());
      });

      const dateMAJProjet = new Date(`${appUtils.getCurrentYear()}-12-31`);
      [
        {
          description: `cancel first and one`,
          datas: [
            getInterventionSERowHeaders({
              ...row1,
              dateMAJProjet,
              codePhase: NEXO_CODE_PHASE_CANCELED
            }),
            getInterventionSERowHeaders({
              ...commonValues,
              geom: geom2,
              dateMAJProjet,
              comparaison: `addoneinterventionDREgeom2`,
              iDActif: 'ASSET_ID_2'
            })
          ],
          remainingInterventions: 1,
          remainingAnnualPeriods: 2
        }
      ].forEach(test => {
        it(`should ${test.description}`, async () => {
          // find projet
          const projectFindOptions = ProjectFindOptions.create({
            criterias: {
              nexoReferenceNumber: [NEXO_DOSSIER],
              status: enumValues(ProjectStatus)
            }
          }).getValue();
          let allProjects = await projectRepository.findAll(projectFindOptions);
          const foundProject = allProjects.find(p => p);
          assert.strictEqual(foundProject.interventionIds.length, datas.length);

          // init another import
          nexoImportLog = (
            await nexoImportLogRepository.save(
              getNexoImportLog({
                status: NexoImportStatus.PENDING
              })
            )
          ).getValue();

          // Run import with interventions to delete
          sandbox.restore();

          const xlxsfile2 = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, test.datas);
          // Replace the stub
          stubDownload(Result.ok(getStorageGetResponse(xlxsfile2.buffer)));

          const resultCancel = await startNexoImportUseCase.execute({
            id: nexoImportLog.id
          });

          // give it a delay due to fire and forget
          await appUtils.delay(NEXO_DELAY);
          assert.isTrue(resultCancel.isRight());

          // There still should be one intervention
          const findInterventionsOptions = InterventionFindOptions.create({
            criterias: {
              nexoReferenceNumber: [NEXO_DOSSIER]
            }
          }).getValue();
          const importedInterventions = await interventionRepository.findAll(findInterventionsOptions);
          assert.strictEqual(importedInterventions.length, test.remainingInterventions);

          allProjects = await projectRepository.findAll(projectFindOptions);
          const foundUpdatedProject = allProjects.find(p => p);
          assert.strictEqual(foundUpdatedProject.interventionIds.length, test.remainingInterventions);
          assert.strictEqual(foundUpdatedProject.annualDistribution.annualPeriods.length, test.remainingAnnualPeriods);

          const executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
          const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
          // check that interventions were added to importLog
          const importLogInterventions = fileImported.interventions;
          assert.lengthOf(importLogInterventions, 2, `should be 2`);
          const interventionsImportedStatus = importLogInterventions.map(iLog => iLog.importStatus);
          const expectedInterventionsImportedStatus = [ModificationType.MODIFICATION, ModificationType.DELETION];
          assert.isTrue(
            interventionsImportedStatus.every(() => expectedInterventionsImportedStatus),
            `should have ${expectedInterventionsImportedStatus.join(',')}, have ${interventionsImportedStatus.join(
              ','
            )}`
          );
          // check that projects were added to importLog
          const importLogProjects = fileImported.projects;
          assert.strictEqual(importLogProjects.length, 1, `should be 1`);
        });
      });
    });
  });
});
