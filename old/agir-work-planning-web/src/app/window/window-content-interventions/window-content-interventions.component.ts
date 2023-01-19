import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IEnrichedIntervention, Permission } from '@villemontreal/agir-work-planning-lib';
import { map, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { IMenuItem } from 'src/app/shared/forms/menu-active/menu-active.component';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { InterventionMenuService } from 'src/app/shared/services/intervention-menu.service';
import { RouteService } from 'src/app/shared/services/route.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { MenuItemKey } from '../../shared/models/menu/menu-item-key';
import { BrowserWindowService } from '../../shared/services/browser-window.service';
import { DocumentService } from '../../shared/services/document.service';

@Component({
  selector: 'app-window-content-interventions',
  templateUrl: './window-content-interventions.component.html',
  styleUrls: ['./window-content-interventions.component.scss'],
  providers: [WindowService]
})
export class WindowContentInterventionsComponent extends BaseComponent implements OnInit {
  public interventionMenuItems: IMoreOptionsMenuItem[];
  public planificationMenuShow: boolean = true;
  public conceptionMenuShow: boolean = true;
  public get canInteract(): boolean {
    return this.windowService.canInteract;
  }

  public get intervention(): IEnrichedIntervention {
    return this.windowService.currentIntervention;
  }

  public planificationMenu: IMenuItem[] = [
    {
      key: 'decisions',
      label: 'Décisions',
      link: ['decisions'],
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
      link: ['documents'],
      permission: Permission.INTERVENTION_DOCUMENT_READ
    },
    {
      key: 'requirements',
      label: 'Exigences',
      link: ['requirements']
    },
    {
      key: 'comments',
      label: 'Commentaires',
      link: ['comments'],
      permission: Permission.INTERVENTION_COMMENT_READ
    },
    {
      key: 'annual-periods',
      label: 'Répartition annuelle',
      link: ['annual-periods'],
      permission: Permission.INTERVENTION_ANNUAL_DISTRIBUTION_READ
    },
    {
      key: 'more-information',
      label: 'Informations supplémentaires',
      link: ['more-information'],
      permission: Permission.INTERVENTION_MORE_INFORMATION_READ
    }
  ];

  public conceptionMenu: IMenuItem[] = [
    {
      key: 'conception-data',
      label: 'Données de conception',
      link: ['conception-data'],
      permission: Permission.INTERVENTION_MORE_INFORMATION_READ
    }
  ];

  public get shouldShowDecisionWarning(): boolean {
    return (
      this.windowService.currentIntervention &&
      this.windowService.currentIntervention.decisionRequired &&
      this.routeService.currentRouteLastSegment !== 'decisions'
    );
  }

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly interventionMenuService: InterventionMenuService,
    private readonly windowService: WindowService,
    private readonly routeService: RouteService,
    private readonly browserWindowService: BrowserWindowService,
    private readonly documentService: DocumentService,
    private readonly router: Router,
    private readonly spinnerOverlayService: SpinnerOverlayService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.spinnerOverlayService.show("Chargement de l'intervention en cours");
    this.activatedRoute.params.subscribe(async params => {
      await this.windowService.setIntervention(params.id);
    });

    this.windowService.intervention$.subscribe(intervention => {
      if (!intervention) {
        this.spinnerOverlayService.hide();
        return;
      }

      this.interventionMenuItems = this.interventionMenuService.getMenuItems(intervention, {
        newWindow: false,
        hiddenMenuItems: [MenuItemKey.ROAD_SECTION_ACTIVITY]
      });
      this.spinnerOverlayService.hide();
    });
  }
  public conceptionMenuToggle(): void {
    this.conceptionMenuShow = !this.conceptionMenuShow;
  }
  public planificationMenuToggle(): void {
    this.planificationMenuShow = !this.planificationMenuShow;
  }
  public close(): void {
    if (!this.browserWindowService.close()) {
      void this.router.navigate(['/']);
    }
  }
}
