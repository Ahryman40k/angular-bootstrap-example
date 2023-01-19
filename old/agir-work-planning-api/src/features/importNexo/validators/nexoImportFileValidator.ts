import {
  IEnrichedIntervention,
  IGeometry,
  InterventionExternalReferenceType,
  ITaxonomy,
  ModificationType,
  NexoFileType,
  NexoImportStatus,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { chunk, difference, isEmpty, isEqual, isNil, omit, uniq } from 'lodash';

import { configs } from '../../../../config/configs';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Result } from '../../../shared/logic/result';
import { IDownloadFileResult } from '../../../shared/storage/iStorageService';
import { PROGRAM_TYPE_PAR, PROGRAM_TYPE_SAE } from '../../../shared/taxonomies/constants';
import { MomentUtils } from '../../../utils/moment/momentUtils';
import { IWorkSheet, spreadsheetUtils } from '../../../utils/spreadsheets/spreadsheetsUtils';
import { appUtils, IKeyAndValue } from '../../../utils/utils';
import { Asset } from '../../asset/models/asset';
import { InterventionFindOptions } from '../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../interventions/mongo/interventionRepository';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { NexoErrorTarget } from '../mappers/nexoErrorsLabels';
import { NexoFileError } from '../models/nexoFileError';
import { NexoImportFile } from '../models/nexoImportFile';
import { NexoIntervention } from '../models/nexoIntervention';
import {
  IInterventionBudgetSEHeaders,
  InterventionBudgetSERow,
  minimalInterventionBudgetSE
} from '../models/rows/interventionsBudgetSERow';
import { IInterventionSEHeaders, InterventionSERow, minimalInterventionSE } from '../models/rows/interventionsSERow';
import { minimalNexoRow } from '../models/rows/nexoRow';
import {
  IRehabAqConceptionHeaders,
  minimalRehabAqConceptionRow,
  RehabAqConceptionRow
} from '../models/rows/rehabAqConceptionRow';
import {
  IRehabEgConceptionHeaders,
  minimalRehabEgConceptionRow,
  RehabEgConceptionRow
} from '../models/rows/rehabEgConceptionRow';
import { nexoImportService } from '../nexoImportService';

interface INexoFileFormatValidationResults {
  totalRowCount: number;
  missingColumns: string[];
}

interface INexoMatch {
  code: string;
  description: string;
}

export interface IGroupedInterventionsAndBudgetRows {
  [key: string]: {
    rows: InterventionBudgetSERow[];
    interventions: IEnrichedIntervention[];
  };
}

export const NEXO_CODE_PHASE_CANCELED = '4';
export const NEXO_CODE_STATUS_CARNET_RECEIVED = '3';

export class NexoImportFileValidator {
  public static validateContent(nexoImportFile: NexoImportFile, file: IDownloadFileResult): NexoFileError[] {
    const worksheetResult = spreadsheetUtils.getWorkSheetFromFile(file);
    if (worksheetResult.isFailure) {
      return [
        NexoFileError.create({
          code: ErrorCode.INVALID,
          target: NexoErrorTarget.FILE,
          values: {
            value1: worksheetResult.errorValue()
          }
        }).getValue()
      ];
    }
    const formatResult = this.validateFormat(nexoImportFile, worksheetResult.getValue());
    const errors: NexoFileError[] = [];
    if (formatResult.totalRowCount < 2) {
      errors.push(
        NexoFileError.create({
          code: ErrorCode.EMPTY_FILE,
          target: NexoErrorTarget.ROWS,
          values: {
            value1: formatResult.totalRowCount
          }
        }).getValue()
      );
    }
    if (!isEmpty(formatResult.missingColumns)) {
      errors.push(
        NexoFileError.create({
          code: ErrorCode.MISSING,
          target: NexoErrorTarget.COLUMNS,
          values: {
            value1: formatResult.missingColumns.join(', ')
          }
        }).getValue()
      );
    }

    return errors.filter(err => !isNil(err));
  }

  private static validateFormat(
    nexoImportFile: NexoImportFile,
    worksheet: IWorkSheet
  ): INexoFileFormatValidationResults {
    let headers: string[] = [];
    let totalRowCount = 0;
    const headersResult = spreadsheetUtils.getWorkSheetColumnHeaders(worksheet);
    const rowCountResult = spreadsheetUtils.getWorkSheetNbRows(worksheet);
    if (headersResult.isSuccess) {
      headers = headersResult.getValue();
    }
    if (rowCountResult.isSuccess) {
      totalRowCount = rowCountResult.getValue();
    }
    return {
      totalRowCount,
      missingColumns: difference(this.getExpectedHeaders(nexoImportFile.type), headers)
    };
  }

