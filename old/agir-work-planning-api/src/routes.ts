import { Permission } from '@villemontreal/agir-work-planning-lib';
import { searchController } from './controllers/searchController';
import { getAnnualProgramsRoutes } from './features/annualPrograms/routes';
import { getAssetRoutes } from './features/asset/routes';
import { getDiagnosticsRoutes } from './features/diagnostics/routes';
import { getNexoImportRoutes } from './features/importNexo/routes';
import { getImportRoutes } from './features/imports/routes';
import { getInterventionsRoutes } from './features/interventions/routes';
import { getOpportunityNoticesRoutes } from './features/opportunityNotices/routes';
import { getProgramBooksPriorityScenariosRoutes } from './features/priorityScenarios/routes';
import { getProgramBooksRoutes } from './features/programBooks/routes';
import { getProjectsRoutes } from './features/projects/routes';
import { getRequirementsRoutes } from './features/requirements/routes';
import { getRtuImportRoutes } from './features/rtu/routes';
import { getSubmissionsRoutes } from './features/submissions/routes';
import { getTaxonomiesRoutes } from './features/taxonomies/routes';
import { getUsersRoutes } from './features/users/routes';
import { gdaAuthMiddlewareFactory } from './middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from './models/core/route';
import { createNotImplementedError } from './utils/utils';

export const notImplementedHandler = () => {
  throw createNotImplementedError();
};

export const VERSION = '/v1';

// ==========================================
// Application API routes.
//
// Those routes *must* also be defined in the
// Open API specs file.
// ==========================================
/**
 * The main routes of the application.
 *
 * The paths of those routes will automatically be prefixed
 * with the "/api" root and the domainPath specific to this
 * API, as defined in the configurations.
 *
 * Important! Make sure your handlers are properly bound so
 * the "this" keyword will have the correct value when the
 * handler is actually run. An easy way of doing this is to
 * decorate your controllers with the "@autobind" decorator
 * provided by the "autobind-decorator" library.
 */
export function getAPIRoutes(): IHandlerRoute[] {
  return [
    ...getAnnualProgramsRoutes(),
    ...getAssetRoutes(),
    ...getImportRoutes(),
    ...getInterventionsRoutes(),
    ...getOpportunityNoticesRoutes(),
    ...getProgramBooksPriorityScenariosRoutes(),
    ...getProgramBooksRoutes(),
    ...getProjectsRoutes(),
    ...getTaxonomiesRoutes(),
    ...getUsersRoutes(),
    ...getDiagnosticsRoutes(),
    ...getNexoImportRoutes(),
    ...getRtuImportRoutes(),
    ...getRequirementsRoutes(),
    ...getSubmissionsRoutes(),
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.WORK_AREA_READ)],
      method: HttpMethods.POST,
      path: `${VERSION}/search/work-area`,
      handler: searchController.getWorkAreaByGeometry
    }
  ];
}
