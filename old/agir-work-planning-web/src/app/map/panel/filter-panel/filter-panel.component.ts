import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { includes } from 'lodash';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IMenuGroup } from 'src/app/shared/models/menu/menu-group';
import { UserService } from 'src/app/shared/user/user.service';

import { IGlobalFilter } from '../../../shared/models/filters/global-filter';
import { GlobalFilterService } from '../../../shared/services/filters/global-filter.service';
import { MapLeftPanelSubPanelComponent } from '../left-panel-sub-panel/left-panel-sub-panel.component';

const PLANIFICATION = 'Planification';

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent extends BaseComponent implements OnInit, AfterViewInit {
  public collapsedIndexes: number[] = [];
  public filters: IMenuGroup[] = [
    {
      collapsible: true,
      title: 'Types',
      items: [
        {
          link: 'project-type',
          icon: 'icon-folder',
          title: 'Types de projets',
          isActive$: this.createIsActiveObservable('projectTypes')
        },
        {
          link: 'intervention-type',
          icon: 'icon-flag-full',
          title: "Types d'interventions",
          isActive$: this.createIsActiveObservable('interventionTypes')
        }
      ]
    },
    {
      collapsible: true,
      title: 'Libellés',
      items: [
        {
          link: 'decision-required',
          icon: 'icon-info',
          title: 'Décision requise',
          isActive$: this.createIsActiveObservable('decisionRequired')
        },
        {
          link: 'label',
          icon: 'icon-tag',
          title: 'Catégories de projets',
          isActive$: this.createIsActiveObservable('projectCategories', 'projectSubCategories')
        }
      ]
    },
    {
      collapsible: true,
      title: 'Statut',
      items: [
        {
          link: 'status-project',
          icon: 'icon-folder',
          title: 'Statuts de projets',
          isActive$: this.createIsActiveObservable('projectStatuses')
        },
        {
          link: 'status-intervention',
          icon: 'icon-flag-full',
          title: 'Statuts des interventions',
          isActive$: this.createIsActiveObservable('interventionStatuses', 'decisionTypeId')
        },
        {
          link: 'status-rtu-projects',
          icon: 'icon-external-folder',
          title: 'Statuts des projets RTU',
          isActive$: this.createIsActiveObservable('rtuProjectStatuses')
        }
      ]
    },
    {
      collapsible: true,
      title: 'Travaux',
      items: [
        {
          link: 'borough',
          icon: 'icon-location',
          title: 'Arrondissements',
          isActive$: this.createIsActiveObservable('boroughs')
        },
        {
          link: 'budget',
          icon: 'icon-money',
          title: 'Budget',
          isActive$: this.createIsActiveObservable('budgetFrom', 'budgetTo')
        },
        {
          link: 'medal',
          icon: 'icon-medal',
          title: 'Médailles',
          isActive$: this.createIsActiveObservable('medals')
        },
        {
          link: 'work-type',
          icon: 'icon-cone',
          title: 'Nature des travaux',
          isActive$: this.createIsActiveObservable('workTypes')
        },
        {
          link: 'program-type',
          icon: 'icon-table',
          title: 'Programmes',
          isActive$: this.createIsActiveObservable('programTypes')
        },
        {
          link: 'requestor',
          icon: 'icon-users',
          title: 'Requérants',
          isActive$: this.createIsActiveObservable('requestors')
        }
      ]
    },
    {
      collapsible: true,
      title: PLANIFICATION,
      items: [
        {
          link: 'executors',
          icon: 'icon-briefcase',
          title: 'Exécutants',
          isActive$: this.createIsActiveObservable('executors')
        },
        {
          link: 'program-book',
          icon: 'icon-book',
          title: 'Programmations annuelles',
          isActive$: this.createIsActiveObservable('programBooks')
        }
      ]
    }
  ];

  @ViewChild('mapLeftPanelSubPanel')
  public mapLeftPanelSubPanel: MapLeftPanelSubPanelComponent;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly globalFilterService: GlobalFilterService,
    private readonly userService: UserService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.userService
      .hasPermission(Permission.PARTNER_PROJECT_READ)
      .then(hasPermission => {
        if (!hasPermission) {
          return undefined;
        }
        this.filters
          .find(filter => filter.title === PLANIFICATION)
          .items.push({
            link: 'rtu-partners',
            icon: 'icon-external-folder',
            title: 'Projet partenaires',
            isActive$: this.createIsActiveObservable('partnerId')
          });
      })
      .finally(() => {
        this.filters
          .find(filter => filter.title === PLANIFICATION)
          .items.push({
            link: 'submission-number',
            icon: 'icon-file',
            title: 'Soumissions',
            isActive$: this.createIsActiveObservable('submissionNumber')
          });
      })
      .catch(() => undefined);
  }

  public ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (this.route.firstChild) {
      setTimeout(() => (this.mapLeftPanelSubPanel.shown = true));
    }
  }

  public toggleIndexCollapse(index: number): void {
    if (this.isIndexCollapsed(index)) {
      this.collapsedIndexes = this.collapsedIndexes.filter(x => x !== index);
    } else {
      this.collapsedIndexes.push(index);
    }
  }

  public isIndexCollapsed(index: number): boolean {
    return includes(this.collapsedIndexes, index);
  }

  private createIsActiveObservable(...keys: (keyof IGlobalFilter)[]): Observable<boolean> {
    return this.globalFilterService.isFilterActiveObs(...keys).pipe(takeUntil(this.destroy$));
  }
}
