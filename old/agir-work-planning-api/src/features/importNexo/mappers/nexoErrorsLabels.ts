import { ErrorCodes, NexoFileType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { enumValues } from '../../../utils/enumUtils';
import { AuthorizedDateFormats } from '../../../utils/moment/moment.enum';
import { appUtils } from '../../../utils/utils';
import { ContractRange } from '../../designData/models/designData';
import { NexoFileError } from '../models/nexoFileError';
import { Presence } from '../models/rows/rehabEgConceptionRow';

const value1Placeholder = 'value1';
const value2Placeholder = 'value2';
const targetPlaceholder = 'targettarget';
const linePlaceholder = 'lineline';

export enum NexoErrorTarget {
  DEFAULT = 'default',
  FILE = 'file',
  ROWS = 'rows',
  COLUMNS = 'columns',
  TYPE = 'type',
  WORK_TYPE_ASSET_TYPE = 'workTypeAssetType',
  NO_MATCHING_INTERVENTION_BUDGET_SE = 'noMatchingInterventionBudgetSE',
  TOO_MANY_INTERVENTIONS_BUDGET_SE = 'tooManyInterventionsBudgetSE',
  DATE_MAJ_PROJET = 'dateMAJProjet',
  ANNEE = 'annee',
  ASSET = 'asset',
  CODE_ACTIF = 'codeActif',
  CODE_TRAVAUX = 'codeTravaux',
  UNITE_REPONSABLE = 'uniteResponsable',
  CODE_EXECUTANT = 'codeExecutant',
  ARRONDISSEMENT = 'arrondissement',
  NEXO_BOOK = 'nexoBook',
  UNKNOWN = 'unknown',
  EXCESSIVE_BUDGET = 'excessiveBudget',
  OUT_OF_RANGE_YEAR = 'outOfRangeYear',
  GEOM = 'geom',
  PNI_START_YEAR_HAS_CHANGED = 'pniStartYearHasChanged',
  PNI_END_YEAR_HAS_CHANGED = 'pniEndYearHasChanged',
  PNI_EXECUTOR_HAS_CHANGED = 'pniExecutorHasChanged',
  PNI_REQUESTOR_HAS_CHANGED = 'pniRequestorHasChanged',
  PNI_BOROUGH_HAS_CHANGED = 'pniBoroughHasChanged',
  PNI_WORK_TYPE_HAS_CHANGED = 'pniWorkTypeHasChanged',
  PNI_PROGRAM_HAS_CHANGED = 'pniProgramHasChanged',
  PNI_ADD_OR_REMOVE_ASSET = 'pniAddOrRemoveAsset',
  PI_START_YEAR_HAS_CHANGED = 'piStartYearHasChanged',
  PI_END_YEAR_HAS_CHANGED = 'piEndYearHasChanged',
  PI_EXECUTOR_HAS_CHANGED = 'piExecutorHasChanged',
  PI_REQUESTOR_HAS_CHANGED = 'piRequestorHasChanged',
  PI_BOROUGH_HAS_CHANGED = 'piBoroughHasChanged',
  NO_MATCHING_INTERVENTION = 'noMatchingIntervention',
  TOO_MANY_INTERVENTIONS = 'tooManyInterventions',
  DATE_MAJ_REHAB_CONCEPTION = 'dateMAJ',
  PROGRAM_REHAB_CONCEPTION = 'program',
  PLAGE_CONTRAT = 'plageContrat',
  TYPE_ACTIF_AMONT = 'typeActifAmont',
  TYPE_ACTIF_AVAL = 'typeActifAval',
  ASSET_NOT_IN_INTERVENTION = 'assetNotInIntervention',
  NO_PROJET = 'noProjet',
  NO_CONDUITE = 'noConduite',
  INFILTRATION = 'infiltration',
  OBSTRUCTION = 'obstruction'
}

export function getNexoErrorLabel(nexoFileError: NexoFileError) {
  let errorDescription: string = get(nexoErrorsDescription, `${nexoFileError.code}.${nexoFileError.target}`);
  if (!errorDescription) {
    // Get default by code
    errorDescription = get(nexoErrorsDescription, `${nexoFileError.code}.${NexoErrorTarget.DEFAULT}`);
    if (!errorDescription) {
      // Get default
      errorDescription = get(nexoErrorsDescription, NexoErrorTarget.DEFAULT);
    }
  }
  const replacer = {
    ...nexoFileError.values,
    [targetPlaceholder]: nexoFileError.target,
    [linePlaceholder]: `${nexoFileError.line}`
  };

  errorDescription = appUtils.replaceAll(errorDescription, replacer);
  return errorDescription;
}

function getPniChangeErrorMessage(str1: string, str2: string): string {
  return `Une modification ${str1} de l'intervention a été détectée. Or, l'intervention appartient à un projet non-intégré dont le statut est "envoyé préliminaire" ou "envoyé final". Dans ce cas précis, il n'est pas permis de modifier ${str2} de l'intervention via l'import NEXO. Veuillez contacter les planificateurs afin d'effectuer les modifications directement via l'interface AGIR-Planification.`;
}

function getPiChangeErrorMessage(str1: string, str2: string): string {
  return `Une modification ${str1} de l'intervention a été détectée. Or, l'intervention appartient à un projet intégré présent dans un carnet de programmation ou disposant d'autres interventions non fournies par l'import NEXO. Dans ce cas précis, il n'est pas permis de modifier ${str2} de l'intervention via l'import NEXO. Veuillez contacter les planificateurs afin d'effectuer les modifications directement via l'interface AGIR-Planification.`;
}

const nexoErrorsDescription = {
  [ErrorCode.EMPTY_FILE]: {
    [NexoErrorTarget.FILE]: `Le fichier est vide`,
    [NexoErrorTarget.ROWS]: `Le fichier est vide`
  },
  [ErrorCode.MISSING]: {
    [NexoErrorTarget.COLUMNS]: `Les colonnes ${value1Placeholder} sont manquantes`,
    [NexoErrorTarget.DEFAULT]: `${targetPlaceholder} manquant à la ligne ${linePlaceholder}`
  },
  //  export const thisIsA = (str: string) => `This is a ${str}`;
  [ErrorCode.INVALID]: {
    [NexoErrorTarget.TYPE]: `Le premier fichier d'import n'est pas ${NexoFileType.INTERVENTIONS_SE}`,
    [NexoErrorTarget.WORK_TYPE_ASSET_TYPE]: `Cette nature des travaux AGIR ${value1Placeholder} n’est pas valide pour ce type d’actif ${value2Placeholder} dans AGIR. Veuillez contacter l’administrateur de AGIR.`,
    [NexoErrorTarget.COLUMNS]: `Certains éléments censés être identiques avec les autres entrées du même dossier sont différents. Colonne(s) : ${value1Placeholder}`,
    [NexoErrorTarget.NO_MATCHING_INTERVENTION_BUDGET_SE]: `La répartition annuelle du budget pour le dossier "${value1Placeholder}" n'a pu être ajoutée dans AGIR puisqu'aucune intervention relative à ce dossier n'existe.`,
    [NexoErrorTarget.TOO_MANY_INTERVENTIONS_BUDGET_SE]: `La répartition annuelle du budget pour le dossier "${value1Placeholder}" n'a pu être ajoutée dans AGIR plusieurs interventions sont attachées à ce dossier.`,

    [NexoErrorTarget.EXCESSIVE_BUDGET]: `La répartition annuelle du budget pour le dossier "${value1Placeholder}" n'a pu être ajoutée dans AGIR car le budget global est strictement inférieur à la somme des budgets annuels.`,
    [NexoErrorTarget.OUT_OF_RANGE_YEAR]: `La répartition annuelle du budget pour le dossier "${value1Placeholder}" n'a pu être ajoutée dans AGIR car la période de l'intervention ne correspond pas aux années budgétaires.`,
    [NexoErrorTarget.DEFAULT]: `La valeur ${value1Placeholder} est invalide pour ${targetPlaceholder}`,
    [NexoErrorTarget.PNI_START_YEAR_HAS_CHANGED]: getPniChangeErrorMessage("de l'année de début", "l'année de début"),
    [NexoErrorTarget.PNI_END_YEAR_HAS_CHANGED]: getPniChangeErrorMessage("de l'année de fin", "l'année de fin"),
    [NexoErrorTarget.PNI_EXECUTOR_HAS_CHANGED]: getPniChangeErrorMessage("de l'exécutant", "l'exécutant"),
    [NexoErrorTarget.PNI_REQUESTOR_HAS_CHANGED]: getPniChangeErrorMessage('du requérant', 'le requérant'),
    [NexoErrorTarget.PNI_BOROUGH_HAS_CHANGED]: getPniChangeErrorMessage("de l'arrondissement", "l'arrondissement"),
    [NexoErrorTarget.PNI_WORK_TYPE_HAS_CHANGED]: getPniChangeErrorMessage('du type de travaux', 'le type de travaux'),
    [NexoErrorTarget.PNI_PROGRAM_HAS_CHANGED]: getPniChangeErrorMessage('du programme', 'le programme'),
    [NexoErrorTarget.PNI_ADD_OR_REMOVE_ASSET]: getPniChangeErrorMessage('des actifs', 'les actifs'),
    [NexoErrorTarget.PI_START_YEAR_HAS_CHANGED]: getPiChangeErrorMessage("de l'année de début", "l'année de début"),
    [NexoErrorTarget.PI_END_YEAR_HAS_CHANGED]: getPiChangeErrorMessage("de l'année de fin", "l'année de fin"),
    [NexoErrorTarget.PI_EXECUTOR_HAS_CHANGED]: getPiChangeErrorMessage("de l'exécutant", "l'exécutant"),
    [NexoErrorTarget.PI_REQUESTOR_HAS_CHANGED]: getPiChangeErrorMessage('du requérant', 'le requérant'),
    [NexoErrorTarget.PI_BOROUGH_HAS_CHANGED]: getPiChangeErrorMessage("de l'arrondissement", "l'arrondissement"),
    [NexoErrorTarget.NO_MATCHING_INTERVENTION]: `Il n'existe aucune intervention associée au numéro de projet: "${value1Placeholder}".`,
    [NexoErrorTarget.TOO_MANY_INTERVENTIONS]: `Il existe plusieurs interventions associées au numéro de projet: "${value1Placeholder}".`,
    [NexoErrorTarget.PROGRAM_REHAB_CONCEPTION]: `L'identifiant de programme "${value1Placeholder}" de l'intervention associée à la ligne ${linePlaceholder} n’appartient pas aux valeurs acceptées: ${value2Placeholder}.`
  },
  [ErrorCode.CONFLICT]: {
    [NexoErrorTarget.DATE_MAJ_PROJET]: `La mise à jour de l’intervention (ligne ${linePlaceholder} - col I) n’a pas été mise à jour dans AGIR. L’intervention AGIR est déjà à jour selon l’info que l’on retrouve dans NEXO.`,
    [NexoErrorTarget.DATE_MAJ_REHAB_CONCEPTION]: `La mise à jour de l’intervention (ligne ${linePlaceholder}) n’a pas eu lieu, car l’intervention AGIR est déjà à jour selon l’info que l’on retrouve dans NEXO.`
  },
  [ErrorCode.DUPLICATE]: {
    [NexoErrorTarget.ANNEE]: `La répartition annuelle du budget pour le dossier "${value1Placeholder}" n'a pu être ajoutée dans AGIR car l'unicité "Numéro de dossier - Année" n'a pas été respectée pour les années ${value2Placeholder}.`
  },
  [ErrorCode.INCONSISTENCY]: {
    [NexoErrorTarget.PLAGE_CONTRAT]: `La valeur de PlageContrat "${value1Placeholder}" à la ligne ${linePlaceholder} est différente de celle à la ligne ${value2Placeholder} pour un même numéro de projet.`,
    [NexoErrorTarget.DATE_MAJ_REHAB_CONCEPTION]: `La valeur de DateMAJ "${value1Placeholder}" à la ligne ${linePlaceholder} est différente de celle à la ligne ${value2Placeholder} pour un même numéro de projet.`
  },
  [ErrorCode.NOT_FOUND]: {
    [NexoErrorTarget.ASSET]: `L’identifiant de l’actif (${value1Placeholder} (col A) - Actif (col T)) n’existe pas dans la géobase de AGIR. Veuillez contacter l’administrateur de NEXO`,
    [NexoErrorTarget.CODE_ACTIF]: `La correspondance avec un type d’actif AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} (col S) Descriptif: ${value2Placeholder} (col T). Veuillez définir la correspondance dans l’onglet Type d’actif`,
    [NexoErrorTarget.CODE_TRAVAUX]: `La correspondance avec un type travaux AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} (col U) Descriptif: ${value2Placeholder} (col V). Veuillez définir la correspondance dans l’onglet Type travaux`,
    [NexoErrorTarget.UNITE_REPONSABLE]: `La correspondance avec un requérant AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} (col J). Veuillez définir la correspondance dans l’onglet Requérant`,
    [NexoErrorTarget.CODE_EXECUTANT]: `La correspondance avec un exécutant AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} (col Y) Descriptif: ${value2Placeholder} (col Z). Veuillez définir la correspondance dans l’onglet Exécutant`,
    [NexoErrorTarget.ARRONDISSEMENT]: `La correspondance avec un arrondissement AGIR n'existe pas pour cette valeur NEXO: ${value1Placeholder} (col L). Veuillez définir la correspondance dans l'onglet Arrondissement.`,
    [NexoErrorTarget.NEXO_BOOK]: `La correspondance avec un programme AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} (col AD) Descriptif: ${value2Placeholder} (col AE) Veuillez définir la correspondance dans l’onglet Programme.`,
    [NexoErrorTarget.TYPE_ACTIF_AMONT]: `La correspondance avec un type d’actif AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} Descriptif: ${value2Placeholder}. Veuillez définir la correspondance dans l’onglet Type d’actif`,
    [NexoErrorTarget.TYPE_ACTIF_AVAL]: `La correspondance avec un type d’actif AGIR n’existe pas pour ce code NEXO: ${value1Placeholder} Descriptif: ${value2Placeholder}. Veuillez définir la correspondance dans l’onglet Type d’actif`,
    [NexoErrorTarget.ASSET_NOT_IN_INTERVENTION]: `L'intervention associée à la ligne ${linePlaceholder} ne possède pas d'actif correspondant à la valeur de NoConduite (col B): ${value1Placeholder}.`
  },
  [ErrorCodes.MissingValue]: {
    [NexoErrorTarget.COLUMNS]: `Certains éléments obligatoires sont manquants. Colonne(s): ${value1Placeholder}`
  },
  [ErrorCode.UNEXPECTED]: {
    [NexoErrorTarget.UNKNOWN]: `Une erreur s'est produite à la ligne ${linePlaceholder}, ${value1Placeholder}`,
    [NexoErrorTarget.FILE]: `Une erreur s'est produite ${value1Placeholder}`
  },
  [ErrorCodes.InvalidInput]: {
    [NexoErrorTarget.DATE_MAJ_PROJET]: `Le format de la date est invalide à la ligne ${linePlaceholder}, should be ${AuthorizedDateFormats.MILLISECONDS_WITH_SPACE}`,
    [NexoErrorTarget.DATE_MAJ_REHAB_CONCEPTION]: `Le format de la date est invalide à la ligne ${linePlaceholder}, devrait être ${AuthorizedDateFormats.MILLISECONDS_WITH_SPACE}`,
    [NexoErrorTarget.GEOM]: `La géométrie fournie à la ligne ${linePlaceholder} n'est pas une géométrie GeoJSON valide.`,
    [NexoErrorTarget.PLAGE_CONTRAT]: `La valeur de PlageContrat "${value1Placeholder}" de l'intervention associée à la ligne ${linePlaceholder} n’appartient pas aux valeurs acceptées: ${enumValues(
      ContractRange
    )}.`,
    [NexoErrorTarget.NO_PROJET]: `La valeur de NoProjet à la ligne ${linePlaceholder} est manquante.`,
    [NexoErrorTarget.NO_CONDUITE]: `La valeur de NoConduite à la ligne ${linePlaceholder} est manquante.`,
    [NexoErrorTarget.INFILTRATION]: `La valeur d'Infiltration "${value1Placeholder}" de l'intervention associée à la ligne ${linePlaceholder} n’appartient pas aux valeurs acceptées: ${enumValues(
      Presence
    )}.`,
    [NexoErrorTarget.OBSTRUCTION]: `La valeur d'Obstruction "${value1Placeholder}" de l'intervention associée à la ligne ${linePlaceholder} n’appartient pas aux valeurs acceptées: ${enumValues(
      Presence
    )}.`
  },
  [NexoErrorTarget.DEFAULT]: `Une erreur s'est produite à la ligne ${linePlaceholder}`
};
