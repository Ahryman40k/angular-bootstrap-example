import {
  InterventionExternalReferenceType,
  NexoFileType,
  NexoImportStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as sinon from 'sinon';

import { configs } from '../../../../../config/configs';
import { createEnrichedInterventionModel } from '../../../../../scripts/load_data/outils/interventionDataOutils';
import { getStorageGetResponse } from '../../../../../tests/utils/stub/storageApiService.stub';
import { destroyDBTests, NOT_FOUND_UUID } from '../../../../../tests/utils/testHelper';
import { Result } from '../../../../shared/logic/result';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { AuthorizedDateFormats, TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { appUtils } from '../../../../utils/utils';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportLog } from '../../models/nexoImportLog';
import { IInterventionSEHeaders, NO_DOSSIER_SE } from '../../models/rows/interventionsSERow';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { startNexoImportUseCase } from '../../useCases/startNexoImport/startNexoImportUseCase';
import {
  deleteNexoBookTaxonomy,
  getInterventionSERowHeaders,
  getNexoImportFile,
  getNexoImportLog,
  getNexoXLXSFile,
  insertNexoBookTaxonomy,
  NEXO_DELAY
} from '../nexoTestHelper';

const sandbox = sinon.createSandbox();

// tslint:disable:max-func-body-length
describe(`startNexoImportUseCase Validations`, () => {
  let nexoImportLog: NexoImportLog;

  function stubImportFile(rowsData: IInterventionSEHeaders[]) {
    const xlxsfile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, rowsData);
    stubDownload(Result.ok(getStorageGetResponse(xlxsfile.buffer)));
  }

  function stubDownload(response?: any, success = true) {
    const method = 'get';
    if (!success) {
      sandbox.stub(storageApiService, method).rejects();
    }
    sandbox.stub(storageApiService, method).resolves(response);
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

  describe(`Validations`, () => {
    const DESC_PLACEHOLDER = 'descriptifPlaceHolder';

    beforeEach(async () => {
      const nexoImportFile = getNexoImportFile({
        interventions: [],
        projects: []
      });
      nexoImportLog = getNexoImportLog({
        status: NexoImportStatus.PENDING,
        files: [nexoImportFile]
      });
      nexoImportLog = (await nexoImportLogRepository.save(nexoImportLog)).getValue();
    });

    it(`importRevisionDate VS dateMAJProjet`, async () => {
      const nexoReferenceNumber = NO_DOSSIER_SE;
      const oneWeekAgo = MomentUtils.subtract(new Date(), 7, TimeUnits.DAY);
      const oneMonthAgo = MomentUtils.subtract(new Date(), 1, TimeUnits.MONTH);

      // Create an already imported intervention
      const existingIntervention = createEnrichedInterventionModel({
        externalReferenceIds: [
          {
            type: InterventionExternalReferenceType.nexoReferenceNumber,
            value: nexoReferenceNumber
          }
        ],
        importRevisionDate: oneWeekAgo.toISOString()
      });
      await interventionRepository.save(existingIntervention);

      const invalidAlreadyImportedDate: IInterventionSEHeaders = getInterventionSERowHeaders({
        noDossierSE: nexoReferenceNumber,
        comparaison: nexoReferenceNumber, // is file.intervention.id
        dateMAJProjet: new Date(MomentUtils.format(oneMonthAgo, AuthorizedDateFormats.MILLISECONDS_WITH_SPACE))
      });

      const datas: IInterventionSEHeaders[] = [invalidAlreadyImportedDate];
      stubImportFile(datas);

      const result = await startNexoImportUseCase.execute({
        id: nexoImportLog.id
      });
      // give it a delay due to fire and forget
      await appUtils.delay(NEXO_DELAY);
      assert.isTrue(result.isRight());

      const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
        await nexoImportLogRepository.findById(nexoImportLog.id)
      );
      assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
      const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
      assert.strictEqual(fileImported.interventions.length, datas.length, `should be ${datas.length}`);
      const failedIntervention = fileImported.interventions.find(
        intervention => intervention.id === nexoReferenceNumber
      );
      assert.strictEqual(
        failedIntervention.importStatus,
        NexoImportStatus.FAILURE,
        `should be ${NexoImportStatus.FAILURE}`
      );
      assert.strictEqual(
        failedIntervention.description,
        `"La mise à jour de l’intervention (ligne 1 - col I) n’a pas été mise à jour dans AGIR. L’intervention AGIR est déjà à jour selon l’info que l’on retrouve dans NEXO."`
      );
    });

    [
      {
        description: `Nexo asset type does not match an agir assetType`,
        rowData: {
          codeActif: NOT_FOUND_UUID
        },
        expectedError: {
          description: `La correspondance avec un type d’actif AGIR n’existe pas pour ce code NEXO: ${NOT_FOUND_UUID} (col S) Descriptif: Aqueduc (col T). Veuillez définir la correspondance dans l’onglet Type d’actif`
        }
      }
    ].forEach(test => {
      it(`Validate assets - ${test.description}`, async () => {
        const datas: IInterventionSEHeaders[] = [
          getInterventionSERowHeaders(),
          getInterventionSERowHeaders(test.rowData)
        ];
        stubImportFile(datas);

        sandbox.stub(configs, 'nexoImport').value({
          assets: {
            limit: 1
          }
        });

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());

        const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
          await nexoImportLogRepository.findById(nexoImportLog.id)
        );
        assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);

        // TODO when successful mapping to interventions is done
        // First intervention row is successful with an asset
        // const firstRow

        // second row should failed
        const failedRow = fileImported.interventions.find(intervention => intervention.lineNumber === 2);
        assert.isDefined(failedRow, `failed row should exists`);
        assert.strictEqual(failedRow.importStatus, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        assert.strictEqual(failedRow.description, `"${test.expectedError.description}"`);
      });
    });

    [
      {
        columns: ['NoDossierSE']
      },
      {
        columns: ['UniteResponsable']
      },
      {
        columns: ['Arrondissement']
      },
      {
        columns: ['CodeActif']
      },
      {
        columns: ['CodeTravaux']
      },
      {
        columns: ['CodeExecutant']
      },
      {
        columns: ['AnneeDebutTravaux']
      },
      {
        columns: ['AnneeFinTravaux']
      },
      {
        columns: ['DateMAJProjet']
      },
      {
        columns: ['Comparaison']
      },
      {
        columns: ['Geom']
      },
      {
        columns: [
          'NoDossierSE',
          'UniteResponsable',
          'Arrondissement',
          'CodeActif',
          'CodeTravaux',
          'CodeExecutant',
          'AnneeDebutTravaux',
          'AnneeFinTravaux',
          'DateMAJProjet',
          'Comparaison',
          'Geom'
        ]
      }
    ].forEach(test => {
      it(`Invalid line when ${test.columns.join(',')} value is null`, async () => {
        const rowData = getInterventionSERowHeaders();
        for (const column of test.columns) {
          rowData[column] = undefined;
        }
        stubImportFile([rowData]);

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());

        const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
          await nexoImportLogRepository.findById(nexoImportLog.id)
        );
        assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
        const failedRow = fileImported.interventions.find(intervention => intervention);
        assert.isDefined(failedRow, `failed row should exists`);
        assert.strictEqual(failedRow.importStatus, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        // If multiple missing columns, check if error includes column name due to order
        if (test.columns.length > 1) {
          for (const column of test.columns) {
            assert.isTrue(failedRow.description.includes(column));
          }
        } else {
          const expectedError = `"Certains éléments obligatoires sont manquants. Colonne(s): ${test.columns.join(
            ','
          )}"`;
          assert.strictEqual(failedRow.description, expectedError);
        }
      });
    });

    [
      {
        nexoType: {
          column: 'codeTravaux',
          value: '0',
          description: 'Travaux'
        },
        expectedError: `La correspondance avec un type travaux AGIR n’existe pas pour ce code NEXO: 0 (col U) Descriptif: ${DESC_PLACEHOLDER} (col V). Veuillez définir la correspondance dans l’onglet Type travaux`
      },
      {
        nexoType: {
          column: 'uniteResponsable',
          value: 'invalidUnit',
          description: 'none'
        },
        expectedError: `La correspondance avec un requérant AGIR n’existe pas pour ce code NEXO: invalidUnit (col J). Veuillez définir la correspondance dans l’onglet Requérant`
      },
      {
        nexoType: {
          column: 'codeActif',
          value: 'invalidAsset',
          description: 'Actif'
        },
        expectedError: `La correspondance avec un type d’actif AGIR n’existe pas pour ce code NEXO: invalidAsset (col S) Descriptif: ${DESC_PLACEHOLDER} (col T). Veuillez définir la correspondance dans l’onglet Type d’actif`
      },
      {
        nexoType: {
          column: 'codeExecutant',
          value: 'invalidExecutor',
          description: 'Executant'
        },
        expectedError: `La correspondance avec un exécutant AGIR n’existe pas pour ce code NEXO: invalidExecutor (col Y) Descriptif: ${DESC_PLACEHOLDER} (col Z). Veuillez définir la correspondance dans l’onglet Exécutant`
      },
      {
        nexoType: {
          column: 'arrondissement',
          value: 'invalidBorough',
          description: 'none'
        },
        expectedError: `La correspondance avec un arrondissement AGIR n'existe pas pour cette valeur NEXO: invalidBorough (col L). Veuillez définir la correspondance dans l'onglet Arrondissement.`
      },
      {
        nexoType: {
          column: 'carnet',
          value: 'invalidNexoBookCode',
          description: `Réhabilitation aqueduc ${appUtils.getCurrentYear()} DI`
        },
        expectedError: `La correspondance avec un programme AGIR n’existe pas pour ce code NEXO: invalidNexoBookCode (col AD) Descriptif: Réhabilitation aqueduc ${appUtils.getCurrentYear()} DI (col AE) Veuillez définir la correspondance dans l’onglet Programme.`
      }
    ].forEach(test => {
      it(`Invalid row when nexo type ${test.nexoType.column} do not match taxonomy`, async () => {
        const rowData = getInterventionSERowHeaders({
          [test.nexoType.column]: test.nexoType.value
        });
        stubImportFile([rowData]);

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());

        const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
          await nexoImportLogRepository.findById(nexoImportLog.id)
        );
        assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
        const failedRow = fileImported.interventions.find(intervention => intervention);
        assert.isDefined(failedRow, `failed row should exists`);
        assert.strictEqual(failedRow.importStatus, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        const expectedError = test.expectedError.replace(DESC_PLACEHOLDER, rowData[test.nexoType.description]);
        assert.strictEqual(failedRow.description, `"${expectedError}"`);
      });
    });

    it(`Invalid line when nexo codeTravaux and codeActif matching AGIR taxonomies labels do not match`, async () => {
      const rowData = getInterventionSERowHeaders({
        codeTravaux: '2', // rehabilitation
        codeActif: '7' // pumpingStation
      });
      stubImportFile([rowData]);

      const result = await startNexoImportUseCase.execute({
        id: nexoImportLog.id
      });
      // give it a delay due to fire and forget
      await appUtils.delay(NEXO_DELAY);
      assert.isTrue(result.isRight());

      const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
        await nexoImportLogRepository.findById(nexoImportLog.id)
      );
      assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
      const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
      const failedRow = fileImported.interventions.find(intervention => intervention);
      assert.isDefined(failedRow, `failed row should exists`);
      assert.strictEqual(failedRow.importStatus, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
      const expectedError = `Cette nature des travaux AGIR Réhabilitation n’est pas valide pour ce type d’actif PumpingStation dans AGIR. Veuillez contacter l’administrateur de AGIR.`;
      assert.strictEqual(failedRow.description, `"${expectedError}"`);
    });

    it(`Datas between two rows of same noDossier do not match`, async () => {
      const datas = [
        getInterventionSERowHeaders({
          rue: 'de chambly',
          anneeDebutTravaux: appUtils.getCurrentYear()
        }),
        getInterventionSERowHeaders({
          rue: 'de pas chambly',
          anneeDebutTravaux: appUtils.getCurrentYear() + 1
        })
      ];
      stubImportFile(datas);

      const result = await startNexoImportUseCase.execute({
        id: nexoImportLog.id
      });
      // give it a delay due to fire and forget
      await appUtils.delay(NEXO_DELAY);
      assert.isTrue(result.isRight());

      nexoImportLog = await nexoImportLogRepository.findById(nexoImportLog.id);
      const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(nexoImportLog);
      assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
      const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
      const failedRow = fileImported.interventions.find(intervention => intervention);
      assert.isDefined(failedRow, `failed row should exists`);
      assert.strictEqual(failedRow.importStatus, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
      const expectedError = `Certains éléments censés être identiques avec les autres entrées du même dossier sont différents. Colonne(s) : Rue,AnneeDebutTravaux`;
      assert.strictEqual(failedRow.description, `"${expectedError}"`);
    });

    [
      {
        description: `invalid date format`,
        rowData: {
          dateMAJProjet: new Date('20180506')
        },
        error: `Le format de la date est invalide à la ligne 1, should be ${AuthorizedDateFormats.MILLISECONDS_WITH_SPACE}`
      },
      {
        description: `invalid geometry`,
        rowData: {
          geom: `{
            "type": "wrongType",
            "coordinates": [-999, 999]
          }`
        },
        error: `La géométrie fournie à la ligne 1 n'est pas une géométrie GeoJSON valide.`
      }
    ].forEach(test => {
      it(`Invalid line when ${test.description}`, async () => {
        const rowData = getInterventionSERowHeaders({
          ...test.rowData
        });
        stubImportFile([rowData]);

        const result = await startNexoImportUseCase.execute({
          id: nexoImportLog.id
        });
        // give it a delay due to fire and forget
        await appUtils.delay(NEXO_DELAY);
        assert.isTrue(result.isRight());

        const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
          await nexoImportLogRepository.findById(nexoImportLog.id)
        );
        assert.strictEqual(executedImportDTO.status, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        const fileImported = executedImportDTO.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
        const failedRow = fileImported.interventions.find(intervention => intervention);
        assert.isDefined(failedRow, `failed row should exists`);
        assert.strictEqual(failedRow.importStatus, NexoImportStatus.FAILURE, `should be ${NexoImportStatus.FAILURE}`);
        assert.strictEqual(failedRow.description, `"${test.error}"`);
      });
    });
  });
});
