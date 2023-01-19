import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants } from '../../../config/constants';
import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { CreateRequirementController } from './useCases/createRequirement/createRequirementController';
import { DeleteRequirementController } from './useCases/deleteRequirement/deleteRequirementController';
import { SearchRequirementController } from './useCases/searchRequirement/searchRequirementController';
import { UpdateRequirementController } from './useCases/updateRequirement/updateRequirementController';

const V1_REQUIREMENTS_PATH = constants.locationPaths.REQUIREMENTS;

export function getRequirementsRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.REQUIREMENT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_REQUIREMENTS_PATH}`,
      handler: new CreateRequirementController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.REQUIREMENT_READ)],
      method: HttpMethods.GET,
      path: `${V1_REQUIREMENTS_PATH}`,
      handler: new SearchRequirementController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.REQUIREMENT_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_REQUIREMENTS_PATH}/:id`,
      handler: new UpdateRequirementController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.REQUIREMENT_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_REQUIREMENTS_PATH}/:id`,
      handler: new DeleteRequirementController().execute
    }
  ];
}
