import { ITaxonomy } from '../planning';

export interface ITaxonomyAssetTypeDataKey {
  code: string;
  isMainAttribute: boolean;
  displayOrder?: number;
}

export interface ITaxonomyAssetTypeProperties {
  /**
   * The asset work types taxonomy codes.
   *
   * Examples:
   * - ['amenagement', 'canope']
   */
  workTypes: string[];
  /**
   * The asset owners taxonomy codes.
   *
   * Examples:
   * - ['csem', 'bell', 'energir', 'hq']
   */
  owners: string[];
  /**
   * The asset namespace.
   *
   * Examples:
   * - montreal
   * - secured
   */
  namespace: string;
  /**
   * The sources layer ID.
   * Matches the layer identifier for VTS and WFS.
   */
  sourcesLayerId: string;
  /**
   * The identifier's key.
   *
   * For example, the "aqueducs" asset type has an identifier key of "idGcaf" instead of "id".
   */
  idKey: string;

  /**
   * layer is only for consultation
   */
  consultationOnly: boolean;

  dataKeys: ITaxonomyAssetTypeDataKey[];
}

export interface ITaxonomyAssetType extends ITaxonomy {
  properties: ITaxonomyAssetTypeProperties;
}
