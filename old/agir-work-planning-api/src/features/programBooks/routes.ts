import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { V1_ANNUAL_PROGRAMS_PATH } from '../annualPrograms/routes';
import { AutomaticLoadingProgramBookController } from './useCases/automaticLoadingProgramBook/automaticLoadingProgramBookController';
import { CreateProgramBookController } from './useCases/createProgramBook/createProgramBookController';
import { CreateProgramBookObjectiveController } from './useCases/createProgramBookObjective/createProgramBookObjectiveController';
import { DeleteProgramBookController } from './useCases/deleteProgramBook/deleteProgramBookController';
import { DeleteProgramBookObjectiveController } from './useCases/deleteProgramBookObjective/deleteProgramBookObjectiveController';
import { GetProgramBookController } from './useCases/getProgramBook/getProgramBookController';
import { GetProgramBookObjectivesController } from './useCases/getProgramBookObjectives/getProgramBookObjectivesController';
import { GetProgramBookProjectsController } from './useCases/getProgramBookProjects/getProgramBookProjectsController';
import { ProgramProjectController } from './useCases/programProject/programProjectController';
import { SearchProgramBooksController } from './useCases/searchProgramBooks/searchProgramBooksController';
import { UpdateProgramBookController } from './useCases/updateProgramBook/updateProgramBookController';
import { UpdateProgramBookObjectiveController } from './useCases/updateProgramBookObjective/updateProgramBookObjectiveController';

const V1_PROGRAM_BOOKS_PATH = `/v1/programBooks`;

// tslint:disable:max-func-body-length
export function getProgramBooksRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROGRAM_BOOKS_PATH}`,
      handler: new SearchProgramBooksController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_ANNUAL_PROGRAMS_PATH}/:id/programBooks`,
      handler: new CreateProgramBookController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROGRAM_BOOKS_PATH}/:id`,
      handler: new GetProgramBookController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROGRAM_BOOKS_PATH}/:id`,
      handler: new UpdateProgramBookController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_PROGRAM_BOOKS_PATH}/:id`,
      handler: new DeleteProgramBookController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_OBJECTIVE_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/objectives`,
      handler: new GetProgramBookObjectivesController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_OBJECTIVE_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/objectives`,
      handler: new CreateProgramBookObjectiveController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_OBJECTIVE_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/objectives/:id`,
      handler: new UpdateProgramBookObjectiveController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_OBJECTIVE_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_PROGRAM_BOOKS_PATH}/:programBookId/objectives/:id`,
      handler: new DeleteProgramBookObjectiveController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_READ)],
      method: HttpMethods.GET,
      path: `${V1_PROGRAM_BOOKS_PATH}/:id/projects`,
      handler: new GetProgramBookProjectsController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_PROGRAM)],
      method: HttpMethods.POST,
      path: `${V1_PROGRAM_BOOKS_PATH}/:id/projects`,
      handler: new ProgramProjectController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_LOAD)],
      method: HttpMethods.POST,
      path: `${V1_PROGRAM_BOOKS_PATH}/:id/load`,
      handler: new AutomaticLoadingProgramBookController().execute
    }
  ];
}
