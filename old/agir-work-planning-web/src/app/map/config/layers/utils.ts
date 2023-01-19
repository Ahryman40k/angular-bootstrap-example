import { ILayerGroup } from '@villemontreal/maps-angular-lib';
import { LinePaint } from 'mapbox-gl';

import { LayerPostfix, LayerPostfixType, LayerPrefix, LayerPrefixType, LayerType, LayerWidth } from './layer-enums';
import { mapStyleConfig } from './styles';

const { highlight, hover } = mapStyleConfig.colors;
export interface IStyle {
  color: string;
  highlight?: any;
  hover?: any;
  strokeColor: string;
  strokeWidth: number;
}

export interface IKeyValueString {
  [key: string]: string;
}

export interface IKeyValue<T> {
  [key: string]: T;
}

export function getLayerIdsFromLayerGroup(layerGroup: ILayerGroup): string[] {
  const ids: string[] = [];
  for (const key in layerGroup) {
    if (layerGroup.hasOwnProperty(key)) {
      const element = layerGroup[key];
      ids.push(...element.map(x => x.id));
    }
  }
  return ids;
}

export function filterAllFeaturesOut(): mapboxgl.Expression {
  return ['to-boolean', false];
}

export function filterById(idKey: string): mapboxgl.Expression {
  return ['all', ['match', ['to-string', ['get', idKey]], [''], true, false]];
}

export function filterByKeyValue(idKey: string, value: string): mapboxgl.Expression {
  return ['all', ['==', ['to-string', ['get', idKey]], value]];
}

export function filterByGeometryTypeAndById(geometryType: string, idKey = 'id'): mapboxgl.Expression {
  return ['all', ['match', ['to-string', ['get', idKey]], [''], true, false], ['==', ['geometry-type'], geometryType]];
}

export function filterByGeometryType(geometryType: string): mapboxgl.Expression {
  return ['==', ['geometry-type'], geometryType];
}

export function generateLayoutByIconImage(iconImage: string): mapboxgl.SymbolLayout {
  return {
    'icon-image': iconImage,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'icon-pitch-alignment': 'auto',
    'icon-keep-upright': true,
    'icon-size': ['interpolate', ['exponential', 0.1], ['zoom'], 16, 0.7, 17, 0.7, 18, 0.8, 19, 0.9, 20, 1, 21, 1.2]
  };
}

/**
 *  Generate the layout when multiple icons are used for matching values
 *
 * @export
 * @param {string} attributeName attribute property name in the feature to get the value
 * @param {IKeyValueString} iconValues key-value pair ,  key  is the value to match the attribute property and value is the icon name / color to use in the style
 * @param {string} [iconPostfix=''] postfix for the icon,  used  hightlight ,  usually _s for highlight   _h for hover
 * @returns {mapboxgl.SymbolLayout}
 */
export function generateLayoutByIconsImages(
  attributeName: string,
  iconValues: IKeyValueString,
  iconPostfix: string = ''
): mapboxgl.SymbolLayout {
  const matchExpression = buildMatchExpressionFromAttribute(attributeName, iconValues, iconPostfix);

  return {
    'icon-image': matchExpression,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'icon-pitch-alignment': 'auto',
    'icon-keep-upright': true,
    'icon-size': ['interpolate', ['exponential', 0.1], ['zoom'], 16, 0.7, 17, 0.7, 18, 0.8, 19, 0.9, 20, 1, 21, 1.2]
  };
}

/**
 * Build match expression
 * keyValues minimum size is 2
 * @export
 * @param {string} attributeName attribute property name to use on the feature to get the value
 * @param {IKeyValueString} keyValues key-value pair ,  key  is the value to match the attribute property and value is the icon name / color to use in the style
 * @param {string} iconPostfix   postfix for the icon,  used  hightlight ,  usually _s for highlight   _h for hover
 * @returns {*}
 */
export function buildMatchExpressionFromAttribute(
  attributeName: string,
  keyValues: IKeyValueString,
  iconPostfix: string = ''
): any {
  const expr = ['match', ['to-string', ['get', attributeName]]];

  // Exemple Resulting match expression :
  // [
  //   'match',
  //   ['get', attributeName],
  //   'Feu avec contrôleur',
  //   'feuaveccont',
  //   'Feu sans contrôleur',
  //   feusanscont,
  //   /* fallback */ 'intsansfeu'
  // ]

  const keys = Object.keys(keyValues);

  for (let index = 0; index <= keys.length - 1; index++) {
    if (index <= keys.length - 2) {
      expr.push(keys[index]);
      expr.push(`${keyValues[keys[index]]}${iconPostfix}`);
    } else {
      //  'fallback'  of match  expression is the last
      expr.push(`${keyValues[keys[index]]}${iconPostfix}`);
    }
  }

  return expr;
}