  public static getExpectedHeaders(nexoImportFileType: NexoFileType): string[] {
    let fileTypeInstance:
      | IInterventionSEHeaders
      | IInterventionBudgetSEHeaders
      | IRehabAqConceptionHeaders
      | IRehabEgConceptionHeaders;
    switch (nexoImportFileType) {
      case NexoFileType.INTERVENTIONS_BUDGET_SE:
        fileTypeInstance = minimalInterventionBudgetSE;
        break;
      case NexoFileType.REHAB_AQ_CONCEPTION:
        fileTypeInstance = minimalRehabAqConceptionRow;
        break;
      case NexoFileType.REHAB_EG_CONCEPTION:
        fileTypeInstance = minimalRehabEgConceptionRow;
        break;
      case NexoFileType.INTERVENTIONS_SE:
      default:
        fileTypeInstance = minimalInterventionSE;
        break;
    }
    const nexoRowKeys = Object.keys(minimalNexoRow);
    return Object.keys(omit(fileTypeInstance, nexoRowKeys)).map(key => appUtils.capitalizeFirstLetter(key));
  }

  public static async validateTaxonomies(interventionsSERows: InterventionSERow[]): Promise<InterventionSERow[]> {
    await this.validateTaxonomiesByNexoType(interventionsSERows);
    await this.validateTaxonomiesMatchWorkTypeAndAssetType(interventionsSERows);
    await this.validateNexoBookProgram(interventionsSERows);
    return interventionsSERows;
  }

  private static async validateTaxonomiesByNexoType(
    interventionsSERows: InterventionSERow[]
  ): Promise<InterventionSERow[]> {
    const taxonomyGroupNexoMatch: IKeyAndValue<IKeyAndValue<string>> = {
      [TaxonomyGroup.workType]: {
        target: NexoErrorTarget.CODE_TRAVAUX,
        description: 'travaux'
      },
      [TaxonomyGroup.requestor]: {
        target: NexoErrorTarget.UNITE_REPONSABLE,
        description: 'none'
      },
      [TaxonomyGroup.assetType]: {
        target: NexoErrorTarget.CODE_ACTIF,
        description: 'actif'
      },
      [TaxonomyGroup.executor]: {
        target: NexoErrorTarget.CODE_EXECUTANT,
        description: 'executant'
      },
      [TaxonomyGroup.borough]: {
        target: NexoErrorTarget.ARRONDISSEMENT,
        description: 'none'
      }
    };

    await Promise.all(
      interventionsSERows.map(async interventionSERow => {
        const missingTaxonomyErrors: NexoFileError[] = [];
        for (const taxonomyGroup of Object.keys(taxonomyGroupNexoMatch)) {
          const nexoCodeValue = interventionSERow[taxonomyGroupNexoMatch[taxonomyGroup].target];
          const taxonomy = await this.findTaxonomyByNexoType(nexoCodeValue, taxonomyGroup as TaxonomyGroup);
          if (!taxonomy) {
            const nexoElements = taxonomyGroupNexoMatch[taxonomyGroup];
            missingTaxonomyErrors.push(
              NexoFileError.create({
                code: ErrorCode.NOT_FOUND,
                target: nexoElements.target,
                values: {
                  value1: interventionSERow[nexoElements.target],
                  value2: interventionSERow[nexoElements.description]
                },
                line: interventionSERow.lineNumber
              }).getValue()
            );
          }
        }
        interventionSERow.addErrors(missingTaxonomyErrors);
      })
    );
    return interventionsSERows;
  }

  private static async validateTaxonomiesMatchWorkTypeAndAssetType(
    interventionsSERows: InterventionSERow[]
  ): Promise<InterventionSERow[]> {
    const [taxonomiesWorkType, taxonomiesAssetType] = await Promise.all(
      [TaxonomyGroup.workType, TaxonomyGroup.assetType].map(group => taxonomyService.getGroup(group))
    );

    return Promise.all(
      interventionsSERows.map(async interventionSERow => {
        const [taxonomyWorkType, taxonomyAssetType] = await Promise.all(
          [
            {
              code: interventionSERow.codeTravaux,
              group: TaxonomyGroup.workType,
              taxonomies: taxonomiesWorkType
            },
            {
              code: interventionSERow.codeActif,
              group: TaxonomyGroup.assetType,
              taxonomies: taxonomiesAssetType
            }
          ].map(e => this.findTaxonomyByNexoType(e.code, e.group, e.taxonomies))
        );

        // Missing taxonomy nexo match is handled by validateTaxonomiesByNexoType, so no worries here
        if (taxonomyWorkType && taxonomyAssetType) {
          // set those values while we have them, they will be used later
          interventionSERow.setAgirWorkTypeId(taxonomyWorkType.code);
          interventionSERow.setAgirAssetTypeId(taxonomyAssetType.code);

          const assetTypeWorkTypes = taxonomyAssetType.properties?.workTypes as string[];
          if (!isEmpty(assetTypeWorkTypes) && !assetTypeWorkTypes.includes(taxonomyWorkType.code)) {
            interventionSERow.addErrors([
              NexoFileError.create({
                code: ErrorCode.INVALID,
                target: NexoErrorTarget.WORK_TYPE_ASSET_TYPE,
                values: {
                  value1: taxonomyWorkType.label.fr,
                  value2: taxonomyAssetType.label.fr
                },
                line: interventionSERow.lineNumber
              }).getValue()
            ]);
          }
        }
        return interventionSERow;
      })
    );
  }

