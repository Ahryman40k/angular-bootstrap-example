import { INexoImportLog, NexoFileType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { omit } from 'lodash';
import { sandbox } from 'sinon';
import { getStorageGetResponse } from '../../../../../tests/utils/stub/storageApiService.stub';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { Result } from '../../../../shared/logic/result';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { appUtils } from '../../../../utils/utils';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportLog } from '../../models/nexoImportLog';
import { IInterventionBudgetSEHeaders } from '../../models/rows/interventionsBudgetSERow';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { startNexoImportUseCase } from '../../useCases/startNexoImport/startNexoImportUseCase';
import {
  assertNexoImportFailure,
  deleteNexoBookTaxonomy,
  getInterventionBudgetSERowHeaders,
  getInterventionSERowHeaders,
  getNexoImportFile,
  getNexoImportLog,
  getNexoXLXSFile,
  insertNexoBookTaxonomy,
  INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID,
  INTERVENTIONS_SE_FILE_STORAGE_ID,
  NEXO_DELAY
} from '../nexoTestHelper';
const sb = sandbox.create();

// tslint:disable:max-func-body-length
describe(`startNexoImportUseCase Budget`, () => {
  let nexoImportLog: NexoImportLog;
  const NEXO_NO_DOSSIER = 'NEXO_NO_DOSSIER';

  const geom1 = `{
    "type": "LineString",
    "coordinates": [[-73.56006771311111, 45.49876714511111], [-73.55963587711111, 45.49922586911111]]
  }`;
  const geom2 = `{
    "type": "LineString",
    "coordinates": [[-73.56006771322222, 45.49876714522222], [-73.55963587722222, 45.49922586922222]]
  }`;

  function getValidInterventionSEXLXSFile() {
    const datas = [
      getInterventionSERowHeaders({
        geom: geom1,
        noDossierSE: NEXO_NO_DOSSIER
      }),
      getInterventionSERowHeaders({
        geom: geom2,
        noDossierSE: NEXO_NO_DOSSIER
      })
    ];
    return getNexoXLXSFile(NexoFileType.INTERVENTIONS_SE, datas);
  }

  function stubDownload(response?: any, success = true) {
    const method = 'get';
    if (!success) {
      sb.stub(storageApiService, method).rejects();
    }
    const stub = sb.stub(storageApiService, method);
    stub
      .withArgs(INTERVENTIONS_SE_FILE_STORAGE_ID)
      .resolves(Result.ok(getStorageGetResponse(getValidInterventionSEXLXSFile().buffer)));
    stub.withArgs(INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID).resolves(response);
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
    sb.restore();
  });

  describe(`Negative`, () => {
    beforeEach(async () => {
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

    it(`should return failure when missing columns`, async () => {
      const datasBudget: IInterventionBudgetSEHeaders[] = [
        getInterventionBudgetSERowHeaders(),
        getInterventionBudgetSERowHeaders()
      ];
      const missingColumns = ['PrevServPro', 'PrevTravaux'];
      const missingDatas = datasBudget.map(data => {
        return omit(data, missingColumns);
      });
      const xlxsfile = getNexoXLXSFile(
        NexoFileType.INTERVENTIONS_BUDGET_SE,
        missingDatas as IInterventionBudgetSEHeaders[]
      );

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
  });
});
