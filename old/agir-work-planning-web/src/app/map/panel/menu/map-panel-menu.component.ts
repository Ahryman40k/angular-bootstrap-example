import { Component } from '@angular/core';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LayerManagerGroupIds } from 'src/app/shared/models/assets/layer-manager-group-ids-enum';
import { IMenuItem } from 'src/app/shared/models/menu/menu-item';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';

import { BaseComponent } from '../../../shared/components/base/base.component';
import { IGlobalFilter } from '../../../shared/models/filters/global-filter';
import { GlobalFilterService } from '../../../shared/services/filters/global-filter.service';
import { IGlobalLayer } from '../asset-layer/global-layer';

@Component({
  selector: 'app-map-panel-menu',
  templateUrl: './map-panel-menu.component.html'
})
export class MapPanelMenuComponent extends BaseComponent {
  public menuItemsStart: IMenuItem[] = [
    {
      link: 'current',
      icon: 'icon-selection-rectangle',
      title: 'Sélection actuelle'
    },
    {
      link: 'favorite',
      icon: 'icon-star',
      title: 'Favoris'
    },
    {
      link: 'filters',
      icon: 'icon-filters',
      title: 'Filtres',
      isActive$: this.isFilterActive(
        'boroughs',
        'budgetFrom',
        'budgetTo',
        'executors',
        'interventionStatuses',
        'decisionTypeId',
        'interventionTypes',
        'medals',
        'partnerId',
        'submissionNumber',
        'programBooks',
        'programTypes',
        'projectCategories',
        'projectStatuses',
        'projectSubCategories',
        'projectTypes',
        'rtuProjectStatuses',
        'requestors',
        'workTypes',
        'decisionRequired'
      )
    },
    {
      link: 'layers',
      icon: 'icon-layers',
      title: `Couches d'actifs`,
      permission: Permission.ASSET_READ,
      isActive$: this.isLayerActive(
        LayerManagerGroupIds.AQUEDUCTS,
        LayerManagerGroupIds.BUILDINGS_LOCATIONS,
        LayerManagerGroupIds.BUS,
        LayerManagerGroupIds.CSEM,
        LayerManagerGroupIds.FURNITURE,
        LayerManagerGroupIds.GAS,
        LayerManagerGroupIds.HORTICULTURE,
        LayerManagerGroupIds.HYDRO,
        LayerManagerGroupIds.HYDROGRAPHY,
        LayerManagerGroupIds.INTERVENTION_PLAN_2016,
        LayerManagerGroupIds.LIGHTNING,
        LayerManagerGroupIds.MOBILITY,
        LayerManagerGroupIds.POLES,
        LayerManagerGroupIds.PUBLIC_DOMAIN,
        LayerManagerGroupIds.REM,
        LayerManagerGroupIds.RAILWAY,
        LayerManagerGroupIds.ROADWAYS,
        LayerManagerGroupIds.SEWERS,
        LayerManagerGroupIds.SNOW,
        LayerManagerGroupIds.SUBWAY,
        LayerManagerGroupIds.TERMINALS,
        LayerManagerGroupIds.TRANSPORT
      )
    },
    {
      link: 'asset-selection',
      icon: 'icon-cursor-pointer',
      title: "Sélection d'actifs",
      permission: Permission.INTERVENTION_WRITE
    },
    {
      link: 'comparison',
      icon: 'icon-comparison',
      title: 'Comparaison',
      permission: Permission.COMPARISON_READ
    }
  ];

  public menuItemsEnd: IMenuItem[] = [
    {
      link: 'information',
      icon: 'icon-info',
      title: 'Information'
    }
  ];

  constructor(
    private readonly globalLayerService: GlobalLayerService,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  private isLayerActive(...filterKeys: (keyof IGlobalLayer)[]): Observable<boolean> {
    return this.globalLayerService.isLayerActiveObs(...filterKeys).pipe(takeUntil(this.destroy$));
  }

  private isFilterActive(...filterKeys: (keyof IGlobalFilter)[]): Observable<boolean> {
    return this.globalFilterService.isFilterActiveObs(...filterKeys).pipe(takeUntil(this.destroy$));
  }
}
