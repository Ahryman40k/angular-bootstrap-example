import { Permission } from '@villemontreal/agir-work-planning-lib';
import { constants } from '../../../config/constants';
import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { CalculatePriorityScenarioController } from './useCases/calculatePriorityScenario/calculatePriorityScenarioController';
import { GetPriorityScenarioOrderedProjectsController } from './useCases/getOrderedProjects/getPriorityScenarioOrderedProjectsController';
import { UpdateOrderedProjectRankManuallyController } from './useCases/updateOrderedProjectRankManually/updateOrderedProjectRankManuallyController';
import { UpdatePriorityLevelsController } from './useCases/updatePriorityLevels/updatePriorityLevelsController';

const V1_PROGRAM_BOOKS_PATH = constants.locationPaths.PROGRAM_BOOK;

// tslint:disable:max-func-body-length
export function getProgramBooksPriorityScenariosRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/priorityScenarios/:priorityScenarioId/orderedProjects`,
      handler: new GetPriorityScenarioOrderedProjectsController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/priorityScenarios/:priorityScenarioId/priorityLevels`,
      handler: new UpdatePriorityLevelsController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/priorityScenarios/:priorityScenarioId/orderedProjects/:projectId/ranks`,
      handler: new UpdateOrderedProjectRankManuallyController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/priorityScenarios/:priorityScenarioId/calculations`,
      handler: new CalculatePriorityScenarioController().execute
    }
  ];
}
