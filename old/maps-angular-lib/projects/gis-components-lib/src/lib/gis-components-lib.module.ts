import { AgmCoreModule } from '@agm/core';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LayerManagerComponent } from './layer-manager/layer-manager.component';
import { LmBootstrapComponent } from './layer-manager/themes/lm-bootstrap/lm-bootstrap.component';
import { LmGroupBootstrapComponent } from './layer-manager/themes/lm-bootstrap/lm-group-bootstrap/lm-group-bootstrap.component';
import { LmDefaultComponent } from './layer-manager/themes/lm-default/lm-default.component';
import { LmGroupDefaultComponent } from './layer-manager/themes/lm-default/lm-group-default/lm-group-default.component';
import { MapComponent } from './map/map.component';
import { GeometryDrawToolComponent } from './tools/geometry-draw-tool/geometry-draw-tool.component';
import { LgnlatViewerToolComponent } from './tools/lgnlat-viewer-tool/lgnlat-viewer-tool.component';
import { MinimapToolComponent } from './tools/minimap-tool/minimap-tool.component';
import { RoadSelectorToolComponent } from './tools/multiple-selection-tool/multiple-selection-tool.component';
import { OkCancelComponent } from './tools/ok-cancel/ok-cancel.component';
import { SimpleSelectionComponent } from './tools/simple-selection/simple-selection.component';
import { StreetViewComponent } from './tools/street-view/street-view.component';
import { TransformToolComponent } from './tools/transform-tool/transform-tool.component';

@NgModule({
  declarations: [
    MapComponent,
    LayerManagerComponent,
    LmBootstrapComponent,
    LmGroupBootstrapComponent,
    LmDefaultComponent,
    LmGroupDefaultComponent,
    LgnlatViewerToolComponent,
    MinimapToolComponent,
    GeometryDrawToolComponent,
    OkCancelComponent,
    SimpleSelectionComponent,
    RoadSelectorToolComponent,
    TransformToolComponent,
    StreetViewComponent
  ],
  imports: [
    CommonModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBhXFQA_Pllc3DBjC9TI0BvyHkRRzFRPbE'
    })
  ],
  exports: [
    MapComponent,
    LayerManagerComponent,
    LgnlatViewerToolComponent,
    MinimapToolComponent,
    GeometryDrawToolComponent,
    OkCancelComponent,
    SimpleSelectionComponent,
    RoadSelectorToolComponent,
    StreetViewComponent,
    TransformToolComponent
  ]
})
export class GisComponentsLibModule {}
