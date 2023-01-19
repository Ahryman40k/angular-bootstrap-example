import { Layer, Map as MapboxMap, Style } from 'mapbox-gl';
import { ILogicLayer } from '../models';
import { ILayerConfig } from '../models/layer-config.model';
import { ILayerGroup } from '../models/layer-manager/layer-group';
import { ISources } from '../models/sources';
import { IThemeMapbox } from '../models/theme-of-layer';
import { StyleResolver } from './style-resolver';

// NOTE: Ce service n'est plus injectable puisqu'il conserve des états propres à chaque carte

/**
 *
 * Permet de gérer la visibilité des couches logiques
 * Permet de lister les styles mapbox à partir d'un id de couche logique
 * Permet d'associer une couche mapbox à un id de couche logique
 * Calcul le min/max zoom à partir des styles mapbox
 */
export class StyleManagerService {
  // Style Resolver
  private styleResolver: StyleResolver;
  private themeIndex: { [logicalId: string]: IThemeMapbox[] } = {};
  private currentThemesIndex: { [logicalId: string]: string } = {};

  /**
   * Create a mapbox style from a list of logical layers and the customs layers/sources
   * @param logicalLayersUsedInMap La liste des couches logiques qui seront disponible sur la carte
   * @param sources
   * @param layers
   * @param baseUrl
   */
  public async buildStyle(
    logicalLayersUsedInMap: (string | ILayerConfig)[],
    sources: ISources, // TODO: Est-ce qu'il s'agit des CUSTOM sources ?
    layers: ILayerGroup,
    baseUrl: string,
    spriteName: string = 'gis-web'
  ): Promise<Style> {
    this.styleResolver = new StyleResolver(sources, layers, baseUrl, spriteName);

    for (const logicalLayer of logicalLayersUsedInMap) {
      const layerConfig = this.createLayerConfig(logicalLayer);
      const layerGroup = layerConfig.layerName;

      const themes: IThemeMapbox[] = this.styleResolver.getThemesFromLogicalLayerIds(layerGroup);
      if (themes === undefined) {
        throw new Error(`the layer group '${layerGroup}' was not added to the map: no description was provided`);
      }

      this.createThemeIndex(themes, layerConfig);

      for (const theme of themes) {
        if (theme.layers === null) {
          // tslint:disable-next-line: no-console
          console.warn('Attention theme sans layer', theme);
        }
        for (const mapboxLayer of theme.layers) {
          this.addLayer(mapboxLayer, layerConfig, theme);
        }
      }
    }

    const fullStyle = this.styleResolver.getMapStyle();
    return Promise.resolve(fullStyle);
  }

  private addLayer(mapboxLayer: Layer, layerConfig: ILayerConfig, theme: IThemeMapbox) {
    this.addSourceToMapboxStyleIfNeeded(mapboxLayer);
    // TODO: Mettre dans une fonction
    // Ajustement de la visibilité et des niveau de zoom
    if (!mapboxLayer.layout) {
      mapboxLayer.layout = {};
    }
    if (theme.themeId === layerConfig.theme) {
      mapboxLayer.layout.visibility = layerConfig.visible ? 'visible' : 'none';
    } else {
      // Don't show non-visible theme
      mapboxLayer.layout.visibility = 'none';
    }
    // TODO: Allow min & max zoom overrides
    // layer.minzoom = 2;
    // layer.maxzoom = 2;

    // adds the layer to the style
    this.styleResolver.addLayer(mapboxLayer);
  }

  private createThemeIndex(themes: IThemeMapbox[], layerConfig: ILayerConfig) {
    themes.forEach(theme => {
      // Permet d'associer une couche logique à une liste de theme
      if (!this.themeIndex.hasOwnProperty(theme.logicalLayerId)) {
        this.themeIndex[theme.logicalLayerId] = [] as IThemeMapbox[];
      }
      this.themeIndex[theme.logicalLayerId].push(theme);

      if (theme.themeId === layerConfig.theme) {
        this.currentThemesIndex[theme.logicalLayerId] = theme.themeId;
      }
    });
  }

