import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get, isEmpty } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { appUtils } from '../../../utils/utils';
import { RtuExportError, RtuExportTarget } from '../models/rtuExportError';
import { RtuImportError, RtuImportTarget } from '../models/rtuImportError';

const value1Placeholder = 'value1';
const DEFAULT = 'default';

export function getRtuImportErrorLabel(rtuImportError: RtuImportError): string {
  let errorDescription: string = get(rtuImportErrorsDescription, `${rtuImportError.code}.${rtuImportError.target}`);

  if (!errorDescription) {
    // Get default
    errorDescription = get(rtuImportErrorsDescription, DEFAULT);
  }

  if (!isEmpty(rtuImportError?.values)) {
    const replacer = {
      ...rtuImportError.values
    };
    errorDescription = appUtils.replaceAll(errorDescription, replacer);
  }

  return errorDescription;
}

export function getRtuExportErrorLabel(rtuExportError: RtuExportError): string {
  let errorDescription: string = get(rtuExportErrorsDescription, `${rtuExportError.code}.${rtuExportError.target}`);
  if (!errorDescription) {
    // Get default
    errorDescription = get(rtuExportErrorsDescription, DEFAULT);
  }

  if (!isEmpty(rtuExportError?.values)) {
    const replacer = {
      ...rtuExportError.values
    };
    errorDescription = appUtils.replaceAll(errorDescription, replacer);
  }

  return errorDescription;
}

const rtuImportErrorsDescription = {
  [ErrorCode.INVALID]: {
    [RtuImportTarget.PROJECTS]: `${value1Placeholder} projets ont échoué au cours de l'importation.`
  },
  [ErrorCode.FORBIDDEN]: {
    [RtuImportTarget.SESSION]: `L'ouverture de la session auprès de l'API Info-RTU a échoué.`
  },
  [ErrorCode.DELETE]: {
    [RtuImportTarget.DATABASE]: `Une erreur interne s'est produite au cours de la suppression des projets existants.`
  },
  [ErrorCode.INSERT_MANY]: {
    [RtuImportTarget.DATABASE]: `Une erreur s'est produite au cours de l'insertion des projets en base de données.`
  },
  [ErrorCode.EMPTY_LIST]: {
    [RtuImportTarget.PROJECTS]: `Aucun projet Info-RTU n'a été trouvé.`
  },
  [ErrorCodes.InvalidInput]: {
    [RtuImportTarget.DATABASE]: `Une erreur s'est produite au cours de l'insertion du projet en base de données (${value1Placeholder}).`,
    [RtuImportTarget.PLACES]: `Une erreur s'est produite au cours de la conversion des géométries du projet. Certaines géométries du projet semblent être invalides.`
  },
  [ErrorCodes.MissingValue]: {
    [RtuImportTarget.CONTACT]: `La donnée "contact" est manquante.`,
    [RtuImportTarget.AREA_ID]: `La donnée "areaId" est manquante.`
  },
  [DEFAULT]: `Une erreur s'est produite`
};

const rtuExportErrorsDescription = {
  [ErrorCodes.InvalidInput]: {
    [RtuExportTarget.GEOMETRY]: `Une erreur interne s'est produite lors de la conversion de la géométrie du projet.`
  },
  [ErrorCode.INVALID]: {
    [RtuExportTarget.PROJECTS]: `${value1Placeholder} projets ont échoué au cours de l'exportation.`
  },
  [ErrorCode.FORBIDDEN]: {
    [RtuExportTarget.SESSION]: `L'ouverture de la session auprès de l'API Info-RTU a échoué.`
  },
  [ErrorCode.UNEXPECTED]: {
    [RtuExportTarget.CONTACT]: `Une erreur s'est produite lors de l'obtention du contact depuis l'API Info-RTU.`,
    [RtuExportTarget.INFO_RTU_API]: `L'ouverture de la session auprès de l'API Info-RTU a échoué.`
  },
  [ErrorCodes.MissingValue]: {
    [RtuExportTarget.FIND_TYPE]: `Absence de correspondance pour la valeur de l'attribut ${value1Placeholder}.`
  },
  [DEFAULT]: `Une erreur s'est produite`
};
