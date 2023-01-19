import { OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentCategory, IPlainComment, ITaxonomy } from '@villemontreal/agir-work-planning-lib';
import { Observable } from 'rxjs';

import { BaseComponent } from '../../components/base/base.component';
import { ILinkedObject, linkedObjects } from '../../models/interventions/linked-objects';
import { ObjectType } from '../../models/object-type/object-type';
import { NotificationAlertType } from '../../notifications/notification-alert';
import { NotificationsService } from '../../notifications/notifications.service';
import { CommentsService, ICommentableEntity } from '../../services/comments.service';
import { markAllAsTouched } from '../forms.utils';

export abstract class CommentFormComponent extends BaseComponent implements OnInit {
  protected commentableEntity: ICommentableEntity;
  protected abstract entityType: ObjectType;
  protected abstract successMessage: string;

  public form: FormGroup;
  public commentCategories$: Observable<ITaxonomy[]>;
  public linkedObjects: ILinkedObject[] = linkedObjects;

  constructor(
    protected readonly commentService: CommentsService,
    protected readonly fb: FormBuilder,
    protected readonly activeModal: NgbActiveModal,
    protected readonly notificationsService: NotificationsService
  ) {
    super();
  }

  public init(commentableEntity: ICommentableEntity) {
    this.commentableEntity = commentableEntity;
  }

  public ngOnInit(): void {
    this.commentCategories$ = this.commentService.getCommentCategories(this.destroy$);
    this.initForm();
  }

  public getCommentForm(formValue: any, categoryId?: CommentCategory): IPlainComment {
    return {
      categoryId: categoryId || formValue.categoryId,
      text: formValue.description,
      isPublic: formValue.isPublic
    };
  }

  public async submit(categoryId?: string): Promise<void> {
    const comment: IPlainComment = this.getCommentForm(this.form.value, CommentCategory[categoryId]);

    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    await this.submitComment(comment);
    this.activeModal.close(true);
  }

  public async submitComment(comment: IPlainComment): Promise<void> {
    await this.commentService.createComment(this.entityType, this.commentableEntity.id, comment);
    this.notificationsService.show(this.successMessage, NotificationAlertType.success);
  }

  protected initForm(): void {
    this.form = this.fb.group({
      categoryId: [null, Validators.required],
      description: [null, Validators.required],
      isPublic: [true, Validators.required]
    });
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  public get canWritePrivateComment(): boolean {
    return true;
  }
}
