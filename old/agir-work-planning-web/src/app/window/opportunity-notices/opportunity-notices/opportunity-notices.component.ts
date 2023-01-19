import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IEnrichedNote,
  IEnrichedOpportunityNotice,
  OpportunityNoticeResponseRequestorDecision,
  OpportunityNoticeStatus,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { OpportunityNoticeModalComponent } from 'src/app/shared/dialogs/opportunity-notice-modal/opportunity-notice-modal.component';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { ISortValue } from 'src/app/shared/forms/sort/sort.component';
import {
  IOpportunityNoticeFilter,
  OpportunityNoticeFilterKey,
  OpportunityNoticeResponse
} from 'src/app/shared/models/opportunity-notices/opportunity-notices';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { RestrictionType, UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { UserService } from 'src/app/shared/user/user.service';

import { BaseDetailsComponent } from '../../base-details-component';
import { IAssetGroupByType } from '../opportunity-notice-assets-list/opportunity-notice-assets-list.component';
import { OpportunityNoticeNoteModalComponent } from '../opportunity-notices-note-modal/opportunity-notices-note-modal.component';

@Component({
  selector: 'app-opportunity-notices',
  templateUrl: './opportunity-notices.component.html',
  styleUrls: ['./opportunity-notices.component.scss']
})
export class OpportunityNoticesComponent extends BaseDetailsComponent implements OnInit {
  public readonly OpportunityNoticeStatus = OpportunityNoticeStatus;
  public readonly OpportunityNoticeResponseRequestorDecision = OpportunityNoticeResponseRequestorDecision;
  public readonly OpportunityNoticeResponse = OpportunityNoticeResponse;
  public opportunityNoticesSubject = new BehaviorSubject<IEnrichedOpportunityNotice[]>([]);
  public opportunityNotices$ = this.opportunityNoticesSubject.asObservable();
  public isLoadingOpportunityNotices = false;
  public filters: IOpportunityNoticeFilter[];

  public readonly sortFormControl: FormControl;
  private readonly sortDefaultValue: ISortValue = {
    key: OpportunityNoticeFilterKey.typeId,
    direction: SortDirection.desc
  };

  public get opportunityNotices(): IEnrichedOpportunityNotice[] {
    return this.opportunityNoticesSubject.getValue();
  }

  public get canCreateOpportunityNotice(): boolean {
    return this.opportunityNoticesService.canCreateOpportunityNotice(this.project);
  }

  constructor(
    private readonly opportunityNoticesService: OpportunityNoticeService,
    private readonly userService: UserService,
    private readonly dialogsService: DialogsService,
    private readonly notificationsService: NotificationsService,
    private readonly userRestrictionsService: UserRestrictionsService,
    windowService: WindowService,
    activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {
    super(windowService, activatedRoute);
    this.sortFormControl = new FormControl(this.sortDefaultValue);
  }

  public ngOnInit(): void {
    this.filters = this.getFilters();
    this.initOpportunityNotices();
    this.onOpportunityNoticeChanged();
  }

  private initOpportunityNotices(): void {
    this.isLoadingOpportunityNotices = true;
    combineLatest(this.windowService.project$, this.sortFormControl.valueChanges.pipe(startWith(this.sortDefaultValue)))
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([p, sortValue]) => this.opportunityNoticesService.getOpportunityNoticesByProject(p.id, sortValue)),
        map(a => a.items),
        tap(() => (this.isLoadingOpportunityNotices = false)),
        shareReplay()
      )
      .subscribe(op => {
        this.opportunityNoticesSubject.next(op);
      });
  }

  private onOpportunityNoticeChanged(): void {
    this.opportunityNoticesService.opportunityNoticeChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((opportunityNotice: IEnrichedOpportunityNotice) => {
        const exist = this.opportunityNotices.some(el => el.id === opportunityNotice.id);
        let newOpportunityNotices: IEnrichedOpportunityNotice[] = cloneDeep(this.opportunityNotices);
        if (exist) {
          newOpportunityNotices = this.opportunityNotices.map(el =>
            el.id === opportunityNotice.id ? opportunityNotice : el
          );
        } else {
          this.opportunityNotices.push(opportunityNotice);
        }

        this.opportunityNoticesSubject.next(newOpportunityNotices);
      });
  }

  public changeToOpportunityNoticeCreatePage(): void {
    void this.router.navigate([`../assets-without-intervention`], { relativeTo: this.activatedRoute });
  }

  public updateOpportunityNotice(opportunityNotice: IEnrichedOpportunityNotice): void {
    if (opportunityNotice.status === OpportunityNoticeStatus.closed) {
      this.notificationsService.show(
        `Cet avis ne peut pas être modifié car il est dejà fermé`,
        NotificationAlertType.warning
      );
      return;
    }

    let assetGroupByType: IAssetGroupByType;
    if (opportunityNotice.assets.length) {
      const assetType = opportunityNotice.assets[0].typeId;
      assetGroupByType = {
        key: assetType,
        items: opportunityNotice.assets,
        icon: this.opportunityNoticesService.getAssetIconsDictionary()[assetType]
      };
    }
    const modalRef = this.dialogsService.showModal(OpportunityNoticeModalComponent);
    modalRef.componentInstance.init(this.project, assetGroupByType, opportunityNotice);
  }

  public async openOpportunityNoticeNoteModal(
    opportunityNotice: IEnrichedOpportunityNotice,
    opportunityNoticeNote: IEnrichedNote
  ): Promise<void> {
    const modal = this.dialogsService.showModal(OpportunityNoticeNoteModalComponent);
    modal.componentInstance.init(opportunityNotice, opportunityNoticeNote);
    const newOpportunityNotice = await modal.result;
    if (!newOpportunityNotice) {
      return;
    }
    this.updateOpportunityNoticeList(newOpportunityNotice);
  }

  private updateOpportunityNoticeList(opportunityNotice: IEnrichedOpportunityNotice): void {
    const index = this.opportunityNotices.findIndex(notice => notice.id === opportunityNotice.id);
    this.opportunityNotices.splice(index, 1, opportunityNotice);
  }

  public async goToRequestorDecision(opportunityNotice: IEnrichedOpportunityNotice): Promise<void> {
    await this.router.navigateByUrl(
      `/window/projects/${this.project.id}/opportunity-notices/${opportunityNotice.id}/response`
    );
  }

  private getFilters(): IOpportunityNoticeFilter[] {
    return [
      { key: OpportunityNoticeFilterKey.typeId, label: `Type d'actif` },
      { key: OpportunityNoticeFilterKey.requestorId, label: `Requérant` },
      { key: OpportunityNoticeFilterKey.createdAt, label: `Date d'ajout` },
      { key: OpportunityNoticeFilterKey.modifiedAt, label: `Date de modification` },
      { key: OpportunityNoticeFilterKey.status, label: `Statut d'avis` }
    ];
  }

  public canChangeOpportunity(opportunityNotice: IEnrichedOpportunityNotice): boolean {
    return (
      this.canInteract &&
      this.userService.currentUser.hasPermission(Permission.OPPORTUNITY_NOTICE_WRITE) &&
      opportunityNotice.status !== OpportunityNoticeStatus.closed &&
      this.userRestrictionsService.validate(this.projectRestrictionItems) &&
      this.userRestrictionsService.validateOneByType(
        { REQUESTOR: [opportunityNotice.requestorId] },
        RestrictionType.REQUESTOR
      ) &&
      this.canCreateOpportunityNotice
    );
  }
}
