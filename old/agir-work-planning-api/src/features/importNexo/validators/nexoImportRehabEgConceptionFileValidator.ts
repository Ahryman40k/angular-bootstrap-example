import {
  ExternalReferenceType,
  IAsset,
  IEnrichedIntervention,
  NexoImportStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import moment = require('moment');
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { PROGRAM_TYPE_PSR, PROGRAM_TYPE_SSR } from '../../../shared/taxonomies/constants';
import { IKeyAndValue } from '../../../utils/utils';
import { NexoErrorTarget } from '../mappers/nexoErrorsLabels';
import { NexoFileError } from '../models/nexoFileError';
import { RehabEgConceptionRow } from '../models/rows/rehabEgConceptionRow';
import { NexoImportFileValidator } from './nexoImportFileValidator';

export interface IGroupedInterventionsAndRehabEgConceptionRows {
  [key: string]: {
    rows: RehabEgConceptionRow[];
    interventions: IEnrichedIntervention[];
  };
}

export class NexoImportRehabEgConceptionFileValidator {
  public static validateBusinessRules(groupedInterventionsAndRows: IGroupedInterventionsAndRehabEgConceptionRows) {
    for (const noProjet of Object.keys(groupedInterventionsAndRows)) {
      const group = groupedInterventionsAndRows[noProjet];
      NexoImportFileValidator.validateOnlyOneInterventionForRows(group.rows, group.interventions);
      const intervention = group.interventions?.find(x => x);
      NexoImportFileValidator.validateUpdateDateOfRowsForIntervention(group.rows, intervention);
      NexoImportFileValidator.validateProgramOfInterventionForRows(group.rows, intervention, [
        PROGRAM_TYPE_PSR,
        PROGRAM_TYPE_SSR
      ]);
      this.validateAssetsInIntervention(group.rows, intervention);
    }
  }

  private static validateAssetsInIntervention(rows: RehabEgConceptionRow[], intervention: IEnrichedIntervention) {
    for (const row of rows) {
      if (row.status === NexoImportStatus.FAILURE) {
        return;
      }
    }

    // Find in the intervention an asset with id equal to the row's noConduite and a NexoAssetId type
    for (const currentRow of rows) {
      if (!this.findAssetForRow(currentRow, intervention)) {
        for (const row of rows) {
          row.addErrors([
            NexoFileError.create({
              code: ErrorCode.NOT_FOUND,
              target: NexoErrorTarget.ASSET_NOT_IN_INTERVENTION,
              values: {
                value1: currentRow.noConduite
              },
              line: currentRow.lineNumber
            }).getValue()
          ]);
        }
      }
    }
  }

  public static findAssetForRow(row: RehabEgConceptionRow, intervention: IEnrichedIntervention): IAsset {
    return intervention.assets.find(asset =>
      asset.externalReferenceIds.find(
        id => id.value === row.noConduite && id.type === ExternalReferenceType.nexoAssetId
      )
    );
  }

  public static validateSameContractRange(groupedRows: IKeyAndValue<RehabEgConceptionRow[]>) {
    for (const noProjet of Object.keys(groupedRows)) {
      const rows = groupedRows[noProjet];
      let firstRowOfGroup: RehabEgConceptionRow;
      for (const currentRow of rows) {
        if (!firstRowOfGroup) {
          firstRowOfGroup = currentRow;
        } else {
          if (firstRowOfGroup.plageContrat !== currentRow.plageContrat) {
            for (const row of rows) {
              row.addErrors([
                NexoFileError.create({
                  code: ErrorCode.INCONSISTENCY,
                  target: NexoErrorTarget.PLAGE_CONTRAT,
                  values: {
                    value1: currentRow.plageContrat,
                    value2: firstRowOfGroup.lineNumber
                  },
                  line: currentRow.lineNumber
                }).getValue()
              ]);
            }
          }
        }
      }
    }
  }

  public static validateSameUpdateDate(groupedRows: IKeyAndValue<RehabEgConceptionRow[]>) {
    for (const noProjet of Object.keys(groupedRows)) {
      const rows = groupedRows[noProjet];
      let firstRowOfGroup: RehabEgConceptionRow;
      for (const currentRow of rows) {
        if (!firstRowOfGroup) {
          firstRowOfGroup = currentRow;
        } else {
          if (!moment(firstRowOfGroup.dateMAJ).isSame(moment(currentRow.dateMAJ))) {
            for (const row of rows) {
              row.addErrors([
                NexoFileError.create({
                  code: ErrorCode.INCONSISTENCY,
                  target: NexoErrorTarget.DATE_MAJ_REHAB_CONCEPTION,
                  values: {
                    value1: moment(currentRow.dateMAJ).toISOString(),
                    value2: firstRowOfGroup.lineNumber
                  },
                  line: currentRow.lineNumber
                }).getValue()
              ]);
            }
          }
        }
      }
    }
  }
}
