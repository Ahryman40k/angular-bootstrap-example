import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { GisComponentsLibModule } from '@villemontreal/maps-angular-lib';
import { NgxMaskModule } from 'ngx-mask';

import { PlanningBookComponent } from '../planning-book/planning-book.component';
import { SharedModule } from '../shared/shared.module';
import { MapLayerManagerComponent } from './layer-manager/map-layer-manager.component';
import { MapRoutingModule } from './map-routing.module';
import { MapComponent } from './map.component';
import { LayersPanelComponent } from './panel/asset-layer/layers-panel.component';
import { AssetSelectionComponent } from './panel/asset-selection/asset-selection.component';
import { BottomPanelComponent } from './panel/bottom-panel/bottom-panel.component';
import { ComparisonPanelComponent } from './panel/comparison-panel/comparison-panel.component';
import { FilterPanelComponent } from './panel/filter-panel/filter-panel.component';
import { BoroughFilterComponent } from './panel/filters/borough-filter/borough-filter.component';
import { BudgetFilterComponent } from './panel/filters/budget-filter/budget-filter.component';
import { CurrentSelectionComponent } from './panel/filters/current-selection/current-selection.component';
import { DecisionRequiredFilterComponent } from './panel/filters/decision-required-filter/decision-required-filter.component';
import { ExecutorFilterComponent } from './panel/filters/executor-filter/executor-filter.component';
import { FavoriteFilterComponent } from './panel/filters/favorites/favorite-filter/favorite-filter.component';
import { SelectedFavoriteComponent } from './panel/filters/favorites/selected-favorite/selected-favorite.component';
import { FilterItemLayoutComponent } from './panel/filters/filter-item-layout/filter-item-layout.component';
import { FilterItemComponent } from './panel/filters/filter-item/filter-item.component';
import { FilterLayoutComponent } from './panel/filters/filter-layout/filter-layout.component';
import { InterventionTypeFilterComponent } from './panel/filters/intervention-type-filter/intervention-type-filter.component';
import { LabelFilterComponent } from './panel/filters/label-filter/label-filter.component';
import { MedalFilterComponent } from './panel/filters/medal-filter/medal-filter.component';
import { ProgramBookFilterComponent } from './panel/filters/program-book-filter/program-book-filter.component';
import { ProgramTypeFilterComponent } from './panel/filters/program-type-filter/program-type-filter.component';
import { ProjectTypeFilterComponent } from './panel/filters/project-type-filter/project-type-filter.component';
import { RequestorFilterComponent } from './panel/filters/requestor-filter/requestor-filter.component';
import { RtuProjectFilterComponent } from './panel/filters/rtu-project-filter/rtu-project-filter.component';
import { StatusInterventionFilterComponent } from './panel/filters/status-intervention-filter/status-intervention-filter.component';
import { StatusProjectFilterComponent } from './panel/filters/status-project-filter/status-project-filter.component';
import { StatusRtuProjectFilterComponent } from './panel/filters/status-rtu-project-filter/status-rtu-project-filter.component';
import { SubmissionNumberFilterItemLayoutComponent } from './panel/filters/submission-number-filter-item-layout/submission-number-filter-item-layout.component';
import { SubmissionNumberFilterItemComponent } from './panel/filters/submission-number-filter-item/submission-number-filter-item.component';
import { SubmissionNumberFilterComponent } from './panel/filters/submission-number-filter/submission-number-filter.component';
import { WorkTypeFilterComponent } from './panel/filters/work-type-filter/work-type-filter.component';
import { LayerManagerPanelComponent } from './panel/layer-manager-panel/layer-manager-panel.component';
import { MapLeftPanelSubPanelComponent } from './panel/left-panel-sub-panel/left-panel-sub-panel.component';
import { MapLeftPanelComponent } from './panel/left-panel/map-left-panel.component';
import { MapLegendAcronymsComponent } from './panel/map-legend/map-legend-acronymes/map-legend-acronyms.component';
import { MapLegendElementsComponent } from './panel/map-legend/map-legend-elements/map-legend-elements.component';
import { MapLegendExternalResourceComponent } from './panel/map-legend/map-legend-external-resource/map-legend-external-resource.component';
import { MapLegendHeaderComponent } from './panel/map-legend/map-legend-header/map-legend-header.component';
import { MapLegendInfoComponent } from './panel/map-legend/map-legend-info/map-legend-info.component';
import { MapLegendMedalsComponent } from './panel/map-legend/map-legend-medals/map-legend-medals.component';
import { MapLegendComponent } from './panel/map-legend/map-legend.component';
import { MenuGroupComponent } from './panel/menu-group/menu-group.component';
import { MapPanelMenuComponent } from './panel/menu/map-panel-menu.component';
import { NonGeolocatedProjectsPanelComponent } from './panel/non-geolocated-projects-panel/non-geolocated-projects-panel.component';
import { NonGeolocatedProjectsComponent } from './panel/non-geolocated-projects/non-geolocated-projects.component';
import { MapRightPanelComponent } from './panel/right-panel/map-right-panel.component';
import { MapSearchResultsComponent } from './search-results/map-search-results.component';
import { MapSelectionAddressComponent } from './selection/address/map-selection-address.component';
import { MapSelectionAssetComponent } from './selection/asset/map-selection-asset.component';
import { ElementsCardComponent } from './selection/cards/elements/elements-card.component';
import { MapDistanceFilterComponent } from './selection/distance-filter/map-distance-filter.component';
import { MapSelectionDistanceResultsComponent } from './selection/distance-results/map-selection-distance-results.component';
import { MapSelectionInterventionComponent } from './selection/intervention/map-selection-intervention.component';
import { MapSelectionProjectComponent } from './selection/project/map-selection-project.component';
import { MapSelectionRtuProjectComponent } from './selection/rtu-project/map-selection-rtu-project.component';

