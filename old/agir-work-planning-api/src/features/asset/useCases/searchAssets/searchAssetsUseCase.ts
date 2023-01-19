import { AssetExpand, IAsset, IFeature } from '@villemontreal/agir-work-planning-lib';
import { flatten, isEmpty } from 'lodash';

import { IBaseRepository, IResultPaginated } from '../../../../repositories/core/baseRepository';
import { assetService } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { AnalysisLayerIds } from '../../../../services/spatialAnalysisService/spatialAnalysisEnum';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { errorMtlMapper } from '../../../../shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../../utils/arrayUtils';
import { assetMapperDTO } from '../../mappers/assetMapperDTO';
import { Asset, IAssetProps } from '../../models/asset';
import { AssetFindPaginatedOptions, IAssetsPaginatedFindOptionsProps } from '../../models/assetFindPaginatedOptions';
import { AssetValidator } from '../../validators/assetValidator';

export class SearchAssetsUseCase extends SearchUseCase<Asset, IAsset, IAssetsPaginatedFindOptionsProps> {
  private readonly assetService = assetService;
  protected entityRepository: IBaseRepository<any, any> = undefined;
  protected mapper = assetMapperDTO;

  protected createCommand(req: IAssetsPaginatedFindOptionsProps): Result<AssetFindPaginatedOptions> {
    return AssetFindPaginatedOptions.create(req);
  }

  protected async validateTaxonomies(req: IAssetsPaginatedFindOptionsProps): Promise<Result<IGuardResult>> {
    return AssetValidator.validateSearchAssetsRequestTaxonomy(req.criterias);
  }

  protected async search(findOptions: AssetFindPaginatedOptions): Promise<IResultPaginated<Asset>> {
    let assets: IAsset[];
    if (findOptions.criterias.advancedIntersect) {
      assets = await this.searchAssetsOpportunities(findOptions);
    } else if (findOptions.criterias.id) {
      assets = await this.searchAssetsById(findOptions);
    } else {
      assets = await this.searchAssetsInGeometry(findOptions);
    }
    return {
      items: assets.map(asset => Asset.create(asset as IAssetProps).getValue()),
      paging: {
        limit: findOptions.limit,
        offset: findOptions.offset,
        totalCount: assets.length,
        itemCount: assets.length
      }
    };
  }

  /**
   * Searches for assets that has opportunities to create interventions on.
   * @param findOptions The search asset request object.
   */
  private async searchAssetsOpportunities(findOptions: AssetFindPaginatedOptions): Promise<IAsset[]> {
    const sourceLayerIds = await this.assetService.getSourceLayerIdsFromAssetTypes(findOptions.criterias.assetTypes);
    if (!sourceLayerIds?.length) {
      return [];
    }
    const [pavementFeatures, assetFeatures] = await Promise.all([
      spatialAnalysisService.getLayerNearbyFeatures(
        findOptions.criterias.geometry,
        AnalysisLayerIds.pavementSections,
        AnalysisLayerIds.intersections
      ),
      spatialAnalysisService.getLayerNearbyFeatures(findOptions.criterias.geometry, ...sourceLayerIds)
    ]);

    // Get all assets work area
    await Promise.all(
      assetFeatures.map(async af => {
        af.properties.workArea = await assetService.getWorkArea(af, pavementFeatures);
      })
    );

    // Retrieves intersected features
    const features = spatialAnalysisService.getIntersectingWorkArea(findOptions.criterias.geometry, assetFeatures);

    return Promise.all(features.map(x => this.assetService.wfsFeatureToAsset(x, [AssetExpand.assetDetails])));
  }

  /**
   * Searches for assets by ID.
   * @param request The search asset request object.
   */
  private async searchAssetsById(findOptions: AssetFindPaginatedOptions): Promise<IAsset[]> {
    const assetId = convertStringOrStringArray(findOptions.criterias.id).find(id => id);
    const searchGroups = await assetService.getSourceLayerIdGroupsFromAssetTypes(findOptions.criterias.assetTypes);
    const results = await Promise.all(
      searchGroups.map(searchGroup => {
        const cql = `${searchGroup.key} = '${escape(assetId)}'`;
        return spatialAnalysisService.searchFeatures(cql, searchGroup.items);
      })
    );
    const failedResults = results.filter(result => result.isFailure);
    if (!isEmpty(failedResults)) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(Result.combine(failedResults))));
    }

    const features = flatten(results.map(result => result.getValue()));
    return Promise.all(features.map(x => this.assetService.wfsFeatureToAsset(x, [AssetExpand.assetDetails])));
  }

  /**
   * Searches for assets that are in the specified geometry.
   * @param request The search asset request object.
   */
  private async searchAssetsInGeometry(findOptions: AssetFindPaginatedOptions): Promise<IAsset[]> {
    const sourceLayerIds = await assetService.getSourceLayerIdsFromAssetTypes(findOptions.criterias.assetTypes);
    if (!sourceLayerIds?.length) {
      return [];
    }
    const featureCollection = await spatialAnalysisService.getLayerIntersectingFeatures(
      findOptions.criterias.geometry,
      ...sourceLayerIds
    );
    const features = featureCollection.features as IFeature[];
    return Promise.all(features.map(x => this.assetService.wfsFeatureToAsset(x, [AssetExpand.assetDetails])));
  }
}

export const searchAssetsUseCase: SearchAssetsUseCase = new SearchAssetsUseCase();
