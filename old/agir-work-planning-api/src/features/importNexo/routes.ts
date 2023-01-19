import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { uploadMiddleWare } from '../../shared/upload/uploadMiddleware';
import { GetNexoImportController } from './useCases/getNexoImport/getNexoImportController';
import { GetNexoImportFileController } from './useCases/getNexoImportFile/getNexoImportFileController';
import { InitNexoImportController } from './useCases/initNexoImport/initNexoImportController';
import { SearchNexoImportLogsController } from './useCases/searchNexoImport/searchNexoImportController';
import { StartNexoImportController } from './useCases/startNexoImport/startNexoImportController';
import { UploadNexoFileController } from './useCases/uploadNexoFile/uploadNexoFileController';

const V1_NEXO_IMPORT_PATH = `/v1/nexoImports`;

export function getNexoImportRoutes(): IHandlerRoute[] {
  return [
    {
      method: HttpMethods.POST,
      path: `${V1_NEXO_IMPORT_PATH}/file`,
      handler: new InitNexoImportController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.NEXO_IMPORT_LOG_WRITE),
        uploadMiddleWare([
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ])
      ]
    },
    {
      method: HttpMethods.POST,
      path: `${V1_NEXO_IMPORT_PATH}/:id/import`,
      handler: new StartNexoImportController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.NEXO_IMPORT_LOG_WRITE)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_NEXO_IMPORT_PATH}`,
      handler: new SearchNexoImportLogsController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.NEXO_IMPORT_LOG_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_NEXO_IMPORT_PATH}/:id`,
      handler: new GetNexoImportController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.NEXO_IMPORT_LOG_READ)]
    },
    {
      method: HttpMethods.GET,
      path: `${V1_NEXO_IMPORT_PATH}/:id/file/:fileId`,
      handler: new GetNexoImportFileController().execute,
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.NEXO_IMPORT_LOG_READ)]
    },
    {
      method: HttpMethods.PUT,
      path: `${V1_NEXO_IMPORT_PATH}/:id/file`,
      handler: new UploadNexoFileController().execute,
      middlewares: [
        gdaAuthMiddlewareFactory.create(Permission.NEXO_IMPORT_LOG_WRITE),
        uploadMiddleWare([
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ])
      ]
    }
  ];
}
