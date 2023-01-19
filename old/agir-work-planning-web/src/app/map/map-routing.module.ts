import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AnyPermissionGuard } from '../shared/guards/any-permission.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { LayerManagerGroupIds } from '../shared/models/assets/layer-manager-group-ids-enum';
import { MapLayerManagerComponent } from './layer-manager/map-layer-manager.component';
import { MapComponent } from './map.component';
import { LayersPanelComponent } from './panel/asset-layer/layers-panel.component';
import { AssetSelectionComponent } from './panel/asset-selection/asset-selection.component';
import { ComparisonPanelComponent } from './panel/comparison-panel/comparison-panel.component';
import { FilterPanelComponent } from './panel/filter-panel/filter-panel.component';
import { BoroughFilterComponent } from './panel/filters/borough-filter/borough-filter.component';
import { BudgetFilterComponent } from './panel/filters/budget-filter/budget-filter.component';
import { CurrentSelectionComponent } from './panel/filters/current-selection/current-selection.component';
import { DecisionRequiredFilterComponent } from './panel/filters/decision-required-filter/decision-required-filter.component';
import { ExecutorFilterComponent } from './panel/filters/executor-filter/executor-filter.component';
import { FavoriteFilterComponent } from './panel/filters/favorites/favorite-filter/favorite-filter.component';
import { SelectedFavoriteComponent } from './panel/filters/favorites/selected-favorite/selected-favorite.component';
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
import { SubmissionNumberFilterComponent } from './panel/filters/submission-number-filter/submission-number-filter.component';
import { WorkTypeFilterComponent } from './panel/filters/work-type-filter/work-type-filter.component';
import { LayerManagerPanelComponent } from './panel/layer-manager-panel/layer-manager-panel.component';
import { MapLegendAcronymsComponent } from './panel/map-legend/map-legend-acronymes/map-legend-acronyms.component';
import { MapLegendElementsComponent } from './panel/map-legend/map-legend-elements/map-legend-elements.component';
import { MapLegendMedalsComponent } from './panel/map-legend/map-legend-medals/map-legend-medals.component';
import { MapLegendComponent } from './panel/map-legend/map-legend.component';
import { MapSearchResultsComponent } from './search-results/map-search-results.component';
import { MapSelectionAddressComponent } from './selection/address/map-selection-address.component';
import { MapSelectionAssetComponent } from './selection/asset/map-selection-asset.component';
import { MapSelectionInterventionComponent } from './selection/intervention/map-selection-intervention.component';
import { MapSelectionProjectComponent } from './selection/project/map-selection-project.component';
import { MapSelectionRtuProjectComponent } from './selection/rtu-project/map-selection-rtu-project.component';

const routes: Routes = [
  {
    // We have to name the route, otherwise the outlets won't work. Read more here: https://github.com/angular/angular/issues/10981
    path: 'm',
    canActivate: [AnyPermissionGuard],
    component: MapComponent,
    data: { contextualMenuEnabled: true, withCountByBorough: true, withCountByCity: true, withManualRefresh: true },
    children: [
      {
        path: 'selection/addresses/:addressId',
        component: MapSelectionAddressComponent,
        outlet: 'rightPanel',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'selection/assets/:assetType/:assetId',
        component: MapSelectionAssetComponent,
        outlet: 'rightPanel',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'selection/interventions/:interventionId',
        component: MapSelectionInterventionComponent,
        outlet: 'rightPanel',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'selection/projects/:projectId/:projectType',
        component: MapSelectionProjectComponent,
        outlet: 'rightPanel',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'selection/rtuProjects/:rtuProjectId',
        component: MapSelectionRtuProjectComponent,
        outlet: 'rightPanel',
        canLoad: [PermissionGuard],
        data: { permission: Permission.RTU_PROJECT_READ }
      },
      {
        path: 'search-results/:q',
        component: MapSearchResultsComponent,
        outlet: 'rightPanel',
        canLoad: [AnyPermissionGuard]
      },
      { path: 'current', component: CurrentSelectionComponent, outlet: 'leftPanel', canLoad: [AnyPermissionGuard] },
      {
        path: 'favorite',
        component: FavoriteFilterComponent,
        outlet: 'leftPanel',
        children: [{ path: ':id', component: SelectedFavoriteComponent }],
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'filters',
        component: FilterPanelComponent,
        outlet: 'leftPanel',
        children: [
          { path: 'borough', component: BoroughFilterComponent },
          { path: 'budget', component: BudgetFilterComponent },
          { path: 'executors', component: ExecutorFilterComponent },
          { path: 'intervention-type', component: InterventionTypeFilterComponent },
          { path: 'label', component: LabelFilterComponent },
          { path: 'decision-required', component: DecisionRequiredFilterComponent },
          { path: 'layer-manager', component: MapLayerManagerComponent },
          { path: 'medal', component: MedalFilterComponent },
          { path: 'program-book', component: ProgramBookFilterComponent },
          { path: 'program-type', component: ProgramTypeFilterComponent },
          { path: 'project-type', component: ProjectTypeFilterComponent },
          { path: 'requestor', component: RequestorFilterComponent },
          {
            path: 'rtu-partners',
            component: RtuProjectFilterComponent,
            canActivate: [PermissionGuard],
            data: { permission: Permission.PARTNER_PROJECT_READ }
          },
          {
            path: 'submission-number',
            component: SubmissionNumberFilterComponent,
            canActivate: [PermissionGuard],
            data: { permission: Permission.SUBMISSION_READ }
          },
          { path: 'status-intervention', component: StatusInterventionFilterComponent },
          { path: 'status-project', component: StatusProjectFilterComponent },
          { path: 'status-rtu-projects', component: StatusRtuProjectFilterComponent },
          { path: 'work-type', component: WorkTypeFilterComponent }
        ],
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'layers',
        component: LayerManagerPanelComponent,
        outlet: 'leftPanel',
        children: [
          { path: LayerManagerGroupIds.ANALYSIS_ELEMENTS, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.AQUEDUCTS, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.BUILDINGS_LOCATIONS, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.FURNITURE, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.ENERGY, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.HYDROGRAPHY, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.LIGHTNING, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.MOBILITY, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.PUBLIC_DOMAIN, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.RAILWAY, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.ROADWAYS, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.SEWERS, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.SIGNALIZATION, component: LayersPanelComponent },
          { path: LayerManagerGroupIds.TRANSPORT, component: LayersPanelComponent }
        ],
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'comparison',
        component: ComparisonPanelComponent,
        outlet: 'leftPanel',
        data: { widthPanel: '30rem' },
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'asset-selection',
        component: AssetSelectionComponent,
        outlet: 'leftPanel',
        canLoad: [AnyPermissionGuard]
      },
      {
        path: 'information',
        component: MapLegendComponent,
        outlet: 'leftPanel',
        data: { fullSize: true },
        children: [
          {
            path: '',
            redirectTo: 'elements',
            pathMatch: 'full'
          },
          { path: 'elements', component: MapLegendElementsComponent },
          { path: 'medals', component: MapLegendMedalsComponent },
          { path: 'acronyms', component: MapLegendAcronymsComponent }
        ],
        canLoad: [AnyPermissionGuard]
      }
    ]
  },
  { path: '', redirectTo: 'm' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MapRoutingModule {}
