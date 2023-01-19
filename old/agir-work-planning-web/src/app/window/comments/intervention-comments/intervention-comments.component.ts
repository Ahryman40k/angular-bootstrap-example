import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IComment, IEnrichedIntervention, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';

import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { DialogsService, IModalRef } from '../../../shared/dialogs/dialogs.service';
import { InterventionCommentCreateComponent } from '../../../shared/forms/comments/comment-create/intervention-comment-create.component';
import { InterventionCommentUpdateComponent } from '../../../shared/forms/comments/comment-update/intervention-comment-update.component';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { CommentsService, ICommentableEntity } from '../../../shared/services/comments.service';
import { InterventionService } from '../../../shared/services/intervention.service';
import { ProjectService } from '../../../shared/services/project.service';
import { WindowService } from '../../../shared/services/window.service';
import { UserService } from '../../../shared/user/user.service';
import { BaseCommentsComponent } from '../base-comments.component';

@Component({
  selector: 'app-intervention-comments',
  templateUrl: '../comments.component.html'
})
export class InterventionCommentsComponent extends BaseCommentsComponent implements OnInit {
  protected requiredPermission: Permission = Permission.INTERVENTION_COMMENT_WRITE;
  protected readPrivatePermission: Permission = Permission.INTERVENTION_COMMENT_READ_PRIVATE;
  protected commentableEntityType = ObjectType.intervention;

  constructor(
    commentsService: CommentsService,
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    dialogsService: DialogsService,
    notificationsService: NotificationsService,
    userService: UserService
  ) {
    super(commentsService, windowService, activatedRoute, dialogsService, notificationsService, userService);
    this.commentableEntity = this.intervention as ICommentableEntity;
  }

  public get restrictionItems(): IRestrictionItem[] {
    return this.interventionRestrictionItems;
  }

  protected init(): void {
    this.commentableEntity = this.intervention;
  }

  protected getCommentableObservable(): Observable<ICommentableEntity> {
    return this.windowService.intervention$ as Observable<ICommentableEntity>;
  }

  protected getCreateModal(): any {
    return InterventionCommentCreateComponent;
  }

  protected getUpdateModal(comment?: IComment): any {
    return InterventionCommentUpdateComponent;
  }
}