  private static async validateNexoBookProgram(interventionsSERows: InterventionSERow[]): Promise<InterventionSERow[]> {
    const taxonomiesNexoBook = await taxonomyService.getGroup(TaxonomyGroup.nexoBook);
    for (const interventionSERow of interventionsSERows) {
      if (!isEmpty(interventionSERow.carnet)) {
        const nexoBook = taxonomiesNexoBook.find(taxoNexoBook => taxoNexoBook.code === interventionSERow.carnet);
        // is there a program matching anneeDebutTravaux ?
        if (nexoBook && interventionSERow.getProgramId(nexoBook)) {
          continue;
        }
        // nexoBook not found or program not found by year in nexoBook -> error
        interventionSERow.addErrors([
          NexoFileError.create({
            code: ErrorCode.NOT_FOUND,
            target: NexoErrorTarget.NEXO_BOOK,
            values: {
              value1: interventionSERow.carnet,
              value2: interventionSERow.descriptionCarnet
            },
            line: interventionSERow.lineNumber
          }).getValue()
        ]);
      }
    }
    return interventionsSERows;
  }

  public static async validateInterventionsSEBusinessRules(
    interventionsSERows: InterventionSERow[]
  ): Promise<InterventionSERow[]> {
    await Promise.all([
      await NexoImportFileValidator.validateAlreadyImportedInterventions(interventionsSERows),
      await NexoImportFileValidator.validateAssets(interventionsSERows)
    ]);
    return interventionsSERows;
  }

  private static async validateAlreadyImportedInterventions(interventionsSERows: InterventionSERow[]) {
    const filteredImportRows = interventionsSERows.filter(row => row.status !== NexoImportStatus.FAILURE);

    const nexoReferenceNumberChunks = chunk(
      filteredImportRows.map(row => row.noDossierSE),
      configs.nexoImport.dbChunkSize
    );
    for (const nexoReferenceChunk of nexoReferenceNumberChunks) {
      const interventionsFindOptionsResult = InterventionFindOptions.create({
        criterias: {
          nexoReferenceNumber: nexoReferenceChunk
        }
      });
      if (interventionsFindOptionsResult.isFailure) {
        return interventionsFindOptionsResult;
      }
      const interventions = await interventionRepository.findAll(interventionsFindOptionsResult.getValue());

      // No intervention already imported
      if (isEmpty(interventions)) {
        return Result.ok(interventionsSERows);
      }

      for (const existingIntervention of interventions) {
        const rowToImport = filteredImportRows.find(fir =>
          existingIntervention.externalReferenceIds.find(
            externalRef =>
              externalRef.type === InterventionExternalReferenceType.nexoReferenceNumber &&
              externalRef.value === fir.noDossierSE
          )
        );
        if (rowToImport && MomentUtils.lte(rowToImport.dateMAJProjet, existingIntervention.importRevisionDate)) {
          rowToImport.addErrors([
            NexoFileError.create({
              code: ErrorCode.CONFLICT,
              target: NexoErrorTarget.DATE_MAJ_PROJET,
              line: rowToImport.lineNumber
            }).getValue()
          ]);
        }
      }
    }
    return Result.ok(interventionsSERows);
  }

  private static async validateAssets(interventionsSERows: InterventionSERow[]) {
    let filteredImportRows = interventionsSERows.filter(row => row.status !== NexoImportStatus.FAILURE);
    if (isEmpty(filteredImportRows)) {
      return Result.ok(interventionsSERows);
    }

    // Group by assets Types and geometries
    const nexoAssetsTypesAndGeometries: IKeyAndValue<IGeometry[]> = {};
    for (const row of filteredImportRows) {
      const nexoAssetType = `${row.codeActif}`;
      if (nexoAssetType) {
        const geometry = row.geom;
        if (nexoAssetsTypesAndGeometries[nexoAssetType]) {
          nexoAssetsTypesAndGeometries[nexoAssetType].push(geometry);
        } else {
          nexoAssetsTypesAndGeometries[nexoAssetType] = [geometry];
        }
      }
    }
    // build matcher between nexoAssetType and agirAssetType
    const nexoAssetTypeAgirAssetType: IKeyAndValue<ITaxonomy> = {};
    for (const nexoAssetType of Object.keys(nexoAssetsTypesAndGeometries)) {
      const taxonomy = await this.findTaxonomyByNexoType(nexoAssetType, TaxonomyGroup.assetType);
      if (taxonomy) {
        nexoAssetTypeAgirAssetType[nexoAssetType] = taxonomy;
      }
    }

    filteredImportRows = filteredImportRows.filter(row => row.status !== NexoImportStatus.FAILURE);

    for (const interventionRow of filteredImportRows) {
      // no match with agir taxonomy
      if (!Object.keys(nexoAssetTypeAgirAssetType).includes(interventionRow.codeActif)) {
        const errorNotFound = NexoFileError.create({
          code: ErrorCode.NOT_FOUND,
          target: NexoErrorTarget.CODE_ACTIF,
          line: interventionRow.lineNumber,
          values: {
            value1: `${interventionRow.codeActif}`
          }
        }).getValue();
        interventionRow.addErrors([errorNotFound]);
      } else {
        const asset = Asset.create({
          typeId: nexoAssetTypeAgirAssetType[interventionRow.codeActif].code,
          geometry: interventionRow.geom,
          diameter: interventionRow.diametre,
          material: interventionRow.materiau,
          ownerId: nexoAssetTypeAgirAssetType[interventionRow.codeActif].properties?.owners.find((o: string) => o)
        });
        interventionRow.assets.push(asset.getValue());
      }
    }
    return Result.ok(interventionsSERows);
  }