export function generateCircleByColor(options: IStyle): object {
  return {
    'circle-radius': {
      base: 100,
      stops: [
        [14, 5],
        [15, 5],
        [16, 5],
        [17, 5],
        [18, 5]
      ]
    },
    'circle-color': options.color,
    'circle-stroke-color': options.strokeColor,
    'circle-stroke-width': options.strokeWidth
  };
}

export function createRoadSectionLayer(id: string, source: string, sourceLayer?: string): mapboxgl.Layer {
  const baseWidth = 9;
  const layer: mapboxgl.Layer = {
    id,
    type: 'line',
    source,
    'source-layer': sourceLayer || '',
    minzoom: 14,
    filter: ['all', ['==', 'inside', 1], ['!=', 'classification', 8]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
      visibility: 'none'
    },
    paint: {
      'line-color': [
        'case',
        ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'highlighted'], false]],
        'rgba(9,125,108,0.5)',
        'rgba(0,0,0,0)'
      ],
      'line-width': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        16,
        baseWidth,
        17,
        baseWidth * 2,
        18,
        baseWidth * 4,
        19,
        baseWidth * 8,
        20,
        baseWidth * 16,
        21,
        baseWidth * 32
      ]
    }
  };
  return layer;
}

/**
 * generate mapbox style for a COMPLETE BASIC layers of type 'line' that include 4 layers
 * with ids:   {layerId},  project-{layerId},   highlight-{layerId},  hover-{layerId}
 *
 * @export
 * @param {string} layerId
 * @param {*} layerSource
 * @param {*} config
 * @returns {mapboxgl.Layer}
 */
export function createCompleteLineLayers(layerId: string, layerSource: string, config: any): mapboxgl.Layer[] {
  const isPattern = config.hasOwnProperty('patternImages');
  const temp: mapboxgl.Layer[] = [
    ...createLineLayer(layerId, layerSource, config, isPattern),
    ...createLineLayer(layerId, layerSource, config, isPattern, config.idKey, LayerPrefix.PROJECT),
    ...createLineLayer(layerId, layerSource, config, isPattern, config.idKey, LayerPrefix.HIGHLIGHT),
    ...createLineHoverLayer(layerId, layerSource, config, isPattern, config.idKey)
  ];

  return temp;
}

/**
 * generate mapbox style for a BASIC layer of type 'line'
 *
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @returns {mapboxgl.Layer}
 */
export function createBasicLineLayer(layerId: string, layerSource: string, config: any): mapboxgl.Layer {
  const attributeName = config.propertyKey; // attribute where to get the value
  const keysValues: IKeyValueString = config.keyValue; // key-value: value of propertyKey and value = color to apply .  For example
  //      'aérien': mapStyleConfigColors.darkerBlue,
  //      'souterrain': mapStyleConfigColors.orange,

  let lineColor: any;

  const minZoom = config.minZoom ? config.minZoom : mapStyleConfig.asset.zoom;

  if (attributeName && keysValues) {
    // line with mutiple line color bases on value of  attribute propertyKey as defined in the config of the layer
    lineColor = buildMatchExpressionFromAttribute(attributeName, keysValues);
  } else {
    lineColor = config.lineColor;
  }

  const temp: mapboxgl.Layer = {
    id: layerId,
    type: LayerType.LINE,
    source: layerSource,
    'source-layer': layerId,
    minzoom: minZoom,
    paint: {
      'line-color': lineColor,
      'line-width': config.lineWidth
    }
  };

  return temp;
}

/**
 * generate mapbox style for a BASIC normal  layer of type 'line'  or a highline line or hover
 * normal line :  as configured
 * highlight line is green  with a filter
 * hover line with color same as config and  with a filter
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @param {string} filterId
 * @param {LayerPrefixType} layerIdPrefix
 * @param {LayerPostfixType} layerIdPostfix
 * @returns {mapboxgl.Layer}
 */
