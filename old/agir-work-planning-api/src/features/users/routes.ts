import { userController } from '../../controllers/userController';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { userPreferenceController } from './userPreferenceController';

const V1_USERS_PATH = `/v1/me`;

// tslint:disable:max-func-body-length
export function getUsersRoutes(): IHandlerRoute[] {
  return [
    {
      method: HttpMethods.GET,
      path: `${V1_USERS_PATH}`,
      handler: userController.getCurrentUser
    },
    {
      method: HttpMethods.GET,
      path: `${V1_USERS_PATH}/preferences`,
      handler: userPreferenceController.getPreferences
    },
    {
      method: HttpMethods.PUT,
      path: `${V1_USERS_PATH}/preferences/:key`,
      handler: userPreferenceController.upsertPreference
    },
    {
      method: HttpMethods.DELETE,
      path: `${V1_USERS_PATH}/preferences/:key`,
      handler: userPreferenceController.deletePreference
    }
  ];
}