  // THIS METHOD IS USELESS FOR NOW BUT MAY BE KEEPED FOR LATER
  // private static async validateAssets(interventionsSERows: InterventionSERow[]) {
  //   let filteredImportRows = interventionsSERows.filter(row => row.status !== NexoImportStatus.FAILURE);
  //   if (isEmpty(filteredImportRows)) {
  //     return Result.ok(interventionsSERows);
  //   }

  //   // Group by assets Types and assetsIds
  //   const nexoAssetsTypesAndIds: IKeyAndValue<string[]> = {};
  //   for (const row of filteredImportRows) {
  //     const nexoAssetType = `${row.codeActif}`;
  //     if (nexoAssetType) {
  //       const idActif = `${row.iDActif}`;
  //       if (nexoAssetsTypesAndIds[nexoAssetType]) {
  //         nexoAssetsTypesAndIds[nexoAssetType].push(idActif);
  //       } else {
  //         nexoAssetsTypesAndIds[nexoAssetType] = [idActif];
  //       }
  //     }
  //   }

  //   // Check if nexoAssetType matches AGIR assetType
  //   // Build an nexoAssetType + SearchAssetsWorkAreaCommand
  //   // TODO SearchAssetsWorkAreaCommand should be refactored as a common interface for assetSearch
  //   const agirAssetTypesAndIds: IKeyAndValue<ISearchAssetsWorkAreaCommandProps> = {};
  //   for (const nexoAssetType of Object.keys(nexoAssetsTypesAndIds)) {
  //     const taxonomy = await this.findTaxonomyByNexoType(nexoAssetType, TaxonomyGroup.assetType);
  //     agirAssetTypesAndIds[nexoAssetType] = {
  //       assetType: taxonomy.code as AssetType,
  //       assetIds: nexoAssetsTypesAndIds[nexoAssetType]
  //     };
  //   }
  //   filteredImportRows = filteredImportRows.filter(row => row.status !== NexoImportStatus.FAILURE);

  //   const assetResultsByNexoAssetType = await this.fetchAssetsFromWFS(agirAssetTypesAndIds);
  //   for (const interventionRow of filteredImportRows) {
  //     const assetResult = assetResultsByNexoAssetType[interventionRow.codeActif][interventionRow.iDActif];
  //     if (assetResult.isFailure) {
  //       let assetError: NexoFileError | IGuardResult = assetResult.errorValue() as any; // TODO check cast
  //       if (assetError.code === ErrorCode.NOT_FOUND) {
  //         assetError = NexoFileError.create({
  //           code: ErrorCode.NOT_FOUND,
  //           target: NexoErrorTarget.ASSET,
  //           line: interventionRow.lineNumber,
  //           values: {
  //             value1: `${interventionRow.iDActif}`
  //           }
  //         }).getValue();
  //       } else {
  //         // There was an guardError or unexpected error on getAssets
  //         let value1 = `${interventionRow.iDActif}`;
  //         if ((assetError as IGuardResult).message) {
  //           value1 = `${value1} - ${(assetError as IGuardResult).message}`;
  //         } else if ((assetError as any).stack) {
  //           value1 = `${value1} - ${(assetError as any).stack}`;
  //         }
  //         assetError = NexoFileError.create({
  //           code: assetError.code || ErrorCode.UNEXPECTED,
  //           target: assetError.target || NexoErrorTarget.ASSET,
  //           line: interventionRow.lineNumber,
  //           values: {
  //             value1
  //           }
  //         }).getValue();
  //       }
  //       interventionRow.addErrors([assetError]);
  //     } else {
  //       interventionRow.assets.push(assetResult.getValue());
  //     }
  //   }
  //   return Result.ok(interventionsSERows);
  // }