export function createLineLayer(
  layerId: string,
  layerSource: string,
  config: any,
  isPattern: boolean = false,
  filterId: string = '',
  layerIdPrefix: LayerPrefixType = '',
  layerIdPostfix: LayerPostfixType = ''
): mapboxgl.Layer[] {
  const layers: mapboxgl.Layer[] = [];

  const temp: mapboxgl.Layer = createBasicLineLayer(layerId, layerSource, config);

  temp.id = layerIdPrefix ? `${layerIdPrefix}-${layerId}` : layerId;
  temp.id = layerIdPostfix ? `${temp.id}-${layerIdPostfix}` : temp.id;

  if (layerIdPrefix === LayerPrefix.HIGHLIGHT) {
    (temp.paint as LinePaint)['line-color'] = highlight;
  }
  if (filterId) {
    temp.filter = filterById(filterId);
  }
  layers.push(temp);

  // Add a pattern layer over the line llayer
  if (isPattern) {
    const tempPattern: mapboxgl.Layer = createLineLayerPattern(
      layerId,
      layerSource,
      config,
      filterId,
      layerIdPrefix,
      layerIdPostfix
    );
    if (filterId) {
      tempPattern.filter = filterById(filterId);
    }
    layers.push(tempPattern);
  }
  return layers;
}

export function createLineLayerPattern(
  layerId: string,
  layerSource: string,
  config: any,
  filterId: string = '',
  layerIdPrefix: LayerPrefixType = '',
  layerIdPostfix: LayerPostfixType = ''
): mapboxgl.Layer {
  const temp: mapboxgl.Layer = createBasicLineLayer(layerId, layerSource, config);

  temp.id = layerIdPrefix ? `${layerIdPrefix}-${layerId}` : layerId;
  temp.id = layerIdPostfix ? `${temp.id}-${layerIdPostfix}` : temp.id;
  temp.id = `${temp.id}-pattern`;

  (temp.paint as LinePaint)['line-pattern'] = config.patternImages ? config.patternImages.default : '';
  (temp.paint as LinePaint)['line-width'] = [
    'interpolate',
    ['exponential', 0.1],
    ['zoom'],
    16,
    11,
    17,
    12,
    18,
    13,
    19,
    14,
    20,
    15,
    21,
    15
  ];

  if (layerIdPrefix === LayerPrefix.HIGHLIGHT) {
    (temp.paint as LinePaint)['line-pattern'] = config.patternImages ? config.patternImages.highlight : '';
    (temp.paint as LinePaint)['line-color'] = highlight;
  }

  if (filterId) {
    temp.filter = filterById(filterId);
  }
  return temp;
}

/**
 * generate mapbox style for a BASIC HOVER layer of type 'line'
 * hover  line is same color as config but with white  borders
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @param {string} filterId
 * @returns {mapboxgl.Layer}
 */
export function createLineHoverLayer(
  layerId: string,
  layerSource: string,
  config: any,
  isPattern: boolean = false,
  filterId: string = null
): mapboxgl.Layer[] {
  let layers: mapboxgl.Layer[] = [];

  // Create white border
  const border = createLineLayer(
    layerId,
    layerSource,
    config,
    false,
    filterId,
    LayerPrefix.HOVER,
    LayerPostfix.HOVER_BORDER
  )[0];
  (border.paint as LinePaint)['line-color'] = hover;
  (border.paint as LinePaint)['line-width'] = config.lineWidth + LayerWidth.LINE_BORDER;

  // center of the hover layer, same color as configured
  const basicLayer = createLineLayer(layerId, layerSource, config, isPattern, filterId, LayerPrefix.HOVER)[0];

  if (filterId) {
    border.filter = filterById(filterId);
    basicLayer.filter = filterById(filterId);
  }

  layers = [border, basicLayer];
  return layers;
}

/**
 * generate mapbox style for a COMPLETE BASIC layers of type 'polygon' that include 4 layers
 * with ids:   {layerId},  project-{layerId},   highlight-{layerId},  hover-{layerId}
 *
 * @export
 * @param {string} layerId
 * @param {*} layerSource
 * @param {*} config
 * @param {*} createDefaultOutline create a  default outline for the  polygon (for exemple, leadGround layer polygon need an outline on the polygon)
 * @returns {mapboxgl.Layer}
 */
