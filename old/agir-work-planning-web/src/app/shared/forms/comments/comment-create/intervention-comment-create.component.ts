import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentCategory, IComment, IEnrichedIntervention, IPlainComment } from '@villemontreal/agir-work-planning-lib';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { CommentsService } from 'src/app/shared/services/comments.service';

import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { CommentFormComponent } from '../comment-form.component';

@Component({
  selector: 'app-intervention-comment-create',
  templateUrl: './comment-create.component.html',
  styleUrls: ['./comment-create.component.scss']
})
export class InterventionCommentCreateComponent extends CommentFormComponent implements OnInit {
  protected entityType = ObjectType.intervention;
  protected successMessage = `Le commentaire a été ajouté à l'intervention`;

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
    this.form.addControl('isProjectVisible', new FormControl(false));
  }

  public getCommentForm(formValue: any, categoryId?: CommentCategory): IPlainComment {
    const comment = super.getCommentForm(formValue, categoryId);
    comment.isProjectVisible = formValue.isProjectVisible;
    return comment;
  }
}