  // private static async fetchAssetsFromWFS(
  //   nexoAssetsTypesAndIds: IKeyAndValue<ISearchAssetsWorkAreaCommandProps>
  // ): Promise<IKeyAndValue<IKeyAndValue<Result<Asset>>>> {
  //   // create an object with nexoAssetType as key
  //   // and each kek has a value like {assetId: Result<Asset>}
  //   // so we can match them with rows
  //   const result: IKeyAndValue<IKeyAndValue<Result<Asset>>> = {};
  //   await Promise.all(
  //     Object.keys(nexoAssetsTypesAndIds).map(async nexoAssetType => {
  //       // PROCEED BY CHUNK
  //       const assetsIdsChunks = chunk(nexoAssetsTypesAndIds[nexoAssetType].assetIds, configs.nexoImport.assets.limit);
  //       for (const assetIds of assetsIdsChunks) {
  //         const assetsResults = await assetService.getAssetsResults({
  //           assetIds,
  //           assetType: nexoAssetsTypesAndIds[nexoAssetType].assetType
  //         });
  //         result[nexoAssetType] = {
  //           ...result[nexoAssetType],
  //           ...assetsResults
  //         };
  //       }
  //     })
  //   );
  //   return result;
  // }

  // check if a given nexoKey matches an existing taxonomy of given group
  public static async findTaxonomyByNexoType(nexoKey: string, group: TaxonomyGroup, taxonomies?: ITaxonomy[]) {
    const taxonomiesList = !isEmpty(taxonomies) ? taxonomies : await taxonomyService.getGroup(group);
    const NEXOMATCHES_KEY = 'nexoMatches';
    const taxonomiesByGroupWithNexoMatch = taxonomiesList.filter(
      taxo => taxo.properties && !isEmpty(taxo.properties[NEXOMATCHES_KEY])
    );
    return taxonomiesByGroupWithNexoMatch.find(taxonomy =>
      taxonomy.properties[NEXOMATCHES_KEY].find((match: INexoMatch) => `${match.code}` === `${nexoKey}`)
    );
  }

  public static isAllInterventionsEquals(interventionSERows: InterventionSERow[]) {
    if (interventionSERows.length > 1) {
      const valuesToCompare = [
        'uniteResponsable',
        'responsable',
        'arrondissement',
        'rue',
        'de',
        'a',
        'codeExecutant',
        'anneeDebutTravaux',
        'anneeFinTravaux',
        'budget',
        'carnet',
        'codeStatutCarnet',
        'dateMAJProjet'
      ];
      const clonedRows = interventionSERows.map(row => {
        const cleanedClone = {};
        valuesToCompare.forEach(key => {
          cleanedClone[key] = row[key];
        });
        return cleanedClone;
      });
      const notEqualValues: string[] = [];
      valuesToCompare.forEach(valueKey => {
        if (
          !clonedRows.every(row => {
            if (row[valueKey] === Object(row[valueKey])) {
              return isEqual(row[valueKey], clonedRows[0][valueKey]);
            }
            return row[valueKey] === clonedRows[0][valueKey];
          })
        ) {
          notEqualValues.push(valueKey);
        }
      });
      if (!isEmpty(notEqualValues)) {
        interventionSERows.forEach(i => {
          i.addErrors([
            NexoFileError.create({
              code: ErrorCode.INVALID,
              target: NexoErrorTarget.COLUMNS,
              values: {
                value1: uniq(notEqualValues.map(v => appUtils.capitalizeFirstLetter(v))).join(',')
              }
            }).getValue()
          ]);
        });
        return false;
      }
    }
    return true;
  }

  public static async validateInterventionsBudgetSEBusinessRules(
    groupedInterventionsAndRows: IGroupedInterventionsAndBudgetRows
  ): Promise<IGroupedInterventionsAndBudgetRows> {
    // then do validation with those couples
    NexoImportFileValidator.validateOnlyOneInterventionByBudgetRow(groupedInterventionsAndRows);
    // Then Validate only still valid rows, filtering is done in functions
    NexoImportFileValidator.validateUniqueYearInRows(groupedInterventionsAndRows);
    NexoImportFileValidator.validateNoExceedingBudget(groupedInterventionsAndRows);
    NexoImportFileValidator.validateYearsInInterventionRange(groupedInterventionsAndRows);
    return groupedInterventionsAndRows;
  }

  public static validateRehabAqConceptionBusinessRules(
    row: RehabAqConceptionRow,
    interventions: IEnrichedIntervention[]
  ) {
    NexoImportFileValidator.validateOnlyOneInterventionForRows([row], interventions);
    const intervention = interventions?.find(x => x);
    NexoImportFileValidator.validateUpdateDateOfRowsForIntervention([row], intervention);
    NexoImportFileValidator.validateProgramOfInterventionForRows([row], intervention, [
      PROGRAM_TYPE_PAR,
      PROGRAM_TYPE_SAE
    ]);
  }

