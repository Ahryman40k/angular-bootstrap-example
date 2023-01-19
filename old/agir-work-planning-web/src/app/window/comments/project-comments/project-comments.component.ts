import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IComment, IEnrichedIntervention, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { DialogsService } from '../../../shared/dialogs/dialogs.service';
import { ProjectCommentCreateComponent } from '../../../shared/forms/comments/comment-create/project-comment-create.component';
import { InterventionCommentUpdateComponent } from '../../../shared/forms/comments/comment-update/intervention-comment-update.component';
import { ProjectCommentUpdateComponent } from '../../../shared/forms/comments/comment-update/project-comment-update.component';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { CommentsService, ICommentableEntity } from '../../../shared/services/comments.service';
import { ProjectService } from '../../../shared/services/project.service';
import { WindowService } from '../../../shared/services/window.service';
import { UserService } from '../../../shared/user/user.service';
import { BaseCommentsComponent } from '../base-comments.component';

@Component({
  selector: 'app-project-comments',
  templateUrl: '../comments.component.html'
})
export class ProjectCommentsComponent extends BaseCommentsComponent implements OnInit {
  protected requiredPermission: Permission = Permission.PROJECT_COMMENT_WRITE;
  protected readPrivatePermission: Permission = Permission.PROJECT_COMMENT_READ_PRIVATE;
  protected commentableEntityType = ObjectType.project;

  constructor(
    commentsService: CommentsService,
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    dialogsService: DialogsService,
    notificationsService: NotificationsService,
    userService: UserService,
    private projectsService: ProjectService
  ) {
    super(commentsService, windowService, activatedRoute, dialogsService, notificationsService, userService);
  }

  protected init(): void {
    this.commentableEntity = this.project;
  }

  public get restrictionItems(): IRestrictionItem[] {
    return this.projectRestrictionItems;
  }

  protected getCommentsObservable(): Observable<IComment[]> {
    return this.getCommentableObservable().pipe(
      takeUntil(this.destroy$),
      map(p => this.projectsService.getProjectComments(p))
    );
  }
  protected getCommentableObservable(): Observable<ICommentableEntity> {
    return this.windowService.project$ as Observable<ICommentableEntity>;
  }

  public canWriteComment(comment: IComment): boolean {
    this.requiredPermission = this.isProjectComment(comment)
      ? comment && !comment.isPublic
        ? Permission.PROJECT_COMMENT_WRITE_PRIVATE
        : Permission.PROJECT_COMMENT_WRITE
      : Permission.INTERVENTION_COMMENT_WRITE;
    return super.canWriteComment(comment);
  }

  protected getCreateModal(): any {
    return ProjectCommentCreateComponent;
  }

  protected getUpdateModal(comment?: IComment): any {
    if (this.isProjectComment(comment)) {
      return ProjectCommentUpdateComponent;
    }
    return InterventionCommentUpdateComponent;
  }

  protected getCommentableEntity(comment: IComment): ICommentableEntity {
    if (this.isProjectComment(comment)) {
      this.commentableEntity = this.project as ICommentableEntity;
    } else {
      this.commentableEntity = this.getInterventionFromComment(comment) as ICommentableEntity;
    }
    return this.commentableEntity;
  }

  protected getCommentableEntityType(comment: IComment): ObjectType {
    if (this.isProjectComment(comment)) {
      this.commentableEntityType = ObjectType.project;
    } else {
      this.commentableEntityType = ObjectType.intervention;
    }
    return this.commentableEntityType;
  }

  private isProjectComment(comment: IComment): boolean {
    return !comment || this.project.comments?.includes(comment);
  }

  private getInterventionFromComment(comment: IComment): IEnrichedIntervention {
    return this.project.interventions.find(i => i.comments.includes(comment));
  }
}
