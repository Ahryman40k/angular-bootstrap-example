import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CommentCategory,
  ExternalReferenceType,
  IComment,
  IExternalReferenceId,
  IPlainComment
} from '@villemontreal/agir-work-planning-lib';
import { cloneDeep, omit } from 'lodash';
import { Observable } from 'rxjs';
import { IMoreInformationFieldConfig } from 'src/app/shared/models/more-information-field-config';
import { WindowService } from 'src/app/shared/services/window.service';

import { DialogsService } from '../shared/dialogs/dialogs.service';
import { TextModalComponent } from '../shared/dialogs/text-modal/text-modal.component';
import { ConfirmationModalCloseType } from '../shared/forms/confirmation-modal/confirmation-modal.component';
import { BaseDetailsComponent } from './base-details-component';

export abstract class BaseMoreInformationComponent extends BaseDetailsComponent {
  public comments$: Observable<IComment[]>;
  public externalReferenceType = ExternalReferenceType;
  protected readonly configs: IMoreInformationFieldConfig[] = [];

  constructor(
    activatedRoute: ActivatedRoute,
    windowService: WindowService,
    protected readonly dialogsService: DialogsService
  ) {
    super(windowService, activatedRoute);
  }

  public cancel(formControl: FormControl): void {
    this.configs.find(x => x.control === formControl).cancel();
  }

  public getSaveAction(formControl: FormControl): () => Promise<boolean> {
    return this.configs.find(x => x.control === formControl).saveAction;
  }

  protected initForm(): void {
    for (const config of this.configs) {
      config.cancel();
    }
  }

  protected abstract async createMoreInformation(comment: IPlainComment): Promise<void>;

  protected abstract async deleteMoreInformation(commentId: string): Promise<void>;

  protected abstract async editMoreInformation(commentId: string, comment: IPlainComment): Promise<void>;

  public async showCreateModal(): Promise<void> {
    const modal = this.dialogsService.showModal(TextModalComponent);
    modal.componentInstance.formControl = new FormControl('', Validators.required);
    modal.componentInstance.modalTitle = "Ajouter d'autres informations";
    modal.componentInstance.textFieldLabel = 'Autres informations';
    modal.componentInstance.saveButtonText = 'Ajouter';
    const result = await modal.result;
    if (!result) {
      return;
    }

    await this.createMoreInformation({
      categoryId: CommentCategory.other,
      text: result,
      isPublic: true
    });
    await this.windowService.refresh();
  }

  public async showDeleteModal(comment: IComment): Promise<void> {
    const message =
      'La suppression de cette information entraînera la perte des données.\nÊtes-vous certain de vouloir continuer?';
    const modal = this.dialogsService.showDeleteModal("Supprimer l'information", message);
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      await this.deleteMoreInformation(comment.id);
      await this.windowService.refresh();
    }
  }

  public async showEditModal(comment: IComment): Promise<void> {
    const modal = this.dialogsService.showModal(TextModalComponent);
    modal.componentInstance.formControl = new FormControl(comment.text, Validators.required);
    modal.componentInstance.modalTitle = "Modifier l'information supplémentaire";
    modal.componentInstance.textFieldLabel = 'Autres informations';
    modal.componentInstance.saveButtonText = 'Modifier';
    const result = await modal.result;
    if (!result) {
      return;
    }

    const commentId = comment.id;
    const plainComment: IPlainComment = {
      ...omit(comment, ['id', 'audit']),
      text: result
    };
    await this.editMoreInformation(commentId, plainComment);
    await this.windowService.refresh();
  }

  protected generateExternalReferenceIdsFromNewValue(
    modelExternalReferenceIds: IExternalReferenceId[],
    type: ExternalReferenceType,
    newValue: string
  ): IExternalReferenceId[] {
    const externalReferenceIds = cloneDeep(modelExternalReferenceIds) || [];
    let externalReferenceId = externalReferenceIds.find(x => x.type === type);
    if (!externalReferenceId) {
      externalReferenceId = { type, value: '' };
      externalReferenceIds.push(externalReferenceId);
    }
    externalReferenceId.value = newValue;
    return externalReferenceIds;
  }
}