  public static async validateAndMapAssetTypeTaxonomies(
    rows: RehabAqConceptionRow[] | RehabEgConceptionRow[],
    spreadErrors = false
  ) {
    await Promise.all(
      [...rows].map(async row => {
        for (const column of [NexoErrorTarget.TYPE_ACTIF_AMONT, NexoErrorTarget.TYPE_ACTIF_AVAL]) {
          if (!isEmpty(row[column])) {
            const taxonomy = await this.findTaxonomyByNexoType(row[column], TaxonomyGroup.assetType);
            if (!taxonomy) {
              const error = NexoFileError.create({
                code: ErrorCode.NOT_FOUND,
                target: column,
                values: {
                  value1: row[column],
                  value2: column
                },
                line: row.lineNumber
              }).getValue();
              if (spreadErrors) {
                rows.forEach(r => r.addErrors([error]));
              } else {
                row.addErrors([error]);
              }
            } else {
              if (column === NexoErrorTarget.TYPE_ACTIF_AMONT) {
                row.typeActifAmont = taxonomy.code;
              } else if (column === NexoErrorTarget.TYPE_ACTIF_AVAL) {
                row.typeActifAval = taxonomy.code;
              }
            }
          }
        }
      })
    );
  }

  public static validateOnlyOneInterventionForRows(
    rows: RehabAqConceptionRow[] | RehabEgConceptionRow[],
    interventions: IEnrichedIntervention[]
  ) {
    for (const row of rows) {
      if (row.status === NexoImportStatus.FAILURE) {
        return;
      }
    }

    let errorTarget: NexoErrorTarget;
    if (isEmpty(interventions)) {
      errorTarget = NexoErrorTarget.NO_MATCHING_INTERVENTION;
    } else if (interventions.length > 1) {
      errorTarget = NexoErrorTarget.TOO_MANY_INTERVENTIONS;
    }
    if (!isNil(errorTarget)) {
      rows.forEach(row => {
        row.addErrors([
          NexoFileError.create({
            code: ErrorCode.INVALID,
            values: {
              value1: row.noProjet
            },
            target: errorTarget,
            line: row.lineNumber
          }).getValue()
        ]);
      });
    }
  }

  public static validateUpdateDateOfRowsForIntervention(
    rows: RehabAqConceptionRow[] | RehabEgConceptionRow[],
    intervention: IEnrichedIntervention
  ) {
    for (const row of rows) {
      if (row.status === NexoImportStatus.FAILURE) {
        return;
      }
    }

    for (const row of rows) {
      if (MomentUtils.lt(row.dateMAJ, intervention.importRevisionDate)) {
        rows.forEach(r =>
          r.addErrors([
            NexoFileError.create({
              code: ErrorCode.CONFLICT,
              target: NexoErrorTarget.DATE_MAJ_REHAB_CONCEPTION,
              line: row.lineNumber
            }).getValue()
          ])
        );
      }
    }
  }

  public static validateProgramOfInterventionForRows(
    rows: RehabAqConceptionRow[] | RehabEgConceptionRow[],
    intervention: IEnrichedIntervention,
    validProgramIds: string[]
  ) {
    for (const row of rows) {
      if (row.status === NexoImportStatus.FAILURE) {
        return;
      }
    }
    for (const row of rows) {
      if (!validProgramIds.includes(intervention.programId)) {
        rows.forEach(r =>
          r.addErrors([
            NexoFileError.create({
              code: ErrorCode.INVALID,
              target: NexoErrorTarget.PROGRAM_REHAB_CONCEPTION,
              line: row.lineNumber,
              values: {
                value1: intervention.programId,
                value2: validProgramIds
              }
            }).getValue()
          ])
        );
      }
    }
  }

  public static checkForInvalidIntegratedProjectUpdates(projectInterventions: NexoIntervention[]): NexoErrorTarget[] {
    return this.checkForInvalidProjectUpdates(projectInterventions, {
      planificationYearHasChanged: NexoErrorTarget.PI_START_YEAR_HAS_CHANGED,
      endYearHasChanged: NexoErrorTarget.PI_END_YEAR_HAS_CHANGED,
      executorIdHasChanged: NexoErrorTarget.PI_EXECUTOR_HAS_CHANGED,
      requestorIdHasChanged: NexoErrorTarget.PI_REQUESTOR_HAS_CHANGED,
      boroughIdHasChanged: NexoErrorTarget.PI_BOROUGH_HAS_CHANGED
    });
  }

  public static checkForInvalidNonIntegratedProjectUpdates(
    projectInterventions: NexoIntervention[]
  ): NexoErrorTarget[] {
    return this.checkForInvalidProjectUpdates(projectInterventions, {
      planificationYearHasChanged: NexoErrorTarget.PNI_START_YEAR_HAS_CHANGED,
      endYearHasChanged: NexoErrorTarget.PNI_END_YEAR_HAS_CHANGED,
      executorIdHasChanged: NexoErrorTarget.PNI_EXECUTOR_HAS_CHANGED,
      requestorIdHasChanged: NexoErrorTarget.PNI_REQUESTOR_HAS_CHANGED,
      boroughIdHasChanged: NexoErrorTarget.PNI_BOROUGH_HAS_CHANGED,
      workTypeIdHasChanged: NexoErrorTarget.PNI_WORK_TYPE_HAS_CHANGED,
      programIdHasChanged: NexoErrorTarget.PNI_PROGRAM_HAS_CHANGED,
      assetsHasChanged: NexoErrorTarget.PNI_ADD_OR_REMOVE_ASSET
    });
  }

