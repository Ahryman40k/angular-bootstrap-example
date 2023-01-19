import { OnInit, Type } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IComment, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith, takeUntil, tap } from 'rxjs/operators';
import { DialogsService, IModalRef } from 'src/app/shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { ISortValue } from 'src/app/shared/forms/sort/sort.component';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { CommentsService, ICommentableEntity } from 'src/app/shared/services/comments.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';

import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { CommentFormComponent } from 'src/app/shared/forms/comments/comment-form.component';
import { BaseCommentUpdateComponent } from 'src/app/shared/forms/comments/comment-update/base-comment-update.component';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { BaseDetailsComponent } from '../base-details-component';

enum CommentFilterKey {
  createdAt = 'audit.createdAt',
  editor = 'audit.createdBy.displayName',
  category = 'categoryId'
}
interface ICommentFilter {
  key: CommentFilterKey;
  label: string;
}

export abstract class BaseCommentsComponent extends BaseDetailsComponent implements OnInit {
  protected abstract requiredPermission: Permission;
  protected abstract readPrivatePermission: Permission;
  protected abstract commentableEntityType: ObjectType;

  protected commentableEntity: ICommentableEntity;

  public comments$: Observable<IComment[]>;
  protected comments: IComment[];

  public filters: ICommentFilter[];
  public sortFormControl: FormControl;
  private readonly sortDefaultValue: ISortValue = { key: CommentFilterKey.createdAt, direction: 'desc' };

  public get canReadPrivateComment(): boolean {
    return this.userService.currentUser && this.userService.currentUser.hasPermission(this.readPrivatePermission);
  }

  // override this methode for each entity project, intervention, submission ...
  public get restrictionItems(): IRestrictionItem[] {
    return [];
  }

  constructor(
    protected readonly commentsService: CommentsService,
    public windowService: WindowService,
    activatedRoute: ActivatedRoute,
    protected readonly dialogsService: DialogsService,
    protected readonly notificationsService: NotificationsService,
    protected readonly userService: UserService
  ) {
    super(windowService, activatedRoute);
  }

  public ngOnInit(): void {
    this.filters = this.getFilters();
    this.sortFormControl = new FormControl(this.sortDefaultValue);
    this.initComments();
    this.init();
  }

  protected abstract init(): void;

  protected getCommentsObservable(): Observable<IComment[]> {
    return this.getCommentableObservable().pipe(
      takeUntil(this.destroy$),
      map(i => i?.comments || [])
    );
  }
  protected abstract getCommentableObservable(): Observable<ICommentableEntity>;

  private initComments(): void {
    const data$ = this.getCommentsObservable();
    this.comments$ = combineLatest(
      data$,
      this.sortFormControl.valueChanges.pipe(startWith(this.sortDefaultValue))
    ).pipe(
      takeUntil(this.destroy$),
      map(([comments, sortValue]) => orderBy(comments, sortValue.key, sortValue.direction)),
      tap(comments => (this.comments = comments))
    );
  }

  public canWriteComment(_comment: IComment): boolean {
    return this.userService.currentUser.hasPermission(this.requiredPermission);
  }

  public async createComment(): Promise<void> {
    await this.upsertComment('add');
  }

  public async updateComment(comment: IComment): Promise<void> {
    await this.upsertComment('update', comment);
  }

  private async upsertComment(operation: 'add' | 'update', comment?: IComment) {
    const modal = this.showModal(operation, comment);
    const result = await modal.result;
    if (result) {
      this.refresh();
    }
  }

  private showModal(operation: 'add' | 'update', comment: IComment): IModalRef<any> {
    const modalType = operation === 'update' ? this.getUpdateModal() : this.getCreateModal();
    const modal = this.dialogsService.showModal<CommentFormComponent | BaseCommentUpdateComponent>(modalType);
    modal.componentInstance.init(this.getCommentableEntity(comment), comment);
    return modal;
  }

  protected abstract getCreateModal(): any;

  protected abstract getUpdateModal(): any;

  protected getCommentableEntity(comment?: IComment): any {
    return this.commentableEntity;
  }

  protected getCommentableEntityType(comment?: IComment): ObjectType {
    return this.commentableEntityType;
  }

  public async showDeleteModal(comment: IComment): Promise<void> {
    const message =
      'La suppression de ce commentaire entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?';
    const modal = this.dialogsService.showDeleteModal('Supprimer un commentaire', message);
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      await this.deleteComment(comment);
    }
  }

  public async deleteComment(comment: IComment): Promise<void> {
    await this.commentsService.deleteComment(
      this.getCommentableEntityType(comment),
      this.commentableEntity.id,
      comment.id
    );
    this.notificationsService.show('Commentaire supprimé', NotificationAlertType.success);
    this.refresh();
  }

  public refresh(): void {
    void this.windowService.refresh();
  }

  private getFilters(): ICommentFilter[] {
    return [
      { key: CommentFilterKey.createdAt, label: 'Date de création' },
      { key: CommentFilterKey.editor, label: 'Éditeur' },
      { key: CommentFilterKey.category, label: 'Catégorie' }
    ];
  }
}