export function createCompletePolygonLayers(
  layerId: string,
  layerSource: string,
  config: any,
  createDefaultOutline: boolean = false
): mapboxgl.Layer[] {
  // Layers order IMPORTANT
  const temp: mapboxgl.Layer[] = [
    createPolygonLayer(layerId, layerSource, config),
    createPolygonOutlineLayer(
      layerId,
      layerSource,
      config,
      config.idKey,
      LayerPrefix.HIGHLIGHT,
      LayerPostfix.HIGHLIGHT_BORDER
    ),
    createPolygonOutlineLayer(layerId, layerSource, config, config.idKey, LayerPrefix.HOVER, LayerPostfix.HOVER_BORDER)
  ];

  // insert the outline if requested
  if (createDefaultOutline) {
    const outline = createPolygonOutlineLayer(layerId, layerSource, config, '', '', LayerPostfix.OUTLINE);
    temp.splice(1, 0, outline);
  }

  return temp;
}

/**
 * generate mapbox style for a BASIC layer of type 'polygon'
 *
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @returns {mapboxgl.Layer}
 */
export function createBasicPolygonLayer(layerId: string, layerSource: string, config: any): mapboxgl.Layer {
  const temp: mapboxgl.Layer = {
    id: layerId,
    source: layerSource,
    'source-layer': layerId,
    type: LayerType.FILL,
    paint: {
      'fill-color': config.color,
      'fill-opacity': config.opacity
    },
    minzoom: mapStyleConfig.asset.zoom
  };

  return temp;
}

/**
 * generate mapbox style for a BASIC layer of type 'line' from a feature that is a POLYGON
 *
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @returns {mapboxgl.Layer}
 */
