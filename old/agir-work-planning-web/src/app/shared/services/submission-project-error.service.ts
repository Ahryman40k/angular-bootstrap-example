import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { get } from 'lodash';
import { ErrorHandlerService } from '../errors/error-handler.service';
import { IErrorDictionary } from '../errors/error.service';
import { NotificationsService } from '../notifications/notifications.service';
const enum SubmissionErrorTarget {
  PROJECT_DRM_NUMBER = 'project.drmNumber',
  DRM_NUMBER = 'drmNumber',
  PROJECT_STATUS = 'project.status',
  SUBMISSION_STATUS = 'status',
  PROJECT_SUBMISSION_NUMBER = 'project.submissionNumber',
  SUBMISSION_NUMBER = 'submissionNumber',
  PROGRAM_BOOK = 'programBookId',
  SUBMISSION = 'submission',
  ID = 'id'
}
const errorTraget = 'error.error.target[0]';
export const createSubmissionErrorCodes: IErrorDictionary[] = [
  {
    code: SubmissionErrorTarget.PROJECT_DRM_NUMBER,
    key: '',
    value: () => 'Tous les projets doivent avoir un numéro de drm'
  },
  {
    code: SubmissionErrorTarget.DRM_NUMBER,
    key: '',
    value: () => 'Tous les projets doivent avoir le même numéro de drm'
  },
  {
    code: SubmissionErrorTarget.SUBMISSION_STATUS,
    key: '',
    value: () => 'Les projets ont déja une soumission valide'
  },
  {
    code: SubmissionErrorTarget.SUBMISSION_NUMBER,
    key: '',
    value: () => 'Tous les projets doivent avoir la même soumission Précédente'
  },
  {
    code: SubmissionErrorTarget.PROJECT_STATUS,
    key: '',
    value: () => 'Tous les Projets doivent avoir le statut envoyé final'
  },
  {
    code: SubmissionErrorTarget.PROGRAM_BOOK,
    key: '',
    value: () => 'Tous les projects doivent avoir le même carnet'
  }
];

export const addProjectToSubmissionErrorCodes: IErrorDictionary[] = [
  {
    code: SubmissionErrorTarget.SUBMISSION_STATUS,
    key: '',
    value: () => "Numéro de soumission n'est pas valide"
  },
  {
    code: SubmissionErrorTarget.ID,
    key: '',
    value: () => 'Le projet existe déja dans la soumission'
  },
  ,
  {
    code: SubmissionErrorTarget.PROJECT_STATUS,
    key: '',
    value: () => 'Le projet doit étre au statut envoyé final'
  },
  {
    code: SubmissionErrorTarget.PROJECT_DRM_NUMBER,
    key: '',
    value: () => 'Le projet doit avoir un numéro de drm'
  },
  {
    code: SubmissionErrorTarget.PROGRAM_BOOK,
    key: '',
    value: () => 'le projet et la soumission doivent avoir le même carnet'
  },
  {
    code: SubmissionErrorTarget.PROJECT_SUBMISSION_NUMBER,
    key: '',
    value: () => "le projet n'a aucun numéro de soumission précédent"
  },
  {
    code: SubmissionErrorTarget.SUBMISSION,
    key: '',
    value: () => "Le numéro de soumission n'existe pas"
  },
  {
    code: SubmissionErrorTarget.SUBMISSION_STATUS,
    key: '',
    value: () => 'Le projet appartient déja à une soumission valide'
  }
];

export const removeProjectFromSubmissionErrorCodes: IErrorDictionary[] = [
  {
    code: SubmissionErrorTarget.SUBMISSION_STATUS,
    key: '',
    value: () => 'La soumission est invalide'
  },
  {
    code: SubmissionErrorTarget.ID,
    key: 'MISSING',
    value: () => "Le projet n'appartient pas à la soumission"
  },
  {
    code: SubmissionErrorTarget.ID,
    key: 'FORBIDDEN',
    value: () => 'Impossible de supprimer le dernier projet de la soumission'
  }
];

export const patchSubmissionErrorCodes: IErrorDictionary[] = [
  {
    code: SubmissionErrorTarget.SUBMISSION_STATUS,
    key: '',
    value: () => 'La soumission est invalide'
  }
];

@Injectable({
  providedIn: 'root'
})
export class SubmissionProjectErrorService extends ErrorHandlerService {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }
  public handleCreateSubmissionError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        this.notificationsService.showError(`Requête invalide`);
        break;
      case 404:
        this.notificationsService.showError(`Certains Projets n'existe pas`);
        break;
      case 422:
        this.notificationsService.showError(this.getMessageFromCode(get(err, errorTraget), createSubmissionErrorCodes));
        break;
      default:
        this.notificationsService.showError(`Une erreur est survenu`);
    }
  }

  public handleAddProjectToSubmissionError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        this.notificationsService.showError(`Requête invalide`);
        break;
      case 404:
        this.notificationsService.showError(`Le projet n'existe pas`);
        break;
      case 422:
        this.notificationsService.showError(
          this.getMessageFromCode(get(err, errorTraget), addProjectToSubmissionErrorCodes)
        );
        break;
      default:
        this.notificationsService.showError(`Une erreur est survenue`);
    }
  }

  public handleRemoveProjectFromSubmissionError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        this.notificationsService.showError(`Requête invalide`);
        break;
      case 404:
        this.notificationsService.showError(`Le projet n'existe pas`);
        break;
      case 422:
        this.notificationsService.showError(
          this.getMessageFromCode(get(err, errorTraget), removeProjectFromSubmissionErrorCodes)
        );
        break;
      default:
        this.notificationsService.showError(`Une erreur est survenue`);
    }
  }

  public handlePatchSubmissionError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        this.notificationsService.showError(`Requête invalide`);
        break;
      case 404:
        this.notificationsService.showError(`La soumission n'existe pas`);
        break;
      case 422:
        this.notificationsService.showError(this.getMessageFromCode(get(err, errorTraget), patchSubmissionErrorCodes));
        break;
      default:
        this.notificationsService.showError(`Une erreur est survenue`);
    }
  }
}
