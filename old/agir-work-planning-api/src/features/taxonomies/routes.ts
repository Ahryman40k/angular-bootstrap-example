import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { taxonomyController } from './taxonomyController';

const V1_TAXONOMIES_PATH = `/v1/taxonomies`;

// tslint:disable:max-func-body-length
export function getTaxonomiesRoutes(): IHandlerRoute[] {
  return [
    {
      method: HttpMethods.GET,
      path: `${V1_TAXONOMIES_PATH}`,
      handler: taxonomyController.getTaxonomies
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.TAXONOMY_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_TAXONOMIES_PATH}`,
      handler: taxonomyController.postTaxonomy
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.TAXONOMY_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_TAXONOMIES_PATH}/:group/:code`,
      handler: taxonomyController.updateTaxonomy
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.TAXONOMY_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_TAXONOMIES_PATH}/:group/:code`,
      handler: taxonomyController.deleteTaxonomy
    },
    {
      method: HttpMethods.GET,
      path: `${V1_TAXONOMIES_PATH}/:group`,
      handler: taxonomyController.getTaxonomies
    }
  ];
}
