import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods } from '../../models/core/route';
import { VERSION } from '../../routes';
import { GetAssetByIdController } from './useCases/getAssetById/getAssetByIdController';
import { SearchAssetsController } from './useCases/searchAssets/searchAssetsController';
import { SearchAssetsLastInterventionController } from './useCases/searchAssetsLastIntervention/searchAssetsLastInterventionController';
import { SearchAssetsWorkAreaController } from './useCases/searchAssetsWorkArea/searchAssetsWorkAreaController';

export function getAssetRoutes() {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ASSET_READ)],
      method: HttpMethods.GET,
      path: `${VERSION}/assets/:assetType/:assetId`,
      handler: new GetAssetByIdController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ASSET_READ)],
      method: HttpMethods.POST,
      path: `${VERSION}/assets/search/lastIntervention`,
      handler: new SearchAssetsLastInterventionController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ASSET_SEARCH)],
      method: HttpMethods.POST,
      path: `${VERSION}/assets/search`,
      handler: new SearchAssetsController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.WORK_AREA_READ)],
      method: HttpMethods.POST,
      path: `${VERSION}/search/assets/work-area`,
      handler: new SearchAssetsWorkAreaController().execute
    }
  ];
}