  public static async checkForInvalidUpdates(
    interventions: NexoIntervention[],
    interventionSERows: InterventionSERow[]
  ) {
    const interventionsToUpdate = interventions.filter(
      intervention => intervention.modificationType === ModificationType.MODIFICATION
    );
    const interventionsToDelete = interventions.filter(
      intervention => intervention.modificationType === ModificationType.DELETION
    );

    const sortedByProjectsExistOrNot = await nexoImportService.sortByProjectExisting([
      ...interventionsToUpdate,
      ...interventionsToDelete
    ]);

    const interventionsGroupedByProjectId = appUtils.groupArrayToObject(
      'project.id',
      sortedByProjectsExistOrNot.projectExist.interventions
    );

    sortedByProjectsExistOrNot.projectExist.projects.forEach(project => {
      if (
        !interventionsGroupedByProjectId[project.id]?.some(
          intervention => !interventionsToDelete.includes(intervention)
        )
      ) {
        interventionsGroupedByProjectId[project.id] = [];
      }
    });
    // loop on the projects to check the conditions if we can make the updates for the project and the interventions of the project
    for (const project of sortedByProjectsExistOrNot.projectExist.projects) {
      const projectInterventions = interventionsGroupedByProjectId[project.id];
      const programBookIds = project.annualDistribution?.annualPeriods
        ?.map(item => item.programBookId)
        .filter(item => item);
      let nexoErrorTargets: NexoErrorTarget[] = [];
      if (
        project.projectTypeId === ProjectType.nonIntegrated &&
        [ProjectStatus.preliminaryOrdered, ProjectStatus.finalOrdered].includes(project.status as ProjectStatus)
      ) {
        nexoErrorTargets = NexoImportFileValidator.checkForInvalidNonIntegratedProjectUpdates(projectInterventions);
      } else if (
        this.isMissingInterventions(project.interventionIds, projectInterventions) ||
        (project.projectTypeId !== ProjectType.nonIntegrated && programBookIds && !isEmpty(programBookIds))
      ) {
        nexoErrorTargets = NexoImportFileValidator.checkForInvalidIntegratedProjectUpdates(projectInterventions);
      }

      if (!isEmpty(nexoErrorTargets)) {
        // Some invalid updates have been detected. We need to fail the related entries and remove them from the interventions list.
        projectInterventions.forEach(intervention => {
          const index = interventions.indexOf(intervention, 0);
          interventions.splice(index, 1);

          // find corresponding interventionsSERows by intervention assets external referenceIds and fails them
          const nexoReferenceIds = intervention.assets.map(
            asset =>
              asset.externalReferenceIds.find(
                extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
              ).value
          );
          const matchingInterventionSERows = interventionSERows.filter(
            interventionSERow =>
              nexoReferenceIds.includes(interventionSERow.comparaison) ||
              (interventionSERow.modificationType === ModificationType.DELETION &&
                interventionSERow.agirIntervention?.id === intervention.id)
          );
          const nexoFileErrors = nexoErrorTargets.map(error =>
            NexoFileError.create({
              code: ErrorCode.INVALID,
              target: error
            }).getValue()
          );
          for (const interventionSERow of matchingInterventionSERows) {
            interventionSERow.setModificationType(intervention.modificationType);
            interventionSERow.addErrors(nexoFileErrors);
          }
        });
      }
    }
  }

  private static isMissingInterventions(interventionIds: string[], projectInterventions: NexoIntervention[]): boolean {
    for (const id of interventionIds) {
      if (!projectInterventions.find(intervention => intervention.id === id)) {
        return true;
      }
    }
    return false;
  }
  private static checkForInvalidProjectUpdates(
    nexoInterventions: NexoIntervention[],
    nexoErrorTargets: IKeyAndValue<NexoErrorTarget>
  ): NexoErrorTarget[] {
    const results: NexoErrorTarget[] = [];
    for (const intervention of nexoInterventions) {
      const modificationSummary = intervention.modificationSummary;

      Object.keys(nexoErrorTargets).forEach(key => {
        if (modificationSummary[key] && !results.includes(nexoErrorTargets[key])) {
          results.push(nexoErrorTargets[key]);
        }
      });

      if (results.length === Object.keys(nexoErrorTargets).length) {
        return results;
      }
    }
    return results;
  }

  private static hasInvalidRow(rows: InterventionBudgetSERow[]) {
    return !isEmpty(rows.filter(row => row.status === NexoImportStatus.FAILURE));
  }

