import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { CountByRtuProjectController } from './useCases/countByRtuProject/countByRtuProjectController';
import { GetRtuExportLogController } from './useCases/getRtuExportLog/getRtuExportLogController';
import { GetRtuImportLogController } from './useCases/getRtuImportLog/getRtuImportLogController';
import { GetRtuProjectController } from './useCases/getRtuProject/getRtuProjectController';
import { RtuExportController } from './useCases/rtuExport/rtuExportController';
import { RtuImportController } from './useCases/rtuImport/rtuImportController';
import { SearchRtuExportLogsController } from './useCases/searchRtuExportLogs/searchRtuExportLogsController';
import { SearchRtuImportLogsController } from './useCases/searchRtuImportLogs/searchRtuImportLogsController';
import { SearchRtuProjectsController } from './useCases/searchRtuProjects/searchRtuProjectsController';

const V1_RTU_IMPORT_PATH = `/v1/import/rtu/projects`;
const V1_RTU_IMPORT_LOGS_PATH = `/v1/rtuImportLogs`;
const V1_RTU_PROJECTS_PATH = `/v1/rtuProjects`;
const V1_RTU_EXPORT_PATH = `/v1/export/projects`;
const V1_RTU_EXPORT_LOGS_PATH = `/v1/rtuExportLogs`;

export function getRtuImportRoutes(): IHandlerRoute[] {
  return [
    {
      method: HttpMethods.POST,
      path: `${V1_RTU_IMPORT_PATH}`,
      handler: new RtuImportController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INFO_RTU_IMPORT_EXPORT_WRITE)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_PROJECTS_PATH}`,
      handler: new SearchRtuProjectsController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_PROJECT_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_PROJECTS_PATH}/countBy`,
      handler: new CountByRtuProjectController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_PROJECT_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_PROJECTS_PATH}/:id`,
      handler: new GetRtuProjectController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_PROJECT_READ)]
    },
    {
      method: HttpMethods.POST,
      path: `${V1_RTU_PROJECTS_PATH}/search`,
      handler: new SearchRtuProjectsController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_PROJECT_READ)]
    },
    {
      method: HttpMethods.POST,
      path: `${V1_RTU_EXPORT_PATH}`,
      handler: new RtuExportController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.INFO_RTU_IMPORT_EXPORT_WRITE)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_IMPORT_LOGS_PATH}`,
      handler: new SearchRtuImportLogsController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_IMPORT_LOG_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_EXPORT_LOGS_PATH}`,
      handler: new SearchRtuExportLogsController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_EXPORT_LOG_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_IMPORT_LOGS_PATH}/:id`,
      handler: new GetRtuImportLogController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_IMPORT_LOG_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_RTU_EXPORT_LOGS_PATH}/:id`,
      handler: new GetRtuExportLogController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.RTU_EXPORT_LOG_READ)]
    }
  ];
}
