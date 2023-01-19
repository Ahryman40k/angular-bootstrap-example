import { buffer, Feature, feature, Polygon, polygon, simplify } from '@turf/turf';
import {
  AssetExpand,
  AssetType,
  IAsset,
  IAssetsWorkAreaSearchRequest,
  IFeature,
  IFeatureCollection,
  IGeometry,
  ITaxonomy,
  ITaxonomyAssetDataKey,
  ITaxonomyAssetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { cloneDeep, groupBy, isEmpty, isEqual } from 'lodash';

import { constants } from '../../config/constants';
import { assetMapperDTO } from '../features/asset/mappers/assetMapperDTO';
import { Asset, IAssetProps } from '../features/asset/models/asset';
import { taxonomyService } from '../features/taxonomies/taxonomyService';
import { IGroup } from '../models/group';
import { Guard } from '../shared/logic/guard';
import { Result } from '../shared/logic/result';
import { IKeyAndValue } from '../utils/utils';
import { spatialAnalysisService } from './spatialAnalysisService';
import { AnalysisLayerIds } from './spatialAnalysisService/spatialAnalysisEnum';
import { workAreaService } from './workAreaService';

const DEFAULT_ASSET_BUFFER_METERS = 5;

/**
 * The assets search criterias.
 */
export interface IAssetSearchItem {
  id: string;
  type: string;
}

class AssetService {
  public async getAssetsResults(searchRequest: IAssetsWorkAreaSearchRequest): Promise<IKeyAndValue<Result<Asset>>> {
    // Dictionary<assetId, Result<Asset>>
    const result: IKeyAndValue<Result<Asset>> = {};
    // Dictionary<type, IAssetSearchItem>
    const assetsByType = groupBy<IAssetSearchItem>(searchRequest.assets, t => t.type);
    // tslint:disable-next-line: forin
    for (const assetType in assetsByType) {
      const assetIds = assetsByType[assetType].map(el => el.id);
      const assetTaxonomy = await this.getTaxonomyAssetType(assetType);
      if (!assetTaxonomy || !assetTaxonomy.properties.sourcesLayerId) {
        assetIds.forEach(assetId => {
          result[assetId] = Result.fail(
            Guard.errorNotFound({
              argument: assetType,
              argumentName: `${assetType} no usable for asset search`
            })
          );
        });
        continue;
      }
      const sourceLayerId = `${assetTaxonomy.properties.namespace}:${assetTaxonomy.properties.sourcesLayerId}`;
      const wfsFeaturesResult = await spatialAnalysisService.getFeaturesByIds(
        assetIds,
        assetTaxonomy.properties.idKey,
        [sourceLayerId]
      );
      if (wfsFeaturesResult.isFailure) {
        assetIds.forEach(assetId => {
          result[assetId] = wfsFeaturesResult as Result<any>;
        });
        continue;
      }
      const wfsFeatures = wfsFeaturesResult.getValue();

      for (const wfsFeature of wfsFeatures) {
        let assetProps = (await this.wfsFeatureToAsset(
          wfsFeature,
          searchRequest.expand as AssetExpand[]
        )) as IAssetProps;
        assetProps = await this.expandAsset(assetProps, searchRequest.expand as AssetExpand[]);
        result[assetProps.id] = Asset.create(assetProps);
      }
      for (const assetId of assetIds) {
        if (!Object.keys(result).includes(assetId)) {
          result[assetId] = Result.fail<Asset>(
            Guard.errorNotFound({
              argument: assetId,
              argumentName: `${assetId} asset id was not found`
            })
          );
        }
      }
    }
    return result;
  }

  // TODO should be removed when intevrentions and project are refactored
  // and use assetMapperDTO already ready
  public async enrichAssetsWithWfs(assets: IAsset[], expand: AssetExpand[] = []): Promise<IAsset[]> {
    const enrichableAssets: Asset[] = [];
    // asset instanciation has failed for any reason but we still want the assets
    const unEnrichableAssets: IAsset[] = [];
    for (const asset of assets) {
      const assetResult = Asset.create(asset as IAssetProps);
      if (assetResult.isFailure) {
        unEnrichableAssets.push(asset);
      } else {
        enrichableAssets.push(assetResult.getValue());
      }
    }

    const enrichedAssetsDTO = await assetMapperDTO.getFromModels(enrichableAssets, { expand });
    const finalArray = [...unEnrichableAssets, ...enrichedAssetsDTO];
    // return in same order as input
    return assets.map(asset => {
      return finalArray.find(a => {
        return (
          (a.id && asset.id && a.id === asset.id) ||
          (a.typeId === asset.typeId && a.ownerId === asset.ownerId && isEqual(a.geometry, asset.geometry))
        );
      });
    });
  }

  private async expandAsset(assetProps: IAssetProps, expand: AssetExpand[]): Promise<IAssetProps> {
    if (isEmpty(expand)) {
      return assetProps;
    }
    const expandWorkArea = expand.includes(AssetExpand.workArea);
    const expandSuggestedStreetName = expand.includes(AssetExpand.suggestedStreetName);
    const expandRoadSections = expand.includes(AssetExpand.roadSections);

    if (expandWorkArea || expandSuggestedStreetName || expandRoadSections) {
      const workArea: IFeature = await this.getWorkArea(feature(assetProps.geometry));

      if (expandWorkArea) {
        assetProps.workArea = workArea;
      }

      if (expandSuggestedStreetName || expandRoadSections) {
        const roadSections: IFeatureCollection = await this.getRoadSections(workArea);
        if (expandRoadSections) {
          assetProps.roadSections = roadSections;
        }

        if (expandSuggestedStreetName) {
          assetProps.suggestedStreetName = spatialAnalysisService.getSuggestedName(roadSections);
        }
      }
    }
    return assetProps;
  }

  /**
   * Get roadSections
   * @param workArea
   * @returns IFeatureCollection | null
   */
  public async getRoadSections(workArea: IFeature): Promise<IFeatureCollection> {
    if (workArea && workArea.hasOwnProperty('geometry')) {
      const simplifiedGeometry = simplify(workArea.geometry);
      const roadSections = (await spatialAnalysisService.getLayerIntersectingFeatures(
        simplifiedGeometry,
        AnalysisLayerIds.roadSections
      )) as IFeatureCollection;
      if (roadSections) {
        return {
          type: 'FeatureCollection',
          features: roadSections.features.map(f => ({
            type: 'Feature',
            id: f.id,
            geometry: f.geometry,
            properties: f.properties
          }))
        } as IFeatureCollection;
      }
    }
    return null;
  }

  /**
   * Gets the work area of the asset.
   * Retrieves all the nearby pavement sections and intersections.
   * When the asset is a point, we retrieve the closest road or intersection.
   * When the asset is not a point, we retrieve all the roads and intersections that it touches.
   * @param assetFeature The feature representing the asset.
   * @returns Promise of the final work area.
   */
  public async getWorkArea(assetFeature: IFeature, pavementFeatures?: IFeature[]): Promise<IFeature> {
    if (['Polygon', 'MultiPolygon'].includes(assetFeature.geometry.type)) {
      return cloneDeep(assetFeature);
    }

    let pavementFs = pavementFeatures;
    if (!pavementFs) {
      pavementFs = await spatialAnalysisService.getLayerNearbyFeatures(
        assetFeature.geometry,
        AnalysisLayerIds.pavementSections,
        AnalysisLayerIds.intersections
      );
    }

    // If no features have been found, we return a null work area.
    if (!pavementFs || !pavementFs.length) {
      return this.getDefaultWorkArea(assetFeature);
    }

    let sourceFeatures: IFeature[];

    // When the asset is a point we retrieve the nearest road or intersection.
    if (assetFeature.geometry.type === 'Point') {
      sourceFeatures = this.assetNearestFeature(assetFeature, pavementFs);
    } else {
      // We retrieve all the features (pavement sections and intersections) that touch the asset.
      sourceFeatures = spatialAnalysisService.intersectedFeatures(assetFeature, pavementFs);
      // If nothing touches the asset, we try to retrieve the closest road or intersection.
      if (!sourceFeatures || !sourceFeatures.length) {
        sourceFeatures = this.assetNearestFeature(assetFeature, pavementFs);
      }
    }

    // If no features found, return null
    if (!sourceFeatures || !sourceFeatures.length) {
      return this.getDefaultWorkArea(assetFeature);
    }

    let workArea = this.combineWorkAreaFeatures(sourceFeatures, pavementFs);
    // convert multipolygon to polygon
    if (workArea) {
      if (workArea.geometry.type.toString() === 'MultiPolygon') {
        workArea = spatialAnalysisService.multiPolygonToPolygon(workArea);
      } else if (workArea.geometry.coordinates.length > 1) {
        // If the the geom is a polygon but contains more than one polygon area, we keep the first one.
        workArea = polygon([workArea.geometry.coordinates[0] as number[][]]);
      }
    }
    return workArea;
  }

  /**
   * Retrieves the asset owner based on the asset type.
   * @param type The asset type
   */
  public async getOwnerId(type: AssetType): Promise<string> {
    const taxonomy = await this.getTaxonomyAssetType(type);
    return taxonomy.properties.owners[0];
  }

  private assetNearestFeature(sourceFeature: IFeature, nearbyFeatures: IFeature[]): IFeature[] {
    const nearestFeature = spatialAnalysisService.nearestFeature(
      sourceFeature as any,
      nearbyFeatures,
      constants.assets.workArea.featuresMaxDistance
    );
    return nearestFeature ? [nearestFeature] : null;
  }

  /**
   * Combines the found pavement sections and intersection to
   * retrieve the full road or intersection.
   * @param sourceFeatures The source feature
   * @param nearbyFeatures The nearby features
   */
  public combineWorkAreaFeatures(sourceFeatures: IFeature[], nearbyFeatures: IFeature[]): IFeature {
    let featuresToCombine: IFeature[] = [];
    for (const sourceFeature of sourceFeatures) {
      if (sourceFeature.properties.roadId) {
        // Roads
        // We can retrieve the road features by filtering with the road ID.
        featuresToCombine = featuresToCombine.concat(
          nearbyFeatures.filter(x => x.properties.roadId === sourceFeature.properties.roadId)
        );
      } else {
        // Intersections
        // We can retrieve the intersection features by creating a buffer around the found intersection
        // and retrieve the features that intersect with it.
        const intersectionFeatures = nearbyFeatures.filter(
          x => x.properties.roadId1 !== undefined && x.properties.roadId2 !== undefined
        );
        // we use minimal intersected area here because we want to increase the buffer and to have a good intersection area,
        // each intersection will have a good buffer to be considered in workArea
        featuresToCombine = featuresToCombine.concat(
          spatialAnalysisService.intersectedFeatures(sourceFeature, intersectionFeatures, {
            bufferDistance: constants.spatialAnalysis.ASSET_WORK_AREA_INTERSECTED_FEATURES_BUFFER_DISTANCE
          })
        );
        featuresToCombine.push(sourceFeature);
      }
    }

    // If nothing has been found, we combine the found features.
    if (!featuresToCombine.length) {
      const sourcePolygons = sourceFeatures.map(x => polygon(x.geometry.coordinates as any));
      return spatialAnalysisService.union(...sourcePolygons) as Feature<Polygon>;
    }

    const polygons = featuresToCombine.map(x => polygon(x.geometry.coordinates as any));
    const union = spatialAnalysisService.union(...polygons) as Feature<Polygon>;
    union.properties.isUnified = true;
    return union;
  }

  public async wfsFeatureToAsset(assetFeature: IFeature, expand: AssetExpand[] = []): Promise<IAsset> {
    const assetTypesTaxonomies: ITaxonomyAssetType[] = await this.getAllTaxonomyAssetTypes();
    const assetDataKeyTaxonomies: ITaxonomyAssetDataKey[] = await this.getAllTaxonomyAssetDataKeys();

    const [sourceLayerId] = (assetFeature.id as string).split('.');
    const assetType = assetTypesTaxonomies.find(x => x.properties.sourcesLayerId === sourceLayerId);
    const asset: IAsset = {
      id: `${assetFeature.properties[assetType.properties.idKey]}`,
      typeId: assetType.code,
      ownerId: assetType.properties.owners[0],
      geometry: assetFeature.geometry
    };
    if (expand.includes(AssetExpand.assetDetails)) {
      const dataKeys: ITaxonomy[] = assetDataKeyTaxonomies.filter(x =>
        assetType.properties?.dataKeys?.filter(y => y.code?.includes(x.code))
      );
      if (!isEmpty(dataKeys)) {
        const properties = {};
        dataKeys.forEach(key => {
          properties[key.properties.assetKey] = assetFeature.properties[key.properties.geomaticKey];
        });
        asset.properties = properties;
      }
    }
    return asset;
  }

  /**
   * Retrieves the source layer IDs from the AGIR asset types.
   * @param assetTypes The AGIR asset types.
   */
  public async getSourceLayerIdsFromAssetTypes(assetTypes: string[]): Promise<string[]> {
    let taxonomies = await this.getAllTaxonomyAssetTypes();
    if (assetTypes) {
      taxonomies = taxonomies.filter(x => assetTypes.includes(x.code));
    }
    return taxonomies
      .filter(x => x.properties.sourcesLayerId)
      .map(x => `${x.properties.namespace}:${x.properties.sourcesLayerId}`);
  }

  /**
   * Retrieves the source layer IDs from the AGIR asset types.
   * @param assetTypes The AGIR asset types.
   */
  public async getSourceLayerIdGroupsFromAssetTypes(assetTypes: string[]): Promise<IGroup<string, string>[]> {
    let taxonomies = await this.getAllTaxonomyAssetTypes();
    if (assetTypes?.length) {
      taxonomies = taxonomies.filter(x => assetTypes.includes(x.code));
    }
    taxonomies = taxonomies.filter(x => x.properties.sourcesLayerId);

    const dictionary = groupBy(taxonomies, t => t.properties.idKey);
    const groups: IGroup<string, string>[] = [];
    for (const key in dictionary) {
      if (!dictionary.hasOwnProperty(key)) {
        continue;
      }
      const assetTaxonomies = dictionary[key];
      groups.push({
        key,
        items: assetTaxonomies.map(t => `${t.properties.namespace}:${t.properties.sourcesLayerId}`)
      });
    }

    return groups;
  }

  public async getAllTaxonomyAssetTypes(): Promise<ITaxonomyAssetType[]> {
    return taxonomyService.getGroup(TaxonomyGroup.assetType) as Promise<ITaxonomyAssetType[]>;
  }

  public async getAllTaxonomyAssetDataKeys(): Promise<ITaxonomyAssetDataKey[]> {
    return taxonomyService.getGroup(TaxonomyGroup.assetDataKey) as Promise<ITaxonomyAssetDataKey[]>;
  }

  public async getTaxonomyAssetType(assetType: string): Promise<ITaxonomyAssetType> {
    const taxonomies = await this.getAllTaxonomyAssetTypes();
    return taxonomies.find(x => x.code === assetType);
  }

  public async getTaxonomyAssetTypes(assetTypes: string[]): Promise<ITaxonomyAssetType[]> {
    const taxonomies = await this.getAllTaxonomyAssetTypes();
    return taxonomies.filter(x => assetTypes.includes(x.code));
  }

  public getDefaultWorkArea(assetFeature: IFeature | IGeometry): IFeature {
    const newBuffer = this.getDefaultBuffer(assetFeature);
    return workAreaService.simplifyWorkArea(newBuffer) as IFeature;
  }

  public getDefaultBuffer(
    assetFeature: IFeature | IGeometry
  ): Feature<
    Polygon,
    {
      [name: string]: any;
    }
  > {
    return buffer(assetFeature as any, DEFAULT_ASSET_BUFFER_METERS, { units: 'meters' });
  }
}

export const assetService = new AssetService();
