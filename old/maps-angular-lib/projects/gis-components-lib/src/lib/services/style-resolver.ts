import { Layer, Style } from 'mapbox-gl';

import { globalMapLayers as globalMapLayersHardCoded } from '../style-definitions/global-style-layers';
import { globalMapSources as globalMapSourcesHardCoded } from '../style-definitions/global-style-sources';

import { ILayerGroup } from '../models/layer-manager/layer-group';
import { ISources } from '../models/sources';
import { IThemeMapbox } from '../models/theme-of-layer';

const version = 8;

// const glyphs = '/api/it-platforms/geomatic/map-assets/v1/fonts/{fontstack}/{range}.pbf';
// const sprite = '/api/it-platforms/geomatic/map-assets/v1/sprites/gis-web';

/**
 * Permet de construire un style mapbox. Permet résoudre un nom de couche logique vers les couches mapbox. Les sources et couches
 * passées en paramètre sont les données "custom" qui ne sont pas servies par le serveur de style.
 *
 */
export class StyleResolver {
  private mapStyle: Style;
  private globalMapLayers: ILayerGroup;
  private globalMapSources: ISources;

  constructor(
    private customSources: ISources,
    private customLayers: ILayerGroup,
    private baseUrl: string,
    private spriteName: string
  ) {
    this.globalMapLayers = JSON.parse(JSON.stringify(globalMapLayersHardCoded));
    this.globalMapSources = JSON.parse(JSON.stringify(globalMapSourcesHardCoded));

    this.mapStyle = {
      version,
      name,
      glyphs: this.getGlyphs(),
      sprite: this.getSprite(),
      sources: {},
      layers: []
    };
  }

  public getMapStyle(): Style {
    return this.mapStyle;
  }

  public getVersion(): number {
    return version;
  }

  public getGlyphs(): string {
    return this.baseUrl + '/api/it-platforms/geomatic/map-assets/v1/fonts/{fontstack}/{range}.pbf';
  }

  public getSprite(): string {
    return this.baseUrl + '/api/it-platforms/geomatic/map-assets/v1/sprites/' + this.spriteName;
  }

  /**
   * Returns the defintion of a source.
   *
   * It checks in the custom sources first, then in the default ones.
   * This enables to define custom sources with the same name as the default ones.
   *
   * @param id the source ID (name)
   */
  public getSourceById(id: string): any {
    if (!(this.customSources[id] === undefined)) {
      return this.customSources[id];
    }
    if (!(this.globalMapSources[id] === undefined)) {
      return this.globalMapSources[id];
    }
    return;
  }

  /**
   * Returns the defintion of a layer from its logical.id
   *
   * It checks in the custom layers first, then in the default ones.
   * This enables to define custom layers with the same name as the default ones.
   *
   * @param id the layer ID (name)
   */
  public getLayersByLayerGroupId(id: string): Layer[] {
    if (!(this.customLayers[id] === undefined)) {
      return this.customLayers[id];
    }

    if (!(this.globalMapLayers[id] === undefined)) {
      return this.globalMapLayers[id];
    }

    return undefined;
  }

  public getThemesFromLogicalLayerIds(id: string): IThemeMapbox[] {
    let mapboxStyleORTheme = null;
    if (!(this.customLayers[id] === undefined)) {
      mapboxStyleORTheme = this.customLayers[id];
    }

    if (!mapboxStyleORTheme && !(this.globalMapLayers[id] === undefined)) {
      mapboxStyleORTheme = this.globalMapLayers[id];
    }

    if (!mapboxStyleORTheme) {
      // tslint:disable-next-line: no-console
      console.warn('Theme not found for', id);
    }

    if (
      Array.isArray(mapboxStyleORTheme) &&
      mapboxStyleORTheme.length > 0 &&
      mapboxStyleORTheme[0].hasOwnProperty('themeId')
    ) {
      // On a détecter qu'il s'agit d'un theme
      //   - on ajoute le logicalLayerId
      mapboxStyleORTheme.forEach(el => {
        el.logicalLayerId = id;
      });

      return mapboxStyleORTheme;
    }
    // Il s'agit d'une liste de style mapbox
    return [
      {
        logicalLayerId: id,
        themeId: 'default',
        name: 'Défaut',
        layers: mapboxStyleORTheme
      }
    ];
  }

  /**
   * Gets layer group id by mapbox layer id
   * @param mapboxLayerId
   * @returns layer group id by mapbox layer id
   */
  public getLayerGroupIdByMapboxLayerId(mapboxLayerId: string): string | null {
    const customLayerGroup: string = this.getLayerGroupId(mapboxLayerId, this.customLayers);
    return customLayerGroup ? customLayerGroup : this.getLayerGroupId(mapboxLayerId, this.globalMapLayers);
  }

  /**
   * Gets layer group id
   * @param mapboxLayerId
   * @param layerGroup
   * @returns layer group id
   */
  private getLayerGroupId(mapboxLayerId: string, layerGroup: ILayerGroup): string | null {
    for (const layerGroupId in layerGroup) {
      if (layerGroup.hasOwnProperty(layerGroupId)) {
        for (const mapboxLayer of layerGroup[layerGroupId]) {
          if (mapboxLayer.id === mapboxLayerId) return layerGroupId;
        }
      }
    }
    return null;
  }

  /**
   * Returns true/false if the source is defined inurces the global source or the custom so
   * @param sourceName The source name
   */
  public isSourceKnown(sourceName: string): boolean {
    if (this.getSourceById(sourceName) === undefined) {
      return false;
    }
    return true;
  }

  /**
   *
   * Add a source to the mapbox style being built. the url is going to be prefixed by the base URL
   * @param source
   */
  public addSource(source: Layer['source']) {
    const sourceName = source as string;
    const sourceDefinition = { ...this.getSourceById(sourceName) };
    if (sourceDefinition && sourceDefinition.url) {
      sourceDefinition.url = this.baseUrl + sourceDefinition.url;
    }
    this.mapStyle.sources[sourceName] = sourceDefinition;
  }

  /**
   * Add a layer to the mapbox style being built.
   * @param layer
   */
  public addLayer(layer: Layer) {
    this.mapStyle.layers.push(layer);
  }

  /**
   * Returns true/false if the id of the source is present in the mapbox style being built.
   * @param source
   */
  public isSourceInStyle(source: string) {
    if (source in this.mapStyle.sources) {
      return true;
    }
    return false;
  }
}
