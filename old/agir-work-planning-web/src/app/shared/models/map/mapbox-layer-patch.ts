import {
  AnySourceData,
  BackgroundLayout,
  BackgroundPaint,
  CircleLayout,
  CirclePaint,
  FillExtrusionLayout,
  FillExtrusionPaint,
  FillLayout,
  FillPaint,
  HeatmapLayout,
  HeatmapPaint,
  HillshadeLayout,
  HillshadePaint,
  LineLayout,
  LinePaint,
  RasterLayout,
  RasterPaint,
  SymbolLayout,
  SymbolPaint
} from 'mapbox-gl';

/**
 * Copy of mapboxgl.Layer interface minus the id property to support patch updates.
 */
export interface IMapboxLayerPatch {
  type?: 'fill' | 'line' | 'symbol' | 'circle' | 'fill-extrusion' | 'raster' | 'background' | 'heatmap' | 'hillshade';

  metadata?: any;
  ref?: string;

  source?: string | AnySourceData;

  'source-layer'?: string;

  minzoom?: number;
  maxzoom?: number;

  interactive?: boolean;

  filter?: any[];
  layout?:
    | BackgroundLayout
    | FillLayout
    | FillExtrusionLayout
    | LineLayout
    | SymbolLayout
    | RasterLayout
    | CircleLayout
    | HeatmapLayout
    | HillshadeLayout;
  paint?:
    | BackgroundPaint
    | FillPaint
    | FillExtrusionPaint
    | LinePaint
    | SymbolPaint
    | RasterPaint
    | CirclePaint
    | HeatmapPaint
    | HillshadePaint;
}
