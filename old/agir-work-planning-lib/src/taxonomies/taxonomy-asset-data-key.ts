import { ITaxonomy } from '../planning';

export interface ITaxonomyAssetDataKeyProperties {
  /**
   * The name of the key in a feature from the WFS service
   *
   * Examples:
   *  - dateInstallation
   *  - etatDeService
   */
  geomaticKey: string;

  /**
   * Name of the key in the properties of an asset
   *
   * Examples:
   *  - installationDate
   *  - serviceStatus
   */
  assetKey: string;

  /**
   * Unit of mesure
   *
   * Examples:
   *  - in
   *  - m2
   */
  unit?: string;
}

export interface ITaxonomyAssetDataKey extends ITaxonomy {
  properties: ITaxonomyAssetDataKeyProperties;
}