  public getCurrentTheme(logicLayerId: string) {
    return this.currentThemesIndex[logicLayerId];
  }

  public setCurrentTheme(logicLayerId: string, currentTheme) {
    // TODO: qualité: on pourrait valider que le theme fait parti de la liste de themes
    return (this.currentThemesIndex[logicLayerId] = currentTheme);
  }

  /**
   * Create a logical layer configartation with default values applied.
   *
   * Here's the default values
   * visible: true
   * theme: 'default'
   * @param layerGroupStringOrConfig
   */
  private createLayerConfig(layerGroupStringOrConfig: string | ILayerConfig): ILayerConfig {
    const defaultThemeId = 'default';
    if (typeof layerGroupStringOrConfig === 'string') {
      return {
        layerName: layerGroupStringOrConfig,
        visible: true,
        theme: defaultThemeId
      };
    }
    // Cloner pour ne pas modifier l'instance orignale
    const layerConfig = this.clone(layerGroupStringOrConfig as ILayerConfig);
    // Add default values
    if (!layerConfig.theme) {
      layerConfig.theme = defaultThemeId;
    }
    return layerConfig;
  }

  private addSourceToMapboxStyleIfNeeded(layer: Layer) {
    // Add the layer's source to the style if neededd
    if (layer.hasOwnProperty('source')) {
      if (!this.styleResolver.isSourceKnown(layer.source as string)) {
        throw new Error(
          `Layer '${layer.id}' was not added to the style because it provides an unknown source reference: ${
            layer.source
          }.`
        );
      } else {
        if (!this.styleResolver.isSourceInStyle(layer.source as string)) {
          this.styleResolver.addSource(layer.source);
        }
      }
    }
  }

  private clone<T>(object: T) {
    // TODO Cheap clone implementation.
    return JSON.parse(JSON.stringify(object)) as T;
  }

  /**
   * Returns the Mapbox Layer IDs from logic layers
   *
   * @param logicalLayer an array from the logic layer names
   * @param sources the custom sources
   * @param layerGroups the custom logic layers
   */
  public getMapboxLayerIdsFromLogicLayer(logicLayers: string[]): string[] {
    let layers: Layer[] = [];
    // TODO: Make sure the logic layer exists in the list
    for (const logicLayer of logicLayers) {
      const mapboxLayers = this.getMapboxLayerFromLogicLayerNoMapNeeded(logicLayer);

      layers = layers.concat(mapboxLayers);
    }

    const layerIds: string[] = layers.map((layer: Layer) => {
      if (!layer) {
        // tslint:disable-next-line: no-console
        console.warn('Attention, layer null', logicLayers, layer);
      }
      if (!layer.id) {
        // tslint:disable-next-line: no-console
        console.warn('Attention, layer sans id', logicLayers, layer);
      }
      return layer.id;
    });
    return layerIds;
  }

  /**
   * Returns the Mapbox Layer IDs from logic layers
   *
   * @param logicalLayer an array from the logic layer names
   * @param sources the custom sources
   * @param layerGroups the custom logic layers
   */
  public getMapboxLayerIdsFromLogicLayerAllTheme(logicLayers: string[]): string[] {
    let layers: Layer[] = [];
    // TODO: Make sure the logic layer exists in the list
    for (const logicLayer of logicLayers) {
      const mapboxLayers = this.getMapboxLayerFromLogicLayerAllTheme(logicLayer);
      layers = layers.concat(mapboxLayers);
    }

    const layerIds: string[] = layers.map((layer: Layer) => {
      if (!layer.id) {
        // tslint:disable-next-line: no-console
        console.warn('Attention, layer sans id', logicLayers, layer);
      }
      return layer.id;
    });
    return layerIds;
  }

  private getMapboxLayerFromLogicLayerNoMapNeeded(logicalLayerId: string) {
    const currentTheme = this.getCurrentTheme(logicalLayerId);
    const themes = this.themeIndex[logicalLayerId];
    if (!themes) {
      return null;
    }
    return themes.find(t => t.themeId === currentTheme).layers;
  }

