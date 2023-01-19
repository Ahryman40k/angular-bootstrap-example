import { Component, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { IEnrichedIntervention, IEnrichedProject, Permission } from '@villemontreal/agir-work-planning-lib';
import { get } from 'lodash';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { IMenuItem } from 'src/app/shared/forms/menu-active/menu-active.component';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { ProjectMenuService } from 'src/app/shared/services/project-menu.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { MenuItemKey } from '../../shared/models/menu/menu-item-key';
import { BrowserWindowService } from '../../shared/services/browser-window.service';
import { DocumentService } from '../../shared/services/document.service';
import { ProjectService } from '../../shared/services/project.service';
const annualPeriods = 'annual-periods';
const moreInformation = 'more-information';
@Component({
  selector: 'app-window-content-projects',
  templateUrl: './window-content-projects.component.html',
  styleUrls: ['./window-content-projects.component.scss'],
  providers: [WindowService]
})
export class WindowContentProjectsComponent extends BaseComponent {
  public get item(): IEnrichedIntervention | IEnrichedProject {
    return this.windowService.currentIntervention || this.project;
  }
  public set item(item: IEnrichedIntervention | IEnrichedProject) {
    void this.onItemChanged(item);
  }

  public get project(): IEnrichedProject {
    return this.windowService.currentProject;
  }

  public get isProjectGeolocated(): boolean {
    return !!this.project && this.projectService.isProjectGeolocated(this.project);
  }

  public get navigationMenuItems(): any[] {
    return [this.project, ...this.project.interventions];
  }
  public interventionSelected: string;
  public planificationMenuShow: boolean = true;
  public conceptionMenuShow: boolean = true;
  public menuItems: IMoreOptionsMenuItem[];

  public menuProject$ = this.windowService.intervention$.pipe(
    takeUntil(this.destroy$),
    map(x => this.getProjectMenu())
  );

  public planificationMenu$ = this.windowService.intervention$.pipe(
    takeUntil(this.destroy$),
    map(x => (x ? this.getPlanificationMenu(x.id) : []))
  );

  public conceptionMenu$ = this.windowService.intervention$.pipe(
    takeUntil(this.destroy$),
    map(x => (x ? this.getConceptionMenu(x.id) : []))
  );

  @ViewChildren(RouterLinkActive) public routerLinkActiveDirectives: QueryList<RouterLinkActive>;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly projectMenuService: ProjectMenuService,
    private readonly router: Router,
    public windowService: WindowService,
    private readonly browserWindowService: BrowserWindowService,
    private readonly documentService: DocumentService,
    private readonly projectService: ProjectService,
    private readonly opportunityNoticeService: OpportunityNoticeService,
    private readonly spinnerOverlayService: SpinnerOverlayService
  ) {
    super();
    this.activatedRoute.params.subscribe(async params => {
      this.spinnerOverlayService.show('Chargement du projet en cours');
      await this.windowService.setProject(params.id);
      this.spinnerOverlayService.hide();
    });
    this.activatedRoute.firstChild.params.subscribe(async params => {
      this.interventionSelected = params.interventionId;
      await this.windowService.setIntervention(params.interventionId);
    });
    this.windowService.project$
      .pipe(
        filter(p => !!p),
        switchMap(p =>
          this.projectMenuService.getMenuItems(p, this.destroy$, {
            newWindow: false,
            hiddenMenuItems: [MenuItemKey.ROAD_SECTION_ACTIVITY]
          })
        )
      )
      .subscribe(menuItems => {
        this.menuItems = menuItems;
      });
  }

  private getPlanificationMenu(interventionId: string): IMenuItem[] {
    return [
      {
        key: 'decisions',
        label: 'Décisions',
        link: ['interventions', interventionId, 'decisions'],
        permission: Permission.INTERVENTION_DECISION_READ
      },
      {
        key: 'documents',
        label$: this.documentService.createDocumentMenuItemLabelObservable(
          this.windowService.intervention$.pipe(
            takeUntil(this.destroy$),
            map(i => i?.documents)
          )
        ),
        link: ['interventions', interventionId, 'documents'],
        permission: Permission.INTERVENTION_DOCUMENT_READ
      },
      {
        key: 'requirements',
        label: 'Exigences',
        link: ['interventions', interventionId, 'requirements']
      },
      {
        key: 'comments',
        label: 'Commentaires',
        link: ['interventions', interventionId, 'comments'],
        permission: Permission.INTERVENTION_COMMENT_READ
      },
      {
        key: annualPeriods,
        label: 'Répartition annuelle',
        link: ['interventions', interventionId, annualPeriods],
        permission: Permission.INTERVENTION_ANNUAL_DISTRIBUTION_READ
      },
      {
        key: moreInformation,
        label: 'Informations supplémentaires',
        link: ['interventions', interventionId, moreInformation],
        permission: Permission.INTERVENTION_MORE_INFORMATION_READ
      }
    ];
  }
  private getConceptionMenu(interventionId: string): IMenuItem[] {
    return [
      {
        key: 'conception-data',
        label: 'Données de conception',
        link: ['interventions', interventionId, 'conception-data'],
        permission: Permission.INTERVENTION_MORE_INFORMATION_READ
      }
    ];
  }
  public getItemType(item: any): ObjectType {
    if (item.id?.startsWith('P')) {
      return ObjectType.project;
    }
    if (item.id?.startsWith('I')) {
      return ObjectType.intervention;
    }
  }

  public close(): void {
    if (!this.browserWindowService.close()) {
      void this.router.navigate(['/']);
    }
  }

  /**
   * Compare 2 interventions.
   * Method used by the select.
   */
  public compareIntervention = (selection1: IEnrichedIntervention, selection2: IEnrichedIntervention): boolean => {
    return get(selection1, 'id') === get(selection2, 'id');
  };

  /**
   * Retrieves the intervention mode menu.
   * @param interventionId The intervention ID
   */
  private getInterventionOverviewMenu(interventionId: string): IMenuItem[] {
    return [
      {
        key: 'overview',
        label: "Vue d'ensemble",
        link: ['interventions', interventionId, 'overview']
      }
    ];
  }

  /**
   * Retrieves the project mode menu.
   */
  private getProjectMenu(): IMenuItem[] {
    return [
      { key: 'overview', label: "Vue d'ensemble", link: ['overview'] },
      {
        key: 'opportunity-notices',
        label: "Avis d'opportunité d'intégration",
        link: ['opportunity-notices/overview'],
        permission: Permission.OPPORTUNITY_NOTICE_READ,
        disabled: !this.opportunityNoticeService.canCreateOpportunityNotice(this.project)
      },
      {
        key: 'decisions',
        label: 'Décisions',
        link: ['decisions'],
        permission: Permission.PROJECT_DECISION_READ
      },
      {
        key: 'documents',
        label$: this.documentService.createDocumentMenuItemLabelObservable(
          this.windowService.project$.pipe(
            takeUntil(this.destroy$),
            map(p => {
              if (!p) {
                return [];
              }
              return this.documentService.getProjectDocuments(p).filter(d => d.interventionId);
            })
          )
        ),
        link: ['documents'],
        permission: Permission.INTERVENTION_DOCUMENT_READ
      },
      { key: 'requirements', label: 'Exigences', link: ['requirements'] },
      {
        key: 'comments',
        label: 'Commentaires',
        link: ['comments'],
        permission: Permission.PROJECT_COMMENT_READ
      },
      {
        key: annualPeriods,
        label: 'Répartition annuelle',
        link: [annualPeriods],
        permission: Permission.PROJECT_ANNUAL_DISTRIBUTION_READ
      },
      {
        key: moreInformation,
        label: 'Informations supplémentaires',
        link: [moreInformation],
        permission: Permission.PROJECT_MORE_INFORMATION_READ
      }
    ];
  }

  /**
   * Executed when the selected intervention changed.
   * Sets the intervention in the windowService.
   * Navigates to the selected intervention.
   * @param intervention The enriched intervention (the selection)
   */
  private async onItemChanged(item: IEnrichedIntervention | IEnrichedProject): Promise<void> {
    const intervention = this.getItemType(item) === ObjectType.intervention ? item : null;
    await this.windowService.setIntervention(intervention?.id);
    const menuItem = await this.getMenuItemFromCurrentRoute(intervention?.id);
    this.interventionSelected = intervention?.id ? intervention?.id : null;
    await this.router.navigate(menuItem.link, { relativeTo: this.activatedRoute });
  }

  /**
   * Retrieves the menu item depending on the current route and the intervention ID.
   * @param interventionId The intervention ID
   */
  private async getMenuItemFromCurrentRoute(interventionId?: string): Promise<IMenuItem> {
    const menuItems = interventionId ? this.getInterventionOverviewMenu(interventionId) : this.getProjectMenu();
    return menuItems[0];
  }

  public conceptionMenuToggle(): void {
    this.conceptionMenuShow = !this.conceptionMenuShow;
  }
  public planificationMenuToggle(): void {
    this.planificationMenuShow = !this.planificationMenuShow;
  }
}
