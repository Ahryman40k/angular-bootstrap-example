import * as MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';
import { Map as MapboxMap } from 'mapbox-gl';
import { DrawControls, IDrawControls, SUPPORTED_DRAW_CONTROLS } from '../models/draw';

export class DrawService {
  public mapboxDrawInstance: MapboxDraw;

  // Doc on Draw modes: https://github.com/mapbox/mapbox-gl-draw/blob/master/docs/MODES.md
  public mapboxDrawProperties: any;

  private map: MapboxMap;

  constructor(map: MapboxMap) {
    this.map = map;
  }

  public init(drawProperties: any) {
    if (this.mapboxDrawInstance) {
      this.map.removeControl(this.mapboxDrawInstance);
    }

    this.mapboxDrawInstance = new MapboxDraw(drawProperties);
    this.map.addControl(this.mapboxDrawInstance);
  }

  /**
   * Adds mode
   * @param modeName
   * @param mode
   */
  public useMode(modeName: string, optionsMode: any): void {
    this.mapboxDrawInstance.changeMode(modeName, optionsMode);
  }

  public getAll() {
    return this.mapboxDrawInstance.getAll();
  }

  public getSupportedControls(controls: string[]): IDrawControls {
    let drawControls: IDrawControls = null;

    if (!controls) {
      return null;
    }
    // Get the matching supported controls
    const result = controls.filter(control => SUPPORTED_DRAW_CONTROLS.includes(control as DrawControls));

    // Create the controls object
    if (result.length) {
      drawControls = {};
      result.forEach(control => (drawControls[control] = true));
    }

    return drawControls;
  }

  public reset(drawProperties: any) {
    this.init(drawProperties);
  }
}