  private getMapboxLayerFromLogicLayer(mapboxMap: MapboxMap, logicalLayerId: string) {
    const currentTheme = this.getCurrentTheme(logicalLayerId);
    const themes = this.themeIndex[logicalLayerId];
    if (!themes) {
      return null;
    }
    return themes.find(t => t.themeId === currentTheme).layers;
  }

  private getMapboxLayerFromLogicLayerAllTheme(logicalLayerId: string) {
    const themes = this.themeIndex[logicalLayerId];

    if (!themes) {
      return null;
    }

    return themes.reduce((previous, current) => {
      return previous.concat(current.layers);
    }, []);
  }

  /**
   * Gets logic layer id from mapbox layer id
   * @param mapboxLayerId
   * @param sources
   * @param layerGroups
   * @returns logic layer id from mapbox layer id
   */
  public getLogicLayerIdFromMapboxLayerId(mapboxLayerId: string): string | null {
    return this.styleResolver.getLayerGroupIdByMapboxLayerId(mapboxLayerId);
  }

  /**
   * Returns true if at least one of mapbox layers is visible
   *
   * @param logicalLayer an array of the logic layer names
   * @param sources the custom sources
   * @param layerGroups the custom logic layers
   */
  public isLogicLayerVisible(mapboxMap: MapboxMap, logicLayerId: string): boolean {
    let layers: Layer[] = [];
    const mapboxLayers = this.getMapboxLayerFromLogicLayer(mapboxMap, logicLayerId);
    layers = layers.concat(mapboxLayers);
    return layers.every(layer => {
      const visibility = mapboxMap.getLayoutProperty(layer.id, 'visibility');
      return visibility === 'visible';
    });
  }

  /**
   * Looks up the mapbox layers' max zoom in the Logic Layer and returns the highest max zoom
   * @param logicLayerId
   */
  public getLayerMaxZoom(logicLayerId: ILogicLayer['logicLayerId']): number {
    let logicLayerMaxZoom: number;
    let layers: Layer[] = [];
    const mapboxLayers = this.getMapboxLayerFromLogicLayerNoMapNeeded(logicLayerId);

    layers = layers.concat(mapboxLayers);

    for (const layer of layers) {
      if (!layer.maxzoom) {
        logicLayerMaxZoom = null;
        break;
      }

      if (layer.maxzoom && !logicLayerMaxZoom) {
        logicLayerMaxZoom = layer.maxzoom;
      }

      if (layer.maxzoom && layer.maxzoom > logicLayerMaxZoom) {
        logicLayerMaxZoom = layer.maxzoom;
      }
    }

    return logicLayerMaxZoom;
  }

  /**
   * Retourne les styles mapbox de la couche logique en utilisant le theme actuellement utilisé de la couche
   */
  public getMapboxLayersFromLogicalId(mapboxMap, logicLayerId: string): Layer[] {
    return this.getMapboxLayerFromLogicLayer(mapboxMap, logicLayerId);
  }

  /**
   * Looks up the mapbox layers' min zoom in the Logic Layer and returns the smallest min zoom
   * @param logicLayerId
   */
  public getLayerMinZoom(logicLayerId: ILogicLayer['logicLayerId']): number {
    let logicLayerMinZoom: number;
    let layers: Layer[] = [];
    const mapboxLayers = this.getMapboxLayerFromLogicLayerNoMapNeeded(logicLayerId);

    layers = layers.concat(mapboxLayers);

    for (const layer of layers) {
      if (!layer.minzoom) {
        logicLayerMinZoom = null;
        break;
      }

      if (layer.minzoom && !logicLayerMinZoom) {
        logicLayerMinZoom = layer.minzoom;
      }

      if (layer.minzoom && layer.minzoom < logicLayerMinZoom) {
        logicLayerMinZoom = layer.minzoom;
      }
    }

    return logicLayerMinZoom;
  }
}
