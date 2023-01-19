import { MapLayersSources } from '../../map-enums';
import { mapStyleConfig } from '../../styles';

export function createCountByLayer(
  id: string,
  icon: string,
  source: MapLayersSources,
  opacityExpression?: any
): mapboxgl.Layer {
  const layer: mapboxgl.Layer = {
    id,
    minzoom: mapStyleConfig.boroughCount.minZoom,
    maxzoom: mapStyleConfig.boroughCount.maxZoom,
    source,
    type: 'symbol',
    layout: {
      'icon-image': icon,
      'icon-anchor': 'bottom',
      'text-field': [
        'case',
        ['>=', ['get', 'displayCount'], 1000],
        ['format', ['get', 'displayCount'], { 'font-scale': 0.75 }, '\n', {}],
        ['>=', ['get', 'displayCount'], 100],
        ['format', ['get', 'displayCount'], { 'font-scale': 0.9 }, '\n', {}],
        ['format', ['get', 'displayCount'], { 'font-scale': 1 }, '\n', {}]
      ],
      'text-font': ['OpenSans-Bold'],
      'text-size': 12,
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.05,
      'text-offset': ['case', ['>=', ['get', 'displayCount'], 100], ['literal', [0, -0.8]], ['literal', [0, -1]]],
      'text-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-allow-overlap': true,
      'text-ignore-placement': true
    },
    paint: {
      'text-color': mapStyleConfig.colors.white,
      'text-opacity': opacityExpression,
      'icon-opacity': opacityExpression
    }
  };
  return layer;
}