  // for each row budget there is only one agir intervention
  private static validateOnlyOneInterventionByBudgetRow(
    groupedInterventionsByNoDossier: IGroupedInterventionsAndBudgetRows
  ) {
    // check that one and only one intervention is found for each noDossierSE
    for (const noDossierSE of Object.keys(groupedInterventionsByNoDossier)) {
      if (NexoImportFileValidator.hasInvalidRow(groupedInterventionsByNoDossier[noDossierSE].rows)) {
        continue;
      }
      let errorTarget: NexoErrorTarget;
      if (isNil(groupedInterventionsByNoDossier[noDossierSE].interventions)) {
        errorTarget = NexoErrorTarget.NO_MATCHING_INTERVENTION_BUDGET_SE;
      }
      if (
        !isNil(groupedInterventionsByNoDossier[noDossierSE].interventions) &&
        groupedInterventionsByNoDossier[noDossierSE].interventions.length > 1
      ) {
        errorTarget = NexoErrorTarget.TOO_MANY_INTERVENTIONS_BUDGET_SE;
      }
      if (!isNil(errorTarget)) {
        // all interventionsBudgetSERow with same noDossierSE are failed
        groupedInterventionsByNoDossier[noDossierSE].rows.forEach(interventionsBudgetSERow => {
          interventionsBudgetSERow.addErrors([
            NexoFileError.create({
              code: ErrorCode.INVALID,
              values: {
                value1: noDossierSE
              },
              target: errorTarget,
              line: interventionsBudgetSERow.lineNumber
            }).getValue()
          ]);
        });
      }
    }
    return Result.ok();
  }

  // for each noDossier, a given "annee" is given once
  private static validateUniqueYearInRows(groupedInterventionsByNoDossier: IGroupedInterventionsAndBudgetRows) {
    // check each year is given once and only once
    for (const noDossierSE of Object.keys(groupedInterventionsByNoDossier)) {
      if (NexoImportFileValidator.hasInvalidRow(groupedInterventionsByNoDossier[noDossierSE].rows)) {
        continue;
      }
      const years = groupedInterventionsByNoDossier[noDossierSE].rows.map(row => row.annee);
      const duplicates = appUtils.findDuplicates(years);
      if (!isEmpty(duplicates)) {
        groupedInterventionsByNoDossier[noDossierSE].rows.forEach(interventionsBudgetSERow => {
          interventionsBudgetSERow.addErrors([
            NexoFileError.create({
              code: ErrorCode.DUPLICATE,
              values: {
                value1: noDossierSE,
                value2: duplicates.join(',')
              },
              target: NexoErrorTarget.ANNEE,
              line: interventionsBudgetSERow.lineNumber
            }).getValue()
          ]);
        });
      }
    }
    return Result.ok();
  }

  // for each noDossier, total prevTravaux do not exceed matching intervention budget
  private static validateNoExceedingBudget(groupedInterventionsByNoDossier: IGroupedInterventionsAndBudgetRows) {
    for (const noDossierSE of Object.keys(groupedInterventionsByNoDossier)) {
      if (NexoImportFileValidator.hasInvalidRow(groupedInterventionsByNoDossier[noDossierSE].rows)) {
        continue;
      }
      const previsionalBudgets = groupedInterventionsByNoDossier[noDossierSE].rows.map(row => row.prevTravaux);
      const totalForRows = previsionalBudgets.reduce((a, b) => a + b, 0);
      // There should be only one intervention
      const intervention = groupedInterventionsByNoDossier[noDossierSE].interventions.find(i => i);
      // estimate allowance is in k$, so convert to $
      if (intervention.estimate.allowance * 1000 < totalForRows) {
        groupedInterventionsByNoDossier[noDossierSE].rows.forEach(interventionsBudgetSERow => {
          interventionsBudgetSERow.addErrors([
            NexoFileError.create({
              code: ErrorCode.INVALID,
              values: {
                value1: noDossierSE
              },
              target: NexoErrorTarget.EXCESSIVE_BUDGET,
              line: interventionsBudgetSERow.lineNumber
            }).getValue()
          ]);
        });
      }
    }
    return Result.ok();
  }

  // for each noDossier, given years must be between or equal to intervention planificationYear and endYear
  private static validateYearsInInterventionRange(groupedInterventionsByNoDossier: IGroupedInterventionsAndBudgetRows) {
    for (const noDossierSE of Object.keys(groupedInterventionsByNoDossier)) {
      if (NexoImportFileValidator.hasInvalidRow(groupedInterventionsByNoDossier[noDossierSE].rows)) {
        continue;
      }
      // There should be only one intervention
      const intervention = groupedInterventionsByNoDossier[noDossierSE].interventions.find(i => i);
      const years = groupedInterventionsByNoDossier[noDossierSE].rows.map(row => row.annee);
      const outOfRangeYears: number[] = [];
      years.forEach(year => {
        if (year < intervention.planificationYear || year > intervention.endYear) {
          outOfRangeYears.push(year);
        }
      });
      if (!isEmpty(outOfRangeYears)) {
        groupedInterventionsByNoDossier[noDossierSE].rows.forEach(interventionsBudgetSERow => {
          interventionsBudgetSERow.addErrors([
            NexoFileError.create({
              code: ErrorCode.INVALID,
              values: {
                value1: noDossierSE,
                value2: outOfRangeYears.join(',')
              },
              target: NexoErrorTarget.OUT_OF_RANGE_YEAR,
              line: interventionsBudgetSERow.lineNumber
            }).getValue()
          ]);
        });
      }
    }
    return Result.ok();
  }
}
