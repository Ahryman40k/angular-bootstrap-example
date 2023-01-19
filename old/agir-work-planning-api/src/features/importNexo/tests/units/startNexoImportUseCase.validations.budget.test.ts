import {
  InterventionStatus,
  NexoFileType,
  NexoImportStatus,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isEmpty } from 'lodash';
import { sandbox } from 'sinon';
import { getStorageGetResponse } from '../../../../../tests/utils/stub/storageApiService.stub';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { Result } from '../../../../shared/logic/result';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { enumValues } from '../../../../utils/enumUtils';
import { appUtils } from '../../../../utils/utils';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportLog } from '../../models/nexoImportLog';
import { IInterventionSEHeaders } from '../../models/rows/interventionsSERow';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { startNexoImportUseCase } from '../../useCases/startNexoImport/startNexoImportUseCase';
import {
  deleteNexoBookTaxonomy,
  getInterventionBudgetSERowHeaders,
  getInterventionSERowHeaders,
  getNexoImportFile,
  getNexoImportLog,
  getNexoXLXSFile,
  insertNexoBookTaxonomy,
  NEXO_DELAY
} from '../nexoTestHelper';

const sb = sandbox.create();

// tslint:disable:max-func-body-length
describe(`startNexoImportUseCase Validations Budget`, () => {
  let nexoImportLog: NexoImportLog;
  const NEXO_NO_DOSSIER = 'NEXO_NO_DOSSIER';
  const NEXO_NO_DOSSIER_NO_MATCH = 'NEXO_NO_DOSSIER_NO_MATCH';
  const NEXO_NO_DOSSIER_OTHER = 'NEXO_NO_DOSSIER_OTHER';
  const INTERVENTIONS_SE_FILE_STORAGE_ID = '6a9b6930-b65e-4080-aa9f-5f0e92c1c225';
  const INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID = 'd8ef51bb-fd1a-478d-88e5-a9aaba7ea00f';

  // ASSETS GEOMETRIES
  const geom1 = `{
    "type": "LineString",
    "coordinates": [[-73.56006771311111, 45.49876714511111], [-73.55963587711111, 45.49922586911111]]
  }`;
  const geom2 = `{
    "type": "LineString",
    "coordinates": [[-73.56006771322222, 45.49876714522222], [-73.55963587722222, 45.49922586922222]]
  }`;

  function getValidInterventionSEXLXSFile(inputData?: Partial<IInterventionSEHeaders[]>) {
    let datas = inputData;
    if (isEmpty(datas)) {
      datas = [
        getInterventionSERowHeaders({
          geom: geom1,
          noDossierSE: NEXO_NO_DOSSIER
        }),
        getInterventionSERowHeaders({
          geom: geom2,
          noDossierSE: NEXO_NO_DOSSIER
        })
      ];
    }
    return getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
  }

  function stubDownload(interventionsSEFile: any, interventionsBudgetSEFile: any) {
    const stub = sb.stub(storageApiService, 'get');
    stub
      .withArgs(INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID)
      .resolves(Result.ok(getStorageGetResponse(interventionsBudgetSEFile.buffer)));
    stub
      .withArgs(INTERVENTIONS_SE_FILE_STORAGE_ID)
      .resolves(Result.ok(getStorageGetResponse(interventionsSEFile.buffer)));
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
    sb.restore();
  });

  describe(`Validations`, () => {
    describe(`AGIR Interventions match`, () => {
      let interventionsSEFile: any;
      beforeEach(async () => {
        // setup interventionsSE file
        interventionsSEFile = getValidInterventionSEXLXSFile([
          getInterventionSERowHeaders({
            geom: geom1,
            noDossierSE: NEXO_NO_DOSSIER,
            carnet: '',
            codeTravaux: '2',
            codeExecutant: '2'
          }),
          getInterventionSERowHeaders({
            geom: geom2,
            noDossierSE: NEXO_NO_DOSSIER,
            carnet: '',
            codeTravaux: '3',
            codeExecutant: '2'
          }),
          getInterventionSERowHeaders({
            geom: geom2,
            noDossierSE: NEXO_NO_DOSSIER_OTHER,
            carnet: '',
            codeTravaux: '3',
            codeExecutant: '2',
            budget: 1000
          })
        ]);

        nexoImportLog = (
          await nexoImportLogRepository.save(
            getNexoImportLog({
              status: NexoImportStatus.PENDING,
              files: [
                getNexoImportFile({
                  type: NexoFileType.INTERVENTIONS_SE,
                  storageId: INTERVENTIONS_SE_FILE_STORAGE_ID
                }),
                getNexoImportFile({
                  type: NexoFileType.INTERVENTIONS_BUDGET_SE,
                  storageId: INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID
                })
              ]
            })
          )
        ).getValue();
      });

      describe(`Negative`, () => {
        [
          {
            description: `no intervention matching in agir`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_NO_MATCH
              })
            ],
            expectedError: {
              description: `La répartition annuelle du budget pour le dossier "${NEXO_NO_DOSSIER_NO_MATCH}" n'a pu être ajoutée dans AGIR puisqu'aucune intervention relative à ce dossier n'existe.`
            }
          },
          {
            description: `more than one intervention matching in agir`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER
              })
            ],
            expectedError: {
              description: `La répartition annuelle du budget pour le dossier "${NEXO_NO_DOSSIER}" n'a pu être ajoutée dans AGIR plusieurs interventions sont attachées à ce dossier.`
            }
          },
          {
            description: `duplicate year for same noDossier`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear()
              }),
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear()
              })
            ],
            expectedError: {
              description: `La répartition annuelle du budget pour le dossier "${NEXO_NO_DOSSIER_OTHER}" n'a pu être ajoutée dans AGIR car l'unicité "Numéro de dossier - Année" n'a pas été respectée pour les années ${appUtils.getCurrentYear()}.`
            }
          },
          {
            description: `given budget superior to intervention global budget`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear(),
                prevTravaux: 100000
              }),
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear() + 1,
                prevTravaux: 100000
              })
            ],
            expectedError: {
              description: `La répartition annuelle du budget pour le dossier "${NEXO_NO_DOSSIER_OTHER}" n'a pu être ajoutée dans AGIR car le budget global est strictement inférieur à la somme des budgets annuels.`
            }
          },
          {
            description: `given budget years are out of intervention range`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear() - 1
              }),
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear() + 2
              })
            ],
            expectedError: {
              description: `La répartition annuelle du budget pour le dossier "${NEXO_NO_DOSSIER_OTHER}" n'a pu être ajoutée dans AGIR car la période de l'intervention ne correspond pas aux années budgétaires.`
            }
          }
        ].forEach(test => {
          it(`Validate budgets interventions rows - ${test.description}`, async () => {
            const interventionsBudgetSEFile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_BUDGET_SE, test.rows);

            stubDownload(interventionsSEFile, interventionsBudgetSEFile);

            const result = await startNexoImportUseCase.execute({
              id: nexoImportLog.id
            });
            // give it a delay due to fire and forget
            await appUtils.delay(NEXO_DELAY + 500);
            assert.isTrue(result.isRight());

            const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
              await nexoImportLogRepository.findById(nexoImportLog.id)
            );
            assert.strictEqual(
              executedImportDTO.status,
              NexoImportStatus.FAILURE,
              `should be ${NexoImportStatus.FAILURE}`
            );
            const fileImported = executedImportDTO.files.find(
              file => file.type === NexoFileType.INTERVENTIONS_BUDGET_SE
            );

            const failedRows = fileImported.interventions.filter(
              intervention => intervention.importStatus === NexoImportStatus.FAILURE
            );
            assert.isNotEmpty(failedRows, `failed rows should exists`);
            failedRows.forEach(failedRow => {
              assert.strictEqual(failedRow.description, `"${test.expectedError.description}"`);
            });
          });
        });
      });

      describe(`Positive`, () => {
        [
          {
            description: `match one and only intervention`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER
              })
            ]
          },
          {
            description: `2 differents years on same noDossierSE`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear()
              }),
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear() + 1
              })
            ]
          },
          {
            description: `total budget is correct`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear(),
                prevTravaux: 50
              }),
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear() + 1,
                prevTravaux: 50
              })
            ]
          },
          {
            description: `given years are in correct range`,
            rows: [
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear()
              }),
              getInterventionBudgetSERowHeaders({
                noDossierSE: NEXO_NO_DOSSIER_OTHER,
                annee: appUtils.getCurrentYear() + 1
              })
            ]
          }
        ].forEach(test => {
          it(`Validate budgets interventions rows - ${test.description}`, async () => {
            const interventionsBudgetSEFile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_BUDGET_SE, test.rows);

            stubDownload(interventionsSEFile, interventionsBudgetSEFile);

            const result = await startNexoImportUseCase.execute({
              id: nexoImportLog.id
            });
            // give it a delay due to fire and forget
            await appUtils.delay(NEXO_DELAY + 500);
            assert.isTrue(result.isRight());

            const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
              await nexoImportLogRepository.findById(nexoImportLog.id)
            );
            assert.strictEqual(
              executedImportDTO.status,
              NexoImportStatus.SUCCESS,
              `should be ${NexoImportStatus.SUCCESS}`
            );
            const fileImported = executedImportDTO.files.find(
              file => file.type === NexoFileType.INTERVENTIONS_BUDGET_SE
            );

            const successRows = fileImported.interventions.filter(
              intervention => intervention.importStatus === NexoImportStatus.SUCCESS
            );
            assert.isNotEmpty(successRows, `success rows should exists`);
            successRows.forEach(successRow => {
              assert.strictEqual(successRow.id, `${NEXO_NO_DOSSIER_OTHER}`);
            });
          });
        });
      });

      describe(`Update interventions with budget`, () => {
        [
          {
            description: `budget is updated`,
            data: {
              noDossierSE: NEXO_NO_DOSSIER_OTHER,
              prevTravaux: 666,
              annee: appUtils.getCurrentYear()
            }
          }
        ].forEach(test => {
          it(`Budget is set on interventions`, async () => {
            const interventionsBudgetSEFile = getNexoXLXSFile(NexoFileType.INTERVENTIONS_BUDGET_SE, [
              getInterventionBudgetSERowHeaders(test.data)
            ]);

            stubDownload(interventionsSEFile, interventionsBudgetSEFile);

            const result = await startNexoImportUseCase.execute({
              id: nexoImportLog.id
            });
            // give it a delay due to fire and forget
            await appUtils.delay(NEXO_DELAY + 500);
            assert.isTrue(result.isRight());

            const executedImportDTO = await nexoImportLogMapperDTO.getFromModel(
              await nexoImportLogRepository.findById(nexoImportLog.id)
            );
            assert.strictEqual(
              executedImportDTO.status,
              NexoImportStatus.SUCCESS,
              `should be ${NexoImportStatus.SUCCESS}`
            );
            const interventions = await interventionRepository.findAll(
              InterventionFindOptions.create({
                criterias: {
                  nexoReferenceNumber: [NEXO_NO_DOSSIER_OTHER],
                  status: enumValues(InterventionStatus)
                }
              }).getValue()
            );

            assert.isNotEmpty(interventions);
            const intervention = interventions.find(i => i);
            // check that for the given year, allowance was set on annualDistribution
            const annualPeriodIntervention = intervention.annualDistribution.annualPeriods.find(
              ap => ap.year === test.data.annee
            );
            assert.strictEqual(annualPeriodIntervention.annualAllowance, test.data.prevTravaux / 1000);

            // Same thing on project
            const projects = await projectRepository.findAll(
              ProjectFindOptions.create({
                criterias: {
                  id: intervention.project.id,
                  status: enumValues(ProjectStatus)
                }
              }).getValue()
            );
            assert.isNotEmpty(projects);
            const project = projects.find(p => p);
            const annualPeriodProject = project.annualDistribution.annualPeriods.find(
              ap => ap.year === test.data.annee
            );
            assert.strictEqual(annualPeriodProject.annualAllowance, test.data.prevTravaux / 1000);
          });
        });
      });
    });
  });
});
