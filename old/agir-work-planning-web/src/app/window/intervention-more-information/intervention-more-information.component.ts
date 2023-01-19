import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ExternalReferenceType,
  IComment,
  IEnrichedIntervention,
  IPlainComment
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest } from 'rxjs';
import { filter, map, shareReplay, startWith, switchMap, take } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IInterventionPatch } from 'src/app/shared/models/interventions/intervention.model';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { CommentsService } from 'src/app/shared/services/comments.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';
import { BaseMoreInformationComponent } from '../base-more-information.component';

@Component({
  selector: 'app-intervention-more-information',
  templateUrl: './intervention-more-information.component.html'
})
export class InterventionMoreInformationComponent extends BaseMoreInformationComponent implements OnInit {
  public requestorReferenceNumberControl = new FormControl('', [
    CustomValidators.infoRtuNumber,
    Validators.maxLength(100),
    Validators.required
  ]);

  public ptiNumberControl = new FormControl('', [
    CustomValidators.infoRtuNumber,
    Validators.maxLength(100),
    Validators.required
  ]);

  constructor(
    public activatedRoute: ActivatedRoute,
    public windowService: WindowService,
    protected dialogsService: DialogsService,
    private readonly commentsService: CommentsService,
    private readonly interventionsService: InterventionService
  ) {
    super(activatedRoute, windowService, dialogsService);
    this.constructConfigs();
  }

  private constructConfigs(): void {
    this.configs.push({
      control: this.requestorReferenceNumberControl,
      saveAction: (): Promise<boolean> => {
        const externalReferenceIds = this.generateExternalReferenceIdsFromNewValue(
          this.intervention.externalReferenceIds,
          ExternalReferenceType.requestorReferenceNumber,
          this.requestorReferenceNumberControl.value
        );
        return this.patchIntervention(this.requestorReferenceNumberControl, { externalReferenceIds });
      },
      cancel: () => {
        this.requestorReferenceNumberControl.reset(
          this.intervention.externalReferenceIds?.find(x => x.type === ExternalReferenceType.requestorReferenceNumber)
            ?.value
        );
        this.requestorReferenceNumberControl.updateValueAndValidity();
      }
    });

    this.configs.push({
      control: this.ptiNumberControl,
      saveAction: (): Promise<boolean> => {
        const externalReferenceIds = this.generateExternalReferenceIdsFromNewValue(
          this.intervention.externalReferenceIds,
          ExternalReferenceType.ptiNumber,
          this.ptiNumberControl.value
        );
        return this.patchIntervention(this.ptiNumberControl, { externalReferenceIds });
      },
      cancel: () => {
        this.ptiNumberControl.reset(
          this.intervention.externalReferenceIds?.find(x => x.type === ExternalReferenceType.ptiNumber)?.value
        );
        this.ptiNumberControl.updateValueAndValidity();
      }
    });
  }

  public async ngOnInit(): Promise<void> {
    await this.ensureInterventionLoaded();
    this.initComments();
    this.initForm();
  }

  protected async deleteMoreInformation(commentId: string): Promise<void> {
    await this.commentsService.deleteComment(ObjectType.intervention, this.intervention.id, commentId);
  }

  protected async editMoreInformation(commentId: string, comment: IPlainComment): Promise<void> {
    await this.commentsService.updateComment(ObjectType.intervention, this.intervention.id, commentId, comment);
  }

  public async createMoreInformation(comment: IPlainComment): Promise<void> {
    comment.isProjectVisible = false;
    await this.commentsService.createComment(ObjectType.intervention, this.intervention.id, comment);
  }

  private async ensureInterventionLoaded(): Promise<IEnrichedIntervention> {
    return this.windowService.intervention$
      .pipe(
        filter(intervention => !!intervention),
        take(1)
      )
      .toPromise();
  }

  private initComments(): void {
    this.comments$ = combineLatest(
      this.windowService.intervention$,
      this.interventionsService.interventionChanged$.pipe(startWith(null))
    ).pipe(
      map(([intervention]) => intervention),
      filter(intervention => !!intervention),
      switchMap(intervention => this.commentsService.getComments(ObjectType.intervention, intervention.id)),
      map(comments => this.commentsService.keepMoreInformationCommentsOnly(comments)),
      shareReplay()
    );
  }

  private async patchIntervention(formControl: FormControl, plainIntervention: IInterventionPatch): Promise<boolean> {
    formControl.markAsTouched();
    if (formControl.invalid) {
      return false;
    }
    formControl.disable();
    try {
      await this.interventionsService.patchIntervention(this.intervention, plainIntervention);
      await this.windowService.refresh();
    } finally {
      formControl.enable();
    }
    return true;
  }
}
