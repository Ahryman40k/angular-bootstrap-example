import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedProject,
  IPlainOpportunityNotice,
  ITaxonomyList,
  OpportunityNoticeStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { IEnrichedOpportunityNotice, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { IAssetGroupByType } from '../../../window/opportunity-notices/opportunity-notice-assets-list/opportunity-notice-assets-list.component';
import { BaseComponent } from '../../components/base/base.component';
import { markAllAsTouched } from '../../forms/forms.utils';
import { NotificationAlertType } from '../../notifications/notification-alert';
import { NotificationsService } from '../../notifications/notifications.service';
import { OpportunityNoticeService } from '../../services/opportunity-notice.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { WindowService } from '../../services/window.service';
import { DEFAULT_OPPORTUNITY_NOTICE_FOLLOW_UP_METHOD_CODE } from '../../taxonomies/constants';
import { RestrictionType, UserRestrictionsService } from '../../user/user-restrictions.service';

export enum DecisionCreateCloseType {
  created = 'created',
  canceled = 'canceled'
}
@Component({
  selector: 'app-opportunity-notice-modal',
  templateUrl: './opportunity-notice-modal.component.html',
  styleUrls: ['./opportunity-notice-modal.component.scss'],
  providers: [WindowService]
})
export class OpportunityNoticeModalComponent extends BaseComponent implements OnInit {
  public TaxonomyGroup = TaxonomyGroup;
  public opportunityNotice: IEnrichedOpportunityNotice;
  public assetGroupByType: IAssetGroupByType;
  public project: IEnrichedProject;
  public icons: { [key: string]: string };
  public modalTitle: string;

  public form: FormGroup;
  public assetOwnerTaxo$: Observable<ITaxonomy[]>;
  public followUpMethods$: Observable<ITaxonomy[]>;

  public assetOwner: ITaxonomy;
  public assetTitle = '';
  public showDescription = false;

  public onlyNumbersRegExp = /^(0|[1-9]\d*)?$/;
  public minimumMaxIterations = 1; // the minimum number of recalls

  constructor(
    private readonly fb: FormBuilder,
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly opportunityNoticeService: OpportunityNoticeService,
    private readonly userRestrictionsService: UserRestrictionsService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    this.followUpMethods$ = this.taxonomiesService.group(TaxonomyGroup.opportunityNoticeFollowUpMethod).pipe(take(1));
    this.icons = this.opportunityNoticeService.getAssetIconsDictionary();
    await this.setAssetOwner();
    this.initForm();
  }

  public init(
    project: IEnrichedProject,
    assetGroupByType: IAssetGroupByType,
    opportunityNotice: IEnrichedOpportunityNotice
  ): void {
    this.project = project;
    this.assetGroupByType = assetGroupByType;
    this.opportunityNotice = opportunityNotice;

    const messageComplement = opportunityNotice ? 'Modifier' : 'Créer';
    this.modalTitle = assetGroupByType
      ? `${messageComplement} un avis d'opportunité d'intégration`
      : `${messageComplement} un avis d'opportunité d'intégration pour un actif non-géolocalisé`;
  }

  public async submitOpportunityNotice(): Promise<void> {
    const opportunityNoticeBody = this.getOpportunityNoticeFromForm(this.form);

    if (this.opportunityNotice) {
      await this.opportunityNoticeService.updateOpportunityNotice(this.opportunityNotice.id, opportunityNoticeBody);
    } else {
      await this.opportunityNoticeService.createOpportunityNotice(opportunityNoticeBody);
    }

    const message = `L'avis a été ${this.opportunityNotice ? 'modifié' : 'créé'}.`;
    this.notificationsService.show(message, NotificationAlertType.success);
  }

  public getOpportunityNoticeFromForm(form: FormGroup): IPlainOpportunityNotice {
    if (this.assetGroupByType) {
      this.assetGroupByType.items = this.assetGroupByType.items.map(asset => ({
        id: asset.id,
        typeId: asset.typeId,
        ownerId: asset.ownerId,
        length: asset.length,
        geometry: asset?.geometry,
        suggestedStreetName: asset.suggestedStreetName,
        roadSections: asset.roadSections,
        workArea: asset.workArea
      }));
    }

    const opportunityNotice = {
      projectId: this.project.id,
      assets: this.assetGroupByType?.items,
      object: form.controls.object.value,
      requestorId: form.controls.requestor.value,
      followUpMethod: form.controls.followUpMethod.value,
      maxIterations: +form.controls.maxIterations.value
    };

    if (!this.assetGroupByType) {
      delete opportunityNotice.assets;
    }

    return opportunityNotice;
  }

  public async submit(): Promise<void> {
    if (this.opportunityNotice?.status === OpportunityNoticeStatus.closed) {
      this.notificationsService.show(
        `Cet avis ne peut pas être modifié car il est dejà fermé`,
        NotificationAlertType.warning
      );
      return;
    }

    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    await this.submitOpportunityNotice();

    this.activeModal.close(DecisionCreateCloseType.created);
  }

  public cancel(): void {
    this.activeModal.close(DecisionCreateCloseType.canceled);
  }

  public toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  private initForm(): void {
    this.form = this.fb.group({
      requestor: [
        { value: this.opportunityNotice?.requestorId || this.assetOwner?.code, disabled: false },
        [Validators.required]
      ],
      followUpMethod: [
        { value: DEFAULT_OPPORTUNITY_NOTICE_FOLLOW_UP_METHOD_CODE, disabled: true },
        [Validators.required]
      ],
      object: [this.opportunityNotice?.object, Validators.required],
      maxIterations: [
        this.opportunityNotice?.maxIterations,
        [Validators.required, Validators.pattern(this.onlyNumbersRegExp), Validators.min(this.minimumMaxIterations)]
      ]
    });
  }

  private async setAssetOwner(): Promise<void> {
    if (!this.assetGroupByType?.key) {
      this.assetOwnerTaxo$ = this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(
        take(1),
        map(taxo => this.getFilteredRequestors(taxo))
      );
      return;
    }

    this.assetOwner = await combineLatest(
      this.taxonomiesService.code(TaxonomyGroup.assetType, this.assetGroupByType.key),
      this.taxonomiesService.group(TaxonomyGroup.assetOwner)
    )
      .pipe(
        tap(([assetType, taxoOwner]) => {
          if (assetType && taxoOwner) {
            const finalOwners = assetType.properties?.owners?.map((ownerCode: string) => {
              return (taxoOwner as ITaxonomyList).find(taxo => taxo.code === ownerCode);
            });

            this.assetOwnerTaxo$ = of(finalOwners).pipe(
              take(1),
              map(taxo => this.getFilteredRequestors(taxo))
            );
          }
        }),
        map(([assetType]) => assetType.properties?.owners?.find((ownerId: string) => ownerId)),
        switchMap((ownerId: string) => this.taxonomiesService.code(TaxonomyGroup.assetOwner, ownerId)),
        take(1)
      )
      .toPromise();
  }

  private getFilteredRequestors(taxonomies: ITaxonomy[]): ITaxonomy[] {
    return this.userRestrictionsService.filterTaxonomies(taxonomies, RestrictionType.REQUESTOR);
  }
}
