import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CommentCategory,
  ExternalReferenceType,
  IComment,
  IPlainComment,
  IPlainProject,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { CommentsService } from 'src/app/shared/services/comments.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { TaxonomiesService } from '../../shared/services/taxonomies.service';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { BaseMoreInformationComponent } from '../base-more-information.component';

@Component({
  selector: 'app-project-more-information',
  templateUrl: './project-more-information.component.html'
})
export class ProjectMoreInformationComponent extends BaseMoreInformationComponent implements OnInit {
  public riskTypes$ = this.taxonomyService.group(TaxonomyGroup.riskType).pipe(takeUntil(this.destroy$));
  /**
   * Created separate form controls.
   * Might need to change in the future to support other external reference IDs.
   * If we come to this, please use a form with an array of external reference ID controls.
   */
  public infoRtuFormControl = new FormControl('', [
    CustomValidators.infoRtuNumber,
    Validators.maxLength(100),
    Validators.required
  ]);
  public riskFormControl = new FormControl('');

  constructor(
    activatedRoute: ActivatedRoute,
    windowService: WindowService,
    dialogsService: DialogsService,
    private readonly commentsService: CommentsService,
    private readonly projectService: ProjectService,
    private readonly taxonomyService: TaxonomiesService
  ) {
    super(activatedRoute, windowService, dialogsService);
    this.constructConfigs();
  }

  private constructConfigs(): void {
    this.configs.push({
      control: this.infoRtuFormControl,
      saveAction: (): Promise<boolean> => {
        const externalReferenceIds = this.generateExternalReferenceIdsFromNewValue(
          this.project.externalReferenceIds,
          ExternalReferenceType.infoRTUReferenceNumber,
          this.infoRtuFormControl.value
        );
        return this.patchProject(this.infoRtuFormControl, { externalReferenceIds });
      },
      cancel: () => {
        this.infoRtuFormControl.reset(
          this.project.externalReferenceIds?.find(x => x.type === ExternalReferenceType.infoRTUReferenceNumber)?.value
        );
        this.infoRtuFormControl.updateValueAndValidity();
      }
    });

    this.configs.push({
      control: this.riskFormControl,
      saveAction: () => this.patchProject(this.riskFormControl, { riskId: this.riskFormControl.value }),
      cancel: () => {
        this.riskFormControl.reset(this.project.riskId);
        this.riskFormControl.updateValueAndValidity();
      }
    });
  }

  public ngOnInit(): void {
    this.initComments();
    this.initForm();
  }

  private initComments(): void {
    this.comments$ = this.windowService.project$.pipe(
      filter(p => !!p),
      switchMap(p => this.commentsService.getComments(ObjectType.project, p.id)),
      map(comments => this.commentsService.keepMoreInformationCommentsOnly(comments)),
      shareReplay()
    );
  }

  protected async createMoreInformation(comment: IComment): Promise<void> {
    await this.commentsService.createComment(ObjectType.project, this.project.id, comment);
  }

  protected async deleteMoreInformation(commentId: string): Promise<void> {
    await this.commentsService.deleteComment(ObjectType.project, this.project.id, commentId);
  }

  protected async editMoreInformation(commentId: string, comment: IPlainComment): Promise<void> {
    await this.commentsService.updateComment(ObjectType.project, this.project.id, commentId, comment);
  }

  private async patchProject(formControl: FormControl, plainProject: Partial<IPlainProject>): Promise<boolean> {
    formControl.markAsTouched();
    if (formControl.invalid) {
      return false;
    }
    formControl.disable();
    try {
      await this.projectService.patchProject(this.project, plainProject);
      await this.windowService.refresh();
    } finally {
      formControl.enable();
    }
    return true;
  }
}
