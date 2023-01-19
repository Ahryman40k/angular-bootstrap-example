import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { includes } from 'lodash';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LayerManagerGroupIds } from 'src/app/shared/models/assets/layer-manager-group-ids-enum';
import { IMenuGroup } from 'src/app/shared/models/menu/menu-group';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';

import { BaseComponent } from '../../../shared/components/base/base.component';
import { IGlobalLayer } from '../asset-layer/global-layer';
import { MapLeftPanelSubPanelComponent } from '../left-panel-sub-panel/left-panel-sub-panel.component';

@Component({
  selector: 'app-layer-manager-panel',
  templateUrl: './layer-manager-panel.component.html',
  styleUrls: ['./layer-manager-panel.component.scss']
})
export class LayerManagerPanelComponent extends BaseComponent implements AfterViewInit {
  public collapsedIndexes: number[] = [];
  public layers: IMenuGroup[] = [
    {
      collapsible: true,
      title: 'Actifs',
      items: [
        {
          link: LayerManagerGroupIds.AQUEDUCTS,
          title: 'Aqueducs',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.AQUEDUCTS)
        },
        {
          link: LayerManagerGroupIds.SEWERS,
          title: 'Égouts',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.SEWERS)
        },
        {
          link: LayerManagerGroupIds.ENERGY,
          title: 'Énergie',
          isActive$: this.createIsActiveObservable(
            LayerManagerGroupIds.CSEM,
            LayerManagerGroupIds.GAS,
            LayerManagerGroupIds.HYDRO
          )
        },
        {
          link: LayerManagerGroupIds.HYDROGRAPHY,
          title: 'Hydrographiques',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.HYDROGRAPHY)
        },
        {
          link: LayerManagerGroupIds.ROADWAYS,
          title: 'Voirie',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.ROADWAYS)
        }
      ]
    },
    {
      collapsible: true,
      title: 'Réseau Routier',
      items: [
        {
          link: LayerManagerGroupIds.MOBILITY,
          title: 'Mobilité',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.MOBILITY, LayerManagerGroupIds.SNOW)
        },
        {
          link: LayerManagerGroupIds.TRANSPORT,
          title: 'Transport',
          isActive$: this.createIsActiveObservable(
            LayerManagerGroupIds.TRANSPORT,
            LayerManagerGroupIds.BUS,
            LayerManagerGroupIds.SUBWAY,
            LayerManagerGroupIds.REM,
            LayerManagerGroupIds.RAILWAY
          )
        }
      ]
    },
    {
      collapsible: true,
      title: 'Surface',
      items: [
        {
          link: LayerManagerGroupIds.LIGHTNING,
          title: 'Éclairage',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.LIGHTNING)
        },
        {
          link: LayerManagerGroupIds.FURNITURE,
          title: 'Mobilier',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.FURNITURE, LayerManagerGroupIds.HORTICULTURE)
        },
        {
          link: LayerManagerGroupIds.SIGNALIZATION,
          title: 'Signalisation',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.TERMINALS, LayerManagerGroupIds.POLES)
        }
      ]
    },
    {
      collapsible: true,
      title: 'Territoire',
      items: [
        {
          link: LayerManagerGroupIds.BUILDINGS_LOCATIONS,
          title: 'Bâtiments et lieux',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.BUILDINGS_LOCATIONS)
        },
        {
          link: LayerManagerGroupIds.PUBLIC_DOMAIN,
          title: 'Domaine Public',
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.PUBLIC_DOMAIN)
        },
        {
          link: LayerManagerGroupIds.ANALYSIS_ELEMENTS,
          title: "Éléments d'analyse",
          isActive$: this.createIsActiveObservable(LayerManagerGroupIds.INTERVENTION_PLAN_2016)
        }
      ]
    }
  ];

  @ViewChild('mapLeftPanelSubPanel')
  public mapLeftPanelSubPanel: MapLeftPanelSubPanelComponent;

  constructor(private readonly globalLayerService: GlobalLayerService, private readonly route: ActivatedRoute) {
    super();
  }

  public ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (this.route.firstChild) {
      setTimeout(() => (this.mapLeftPanelSubPanel.shown = true));
    }
  }

  private createIsActiveObservable(...keys: (keyof IGlobalLayer)[]): Observable<boolean> {
    return this.globalLayerService.isLayerActiveObs(...keys).pipe(takeUntil(this.destroy$));
  }

  public isIndexCollapsed(index: number): boolean {
    return includes(this.collapsedIndexes, index);
  }

  public toggleIndexCollapse(index: number): void {
    if (this.isIndexCollapsed(index)) {
      this.collapsedIndexes = this.collapsedIndexes.filter(x => x !== index);
    } else {
      this.collapsedIndexes.push(index);
    }
  }
}
