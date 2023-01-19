import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { importController } from './importController';
import { CreateBicImportLogController } from './useCases/createBicImportLog/createBicImportLogController';
import { SearchBicImportLogsController } from './useCases/searchBicImportLogs/searchBicImportLogsController';

const V1_IMPORT_PATH = `/v1/import`;

// tslint:disable:max-func-body-length
export function getImportRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.IMPORT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_IMPORT_PATH}/internal/projects`,
      handler: importController.importProjects
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.IMPORT_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_IMPORT_PATH}/bicImportLogs`,
      handler: new CreateBicImportLogController().execute
    },
    {
      method: HttpMethods.GET,
      path: `${V1_IMPORT_PATH}/bicImportLogs`,
      handler: new SearchBicImportLogsController().execute
    }
  ];
}