@NgModule({
  declarations: [
    AssetSelectionComponent,
    BoroughFilterComponent,
    BottomPanelComponent,
    BudgetFilterComponent,
    CurrentSelectionComponent,
    ElementsCardComponent,
    ExecutorFilterComponent,
    FavoriteFilterComponent,
    FilterItemComponent,
    FilterItemLayoutComponent,
    FilterLayoutComponent,
    FilterPanelComponent,
    InterventionTypeFilterComponent,
    LabelFilterComponent,
    DecisionRequiredFilterComponent,
    LayerManagerPanelComponent,
    LayersPanelComponent,
    MapComponent,
    MapDistanceFilterComponent,
    MapLayerManagerComponent,
    MapLeftPanelComponent,
    MapLeftPanelSubPanelComponent,
    MapLegendAcronymsComponent,
    MapLegendComponent,
    MapLegendElementsComponent,
    MapLegendHeaderComponent,
    MapLegendMedalsComponent,
    MapLegendExternalResourceComponent,
    MapLegendInfoComponent,
    MapPanelMenuComponent,
    MapRightPanelComponent,
    MapSearchResultsComponent,
    MapSelectionAddressComponent,
    MapSelectionAssetComponent,
    MapSelectionDistanceResultsComponent,
    MapSelectionInterventionComponent,
    MapSelectionProjectComponent,
    MapSelectionRtuProjectComponent,
    MedalFilterComponent,
    MenuGroupComponent,
    NonGeolocatedProjectsComponent,
    NonGeolocatedProjectsPanelComponent,
    PlanningBookComponent,
    ProgramBookFilterComponent,
    ProgramTypeFilterComponent,
    ProjectTypeFilterComponent,
    RequestorFilterComponent,
    RtuProjectFilterComponent,
    SelectedFavoriteComponent,
    StatusInterventionFilterComponent,
    StatusProjectFilterComponent,
    StatusRtuProjectFilterComponent,
    SubmissionNumberFilterComponent,
    SubmissionNumberFilterItemLayoutComponent,
    SubmissionNumberFilterItemComponent,
    WorkTypeFilterComponent,
    ComparisonPanelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MapRoutingModule,
    GisComponentsLibModule,
    NgbTooltipModule,
    SharedModule,
    NgxMaskModule.forChild(),
    ReactiveFormsModule,
    NgbModule
  ],
  exports: [MapComponent]
})
export class MapModule {}
