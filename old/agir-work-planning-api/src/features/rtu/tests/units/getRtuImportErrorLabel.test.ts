import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { getRtuImportErrorLabel } from '../../mappers/rtuErrorsLabels';
import { IRtuImportErrorProps, RtuImportError, RtuImportTarget } from '../../models/rtuImportError';

// tslint:disable:max-func-body-length
describe(`getRtuImportErrorLabel`, () => {
  [
    {
      importError: {
        target: RtuImportTarget.PROJECTS,
        code: ErrorCode.INVALID,
        values: {
          value1: 45
        }
      },
      expectedError: `45 projets ont échoué au cours de l'importation.`
    },
    {
      importError: {
        target: RtuImportTarget.SESSION,
        code: ErrorCode.FORBIDDEN,
        values: {}
      },
      expectedError: `L'ouverture de la session auprès de l'API Info-RTU a échoué.`
    },
    {
      importError: {
        target: RtuImportTarget.DATABASE,
        code: ErrorCode.DELETE,
        values: {}
      },
      expectedError: `Une erreur interne s'est produite au cours de la suppression des projets existants.`
    },
    {
      importError: {
        target: RtuImportTarget.DATABASE,
        code: ErrorCode.INSERT_MANY,
        values: {}
      },
      expectedError: `Une erreur s'est produite au cours de l'insertion des projets en base de données.`
    },
    {
      importError: {
        target: RtuImportTarget.PROJECTS,
        code: ErrorCode.EMPTY_LIST,
        values: {}
      },
      expectedError: `Aucun projet Info-RTU n'a été trouvé.`
    },
    {
      importError: {
        target: RtuImportTarget.DATABASE,
        code: ErrorCodes.InvalidInput,
        values: {
          value1: 'testError'
        }
      },
      expectedError: `Une erreur s'est produite au cours de l'insertion du projet en base de données (testError).`
    },
    {
      importError: {
        target: RtuImportTarget.PLACES,
        code: ErrorCodes.InvalidInput,
        values: {}
      },
      expectedError: `Une erreur s'est produite au cours de la conversion des géométries du projet. Certaines géométries du projet semblent être invalides.`
    },
    {
      importError: {
        target: RtuImportTarget.CONTACT,
        code: ErrorCodes.MissingValue,
        values: {}
      },
      expectedError: `La donnée "contact" est manquante.`
    },
    {
      importError: {
        target: RtuImportTarget.AREA_ID,
        code: ErrorCodes.MissingValue,
        values: {}
      },
      expectedError: `La donnée "areaId" est manquante.`
    }
  ].forEach(test => {
    it(`Should generate an error description of error detail with code "${test.importError.code}" on the target "${test.importError.target}"`, async () => {
      const rtuImportError = RtuImportError.create(test.importError as IRtuImportErrorProps).getValue();
      const errorDescription = getRtuImportErrorLabel(rtuImportError);
      assert.equal(errorDescription, test.expectedError);
    });
  });
});
