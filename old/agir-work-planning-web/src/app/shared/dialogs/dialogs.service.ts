import { Injectable, Type } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AlertType } from '../alerts/alert/alert.component';
import { IErrorDictionary } from '../errors/error.service';
import { AlertModalComponent } from '../forms/alert-modal/alert-modal.component';
import {
  BUTTON_LABEL_CONFIRM,
  BUTTON_LABEL_SUPPRESS,
  ConfirmationModalComponent
} from '../forms/confirmation-modal/confirmation-modal.component';
import { BasicModalComponent } from './basic-modal/basic-modal.component';
import { DialogType } from './dialog-type';
import { ErrorModalComponent } from './error-modal/error-modal.component';

export const DIALOG_SERVICE_DISMISS = 'dialog.service_dismiss';
export interface IModalRef<T> extends NgbModalRef {
  readonly componentInstance: T;
}

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  constructor(private readonly ngbModal: NgbModal) {
    window.addEventListener('popstate', () => {
      this.ngbModal.dismissAll(DIALOG_SERVICE_DISMISS);
    });
  }

  public show(title: string, content: string, accept: string, reject: string, type: DialogType): Promise<string> {
    const modalRef = this.ngbModal.open(BasicModalComponent);
    const component = modalRef.componentInstance as BasicModalComponent;
    component.title = title;
    component.content = content;
    component.buttonAccept = accept;
    component.buttonReject = reject;
    component.type = type;
    return modalRef.result;
  }

  public showDeleteModal(
    title: string,
    message: string,
    confirmLabel = BUTTON_LABEL_SUPPRESS,
    buttonType = 'btn-danger'
  ): NgbModalRef {
    const modalRef = this.showModal(ConfirmationModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.confirmLabel = confirmLabel;
    modalRef.componentInstance.buttonType = buttonType;
    return modalRef;
  }

  public showConfirmationModal(
    title: string,
    message: string,
    confirmLabel: string = BUTTON_LABEL_CONFIRM
  ): NgbModalRef {
    const modalRef = this.showModal(ConfirmationModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.confirmLabel = confirmLabel;

    return modalRef;
  }

  public showModal<T>(component: Type<T>, windowClass = 'modal-form-custom-lg'): IModalRef<T> {
    return this.ngbModal.open(component, {
      windowClass,
      backdrop: 'static',
      keyboard: false
    });
  }

  public showErrorModal(title: string, errors: IErrorDictionary[]): IModalRef<ErrorModalComponent> {
    const modal = this.showModal(ErrorModalComponent);
    modal.componentInstance.title = title;
    modal.componentInstance.errors = errors;
    return modal;
  }

  public showAlertModal(
    modalTitle: string,
    alertMessage: string,
    buttonLabel: string,
    alertTitle = 'Attention!',
    alertType: AlertType = AlertType.danger,
    confirmLabel = null,
    confirmButtonClass = 'btn-primary',
    iconName = 'icon-warning'
  ): NgbModalRef {
    const modalRef = this.showModal(AlertModalComponent);
    modalRef.componentInstance.modalTitle = modalTitle;
    modalRef.componentInstance.alertMessage = alertMessage;
    modalRef.componentInstance.buttonLabel = buttonLabel;
    modalRef.componentInstance.alertTitle = alertTitle;
    modalRef.componentInstance.type = alertType;
    modalRef.componentInstance.confirmLabel = confirmLabel;
    modalRef.componentInstance.confirmButtonClass = confirmButtonClass;
    modalRef.componentInstance.iconName = iconName;
    return modalRef;
  }
}
