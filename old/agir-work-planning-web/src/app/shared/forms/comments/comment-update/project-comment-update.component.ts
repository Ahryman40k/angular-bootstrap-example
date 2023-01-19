import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IComment, IEnrichedProject, IPlainComment, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { CommentsService } from 'src/app/shared/services/comments.service';

import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseCommentUpdateComponent } from './base-comment-update.component';

@Component({
  selector: 'app-project-comment-update',
  templateUrl: './comment-update.component.html',
  styleUrls: ['./comment-update.component.scss']
})
export class ProjectCommentUpdateComponent extends BaseCommentUpdateComponent implements OnInit {
  protected entityType = ObjectType.project;

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
    super.ngOnInit();
  }

  public get canWritePrivateComment(): boolean {
    return this.userService.currentUser.hasPermission(Permission.PROJECT_COMMENT_WRITE_PRIVATE);
  }
}
