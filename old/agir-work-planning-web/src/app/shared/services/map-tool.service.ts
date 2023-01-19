import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import { IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';
import { ITool } from '@villemontreal/maps-angular-lib/lib/models/tools/tool.model';

import { MapComponent } from '../../map/map.component';
import { WorkAreaService } from './workArea.service';

export enum DrawMode {
  drawPolygon = 'draw_polygon',
  drawPoint = 'draw_point',
  drawLine = 'draw_line_string'
}

@Injectable()
export class MapToolService {
  private mapComponent: MapComponent;
  public get currentTool(): ITool {
    return this.mapComponent?._map?.currentTool;
  }

  constructor(private readonly workAreaService: WorkAreaService) {}

  public init(mapComponent: MapComponent): void {
    this.mapComponent = mapComponent;
  }

  public startGeometryEditor(geometry: IGeometry, doneCallback: (geometry: IGeometry) => void): void {
    this.stopTools();

    const feature = turf.feature(this.workAreaService.simplify(geometry));
    const options = {
      mode: 'simple_select',
      feature
    };
    this.mapComponent._map.useTool('geometry-draw-tool', 'Éditer la forme', e => doneCallback(e.geometry), options);
  }

  public startDrawGeometry(drawMode: DrawMode, doneCallback: (geometry: IGeometry) => void): void {
    this.stopTools();
    const options = {
      mode: drawMode
    };
    this.mapComponent._map.useTool(
      'geometry-draw-tool',
      'Dessinez une géométrie',
      e => doneCallback(e.geometry),
      options
    );
  }

  public stopTools(): void {
    this.mapComponent?._map?.currentTool?.cancel();
  }
}
