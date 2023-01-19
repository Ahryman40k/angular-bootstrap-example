import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorCodes, IApiError } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get, startsWith } from 'lodash';

export interface IErrorDictionary {
  code: string;
  key: string;
  value: (x: any) => string;
}

export const errorDictionary: IErrorDictionary[] = [
  {
    code: '',
    key: 'Decision endYear must be greater than or equal the startYear',
    value: () => "L'année de fin de la décision doit être plus grande ou égal à l'année de début"
  },
  {
    code: '',
    key: 'Years must be different from the project years.',
    value: () =>
      'Les années de début et de fin de la décision de replanification sont les mêmes que les années du projet.'
  },
  {
    code: '',
    key: 'Project start year must be less or equal to soonest intervention',
    value: () => "L'année de début du projet doit être moins ou égal aux années des interventions"
  },
  {
    code: '',
    key: "The decision is not allowed because its target year is outside the project's start and end years",
    value: () => 'La décision de replanification doit être entre les années de début et de fin du projet'
  },
  {
    code: '',
    key: 'The decision is not allowed, the decision year must be different from the intervention year',
    value: () => "L'année de replanification ne doit pas être la même que l'année de la planification de l'intervention"
  },
  {
    code: '',
    key: 'This annual program already exist',
    value: () => 'Cette programmation existe déjà dans AGIR'
  },
  {
    code: 'BoroughUniqueMTL',
    key: null,
    value: () => "Il n'est pas possible de sélectionner 'Tout Montréal' et un second arrondissement"
  },
  {
    code: 'Duplicate',
    key: null,
    value: () => 'Détection de doublon. Impossible d’effectuer cette opération.'
  },
  {
    code: '',
    key: 'An non-integrated project cannot contain interventions without programs.',
    value: () => 'Un projet non-intégré ne peux contenir une intervention sans programme'
  },
  {
    code: ErrorCodes.ObjectivesKeyCount,
    key: null,
    value: () => `Un carnet ne peut contenir qu'au maximum trois objectifs clés`
  },
  {
    code: ErrorCodes.ProjectServicePriority,
    key: null,
    value: () =>
      `Le requérant est lié à une priorité service du projet qui contient l'intervention. Veuillez enlever la priorité service liée au projet pour pouvoir continuer.`
  },
  {
    code: '',
    key: 'Project geometry is not containing this intervention area',
    value: () => `La zone du projet associé à l'intervention ne contient pas la zone de celle-ci.`
  },
  {
    code: ErrorCodes.InterventionAsset,
    key: `An Asset is not within the intervention geometry`,
    value: () => `Un actif n'est pas contenu dans la géométrie de l'intervention.`
  },
  {
    code: ErrorCodes.ProjectNoDrmNumber,
    key: null,
    value: () => `Tous les projets du carnet de programmation n'ont pas de numéro de drm`
  },
  {
    code: ErrorCodes.ProgramBookProjectTypes,
    key: null,
    value: () => `Un ou plusieurs projets non autorisés existent au carnet, il faut modifier l'autorisation ou enlever le(s)
    projet(s)`
  },
  {
    code: ErrorCodes.ProgramBookBoroughs,
    key: null,
    value: () => `Un ou plusieurs projets non autorisés existent au carnet, il faut modifier le(s) arrondissement(s) ou enlever le(s)
    projet(s)`
  },
  {
    code: ErrorCodes.InvalidStatus,
    key: 'Some assets are already in interventions having incorrect status',
    value: x => {
      const splittedMessage = x.split(':');
      return `Certains actifs sont contenu dans d'autres interventions:${splittedMessage[splittedMessage.length - 1]}`;
    }
  },
  {
    code: ErrorCodes.ProjectStartYear,
    key: null,
    value: () => `L'année de début fournie doit être plus grande ou égale à l'année civile actuelle.`
  },
  {
    code: '',
    key: "Project on valid submission can't be removed",
    value: () => 'Il est impossible de prendre cette décision car le projet appartient à une soumission valide.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  public getClientMessage(error: Error): string {
    if (!navigator.onLine) {
      return 'No Internet Connection';
    }
    return error.message ? error.message : error.toString();
  }

  public getClientStack(error: Error): string {
    return error.stack;
  }

  public getServerMessages(error: HttpErrorResponse): string[] {
    const errorDetails = this.getServerErrorDetails(error);
    if (errorDetails) {
      return errorDetails.map(e => this.findInDictionary(e.code, e.message));
    }
    const errorMessage = get(error, 'error.error.message');
    if (errorMessage) {
      return [this.findInDictionary(null, errorMessage)];
    }
    return [this.findInDictionary(null, error.message)];
  }

  public getServerErrorDetails(error: HttpErrorResponse): IApiError[] {
    return get(error, 'error.error.details') || get(error, 'error.error.target');
  }

  public getServerStack(error: HttpErrorResponse): string {
    // handle stack trace
    return 'stack';
  }

  public findErrorByCode(code: string): IErrorDictionary {
    return errorDictionary.find(err => err.code === code);
  }

  public findInDictionary(code: string, errorMessage: string): string {
    return (
      errorDictionary.find(x => (x.key ? startsWith(errorMessage, x.key) : x.code === code))?.value(errorMessage) ||
      'Une erreur est survenue'
    );
  }
}
