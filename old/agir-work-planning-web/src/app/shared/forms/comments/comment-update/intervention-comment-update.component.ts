import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { CommentCategory, IPlainComment } from '@villemontreal/agir-work-planning-lib/dist/src';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { CommentsService } from 'src/app/shared/services/comments.service';
import { BaseCommentUpdateComponent } from './base-comment-update.component';

@Component({
  selector: 'app-intervention-comment-update',
  templateUrl: './comment-update.component.html',
  styleUrls: ['./comment-update.component.scss']
})
export class InterventionCommentUpdateComponent extends BaseCommentUpdateComponent implements OnInit {
  protected entityType = ObjectType.intervention;

  constructor(
    protected readonly commentService: CommentsService,
    protected readonly fb: FormBuilder,
    protected readonly activeModal: NgbActiveModal,
    protected readonly notificationsService: NotificationsService
  ) {
    super(commentService, fb, activeModal, notificationsService);
  }

  protected initForm(): void {
    super.initForm();
    this.form.addControl('isProjectVisible', new FormControl(null));
  }

  protected getFormResetValue(): any {
    const resetValue = super.getFormResetValue();
    resetValue.isProjectVisible = this.existingComment.isProjectVisible;
    return resetValue;
  }

  public getCommentForm(formValue: any, categoryId?: CommentCategory): IPlainComment {
    const comment = super.getCommentForm(formValue, categoryId);
    comment.isProjectVisible = formValue.isProjectVisible;
    return comment;
  }
}
