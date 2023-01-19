import { OnInit } from '@angular/core';
import { IComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { ICommentableEntity } from 'src/app/shared/services/comments.service';

import { markAllAsTouched } from '../../forms.utils';
import { CommentFormComponent } from '../comment-form.component';

export abstract class BaseCommentUpdateComponent extends CommentFormComponent implements OnInit {
  protected successMessage = `Le commentaire à été modifié`;
  public existingComment: IComment;
  public formUpdated = false;

  public init(commentableEntity: ICommentableEntity, comment?: IComment): void {
    super.init(commentableEntity);
    this.existingComment = comment;
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.updateForm();
  }

  private updateForm(): void {
    this.form.reset(this.getFormResetValue());
    this.formUpdated = true;
  }

  protected getFormResetValue(): any {
    return {
      categoryId: this.existingComment.categoryId,
      description: this.existingComment.text,
      isPublic: this.existingComment.isPublic
    };
  }

  public async submitComment(comment: IComment): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    await this.commentService.updateComment(
      this.entityType,
      this.commentableEntity.id,
      this.existingComment.id,
      comment
    );
    this.notificationsService.show(this.successMessage, NotificationAlertType.success);
  }
}
