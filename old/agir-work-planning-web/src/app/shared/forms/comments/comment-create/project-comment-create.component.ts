import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IComment, IEnrichedProject, Permission } from '@villemontreal/agir-work-planning-lib';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { CommentsService } from 'src/app/shared/services/comments.service';

import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { UserService } from 'src/app/shared/user/user.service';
import { CommentFormComponent } from '../comment-form.component';

@Component({
  selector: 'app-project-comment-create',
  templateUrl: './comment-create.component.html',
  styleUrls: ['./comment-create.component.scss']
})
export class ProjectCommentCreateComponent extends CommentFormComponent implements OnInit {
  protected entityType = ObjectType.project;
  protected successMessage = `Le commentaire a été ajouté au projet`;

  constructor(
    protected readonly commentService: CommentsService,
    protected readonly fb: FormBuilder,
    protected readonly activeModal: NgbActiveModal,
    protected readonly notificationsService: NotificationsService,
    private readonly userService: UserService
  ) {
    super(commentService, fb, activeModal, notificationsService);
  }

  public ngOnInit(): void {
    this.commentCategories$ = this.commentService.getCommentCategories(this.destroy$);
    this.initForm();
  }

  public get canWritePrivateComment(): boolean {
    return this.userService.currentUser.hasPermission(Permission.PROJECT_COMMENT_WRITE_PRIVATE);
  }
}