export function createBasicPolygonOutlineLayer(layerId: string, layerSource: string, config: any): mapboxgl.Layer {
  const temp: mapboxgl.Layer = {
    id: layerId,
    source: layerSource,
    'source-layer': layerId,
    type: LayerType.LINE,
    paint: {
      'line-color': config.lineColor,
      'line-width': config.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  };

  return temp;
}

/**
 * generate mapbox style for a BASIC normal  layer of type 'polygon'  or a highline or hover polygon
 * normal polygon :  as configured
 * highlight polygon is green border with a filter
 * hover polygon is white border with a filter
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @param {string} filterId
 * @param {LayerPrefixType} layerIdPrefix
 * @param {LayerPostfixType} layerIdPostfix
 * @returns {mapboxgl.Layer}
 */
export function createPolygonLayer(
  layerId: string,
  layerSource: string,
  config: any,
  filterId: string = '',
  layerIdPrefix: LayerPrefixType = '',
  layerIdPostfix: LayerPostfixType = ''
): mapboxgl.Layer {
  const temp: mapboxgl.Layer = createBasicPolygonLayer(layerId, layerSource, config);

  temp.id = layerIdPrefix ? `${layerIdPrefix}-${layerId}` : layerId;
  temp.id = layerIdPostfix ? `${temp.id}-${layerIdPostfix}` : temp.id;

  if (layerIdPrefix === LayerPrefix.HIGHLIGHT) {
    (temp.paint as LinePaint)['fill-color'] = highlight;
  }

  switch (layerIdPrefix) {
    case LayerPrefix.HIGHLIGHT:
      (temp.paint as LinePaint)['fill-color'] = highlight;
      break;
    case LayerPrefix.HOVER:
      (temp.paint as LinePaint)['fill-color'] = hover;
      break;
    default:
      break;
  }

  if (filterId) {
    temp.filter = filterById(filterId);
  }
  return temp;
}

/**
 * generate mapbox style for a BASIC normal  layer of type 'polygon'  or a highline or hover polygon
 * normal polygon :  as configured
 * highlight polygon is green border with a filter
 * hover polygon is white border with a filter
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @param {string} filterId
 * @param {LayerPrefixType} layerIdPrefix
 * @param {LayerPostfixType} layerIdPostfix
 * @returns {mapboxgl.Layer}
 */
export function createPolygonOutlineLayer(
  layerId: string,
  layerSource: string,
  config: any,
  filterId: string = '',
  layerIdPrefix: LayerPrefixType = '',
  layerIdPostfix: LayerPostfixType = ''
): mapboxgl.Layer {
  const temp: mapboxgl.Layer = createBasicPolygonOutlineLayer(layerId, layerSource, config);

  temp.id = layerIdPrefix ? `${layerIdPrefix}-${layerId}` : layerId;
  temp.id = layerIdPostfix ? `${temp.id}-${layerIdPostfix}` : temp.id;

  switch (layerIdPrefix) {
    case LayerPrefix.HIGHLIGHT:
      (temp.paint as LinePaint)['line-color'] = highlight;
      break;
    case LayerPrefix.HOVER:
      (temp.paint as LinePaint)['line-color'] = hover;
      break;
    default:
      break;
  }

  if (filterId) {
    temp.filter = filterById(filterId);
  }
  return temp;
}

/**
 * generate mapbox style for a COMPLETE BASIC layers of type 'symbol' that include 4 layers
 * with ids:   {layerId},  project-{layerId},   highlight-{layerId},  hover-{layerId}
 *
 *  Support single icon or multiple icons
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @returns {mapboxgl.Layer[]}
 */
export function createCompleteSymbolLayers(layerId: string, layerSource: string, config: any): mapboxgl.Layer[] {
  const temp: mapboxgl.Layer[] = [
    createSymbolLayer(layerId, layerSource, config, config.icons?.default),
    createSymbolLayer(layerId, layerSource, config, config.icons?.default, '', config.idKey, LayerPrefix.PROJECT),
    createSymbolLayer(
      layerId,
      layerSource,
      config,
      config.icons?.highlight,
      config?.iconPostFixes?.highlight,
      config.idKey,
      LayerPrefix.HIGHLIGHT
    ),
    createSymbolLayer(
      layerId,
      layerSource,
      config,
      config.icons?.hover,
      config?.iconPostFixes?.hover,
      config.idKey,
      LayerPrefix.HOVER
    )
  ];

  return temp;
}

/**
 * generate mapbox style for a BASIC layer of type 'symbol'
 *
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @param {string} iconName
 * @param {string} [iconPostfix=''] postfix for the icon,  usually _s for highlight   _h for hover
 * @returns {mapboxgl.Layer}
 */
export function createBasicSymbolLayer(
  layerId: string,
  layerSource: string,
  config: any,
  iconName: string,
  iconPostfix: string = ''
): mapboxgl.Layer {
  let layout: mapboxgl.SymbolLayout;

  if (!iconName && config.propertyKey && config.iconKeys) {
    // No iconName , it means it is a multiple icons layer

    // The feature property value to get for the icon
    const iconPropertyValue = config.propertyKey;

    // key value for the icon :   value = icon name,   key  =  value of the attribute  'sensible'  on the VTS
    const iconValues: IKeyValueString = config.iconKeys;

    layout = generateLayoutByIconsImages(iconPropertyValue, iconValues, iconPostfix);
  } else {
    // Single icon layer
    layout = generateLayoutByIconImage(`${iconName}`);
  }

  const temp: mapboxgl.Layer = {
    id: layerId,
    source: layerSource,
    'source-layer': layerId,
    type: LayerType.SYMBOL,
    layout,
    minzoom: mapStyleConfig.asset.zoom
  };
  return temp;
}

/**
 * generate mapbox style for a BASIC normal  layer of type 'symbol'  or a highline line or hover
 * normal symbol :  as configured
 * highlight symbol   with a filter
 * hover symbol  with a filter
 * @export
 * @param {string} layerId
 * @param {string} layerSource
 * @param {*} config
 * @param {string} iconName
 * @param {string} [iconPostfix=''] postfix for the icon,  usually _s for highlight   _h for hover
 * @param {string} idKey if specified add a filter by the idKey, default no filter
 * @param {LayerPrefixType} layerIdPrefix if specified add a prefix to the id, default no prefix
 * @param {LayerPostfixType} layerIdPostfix if specified add a postfix to the id, default no postfix
 * @returns {mapboxgl.Layer}
 */
export function createSymbolLayer(
  layerId: string,
  layerSource: string,
  config: any,
  iconName: string,
  iconPostfix: string = '',
  idKey: string = '',
  layerIdPrefix: LayerPrefixType = '',
  layerIdPostfix: LayerPostfixType = ''
): mapboxgl.Layer {
  const temp: mapboxgl.Layer = createBasicSymbolLayer(layerId, layerSource, config, iconName, iconPostfix);

  temp.id = layerIdPrefix ? `${layerIdPrefix}-${layerId}` : layerId;
  temp.id = layerIdPostfix ? `${temp.id}-${layerIdPostfix}` : temp.id;

  if (idKey) {
    temp.filter = filterById(idKey);
  }
  return temp;
}
