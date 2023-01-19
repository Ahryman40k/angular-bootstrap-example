import { Permission } from '@villemontreal/agir-work-planning-lib';

import { gdaAuthMiddlewareFactory } from '../../middlewares/gdaAuthMiddlewareFactory';
import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { CreateAnnualProgramController } from './useCases/createAnnualProgram/createAnnualProgramController';
import { DeleteAnnualProgramController } from './useCases/deleteAnnualProgram/deleteAnnualProgramController';
import { GetAnnualProgramController } from './useCases/getAnnualProgram/getAnnualProgramController';
import { GetAnnualProgramProgramBooksController } from './useCases/getAnnualProgramProgramBooks/getAnnualProgramProgramBooksController';
import { SearchAnnualProgramController } from './useCases/searchAnnualProgram/searchAnnualProgramController';
import { UpdateAnnualProgramController } from './useCases/updateAnnualProgram/updateAnnualProgramController';

export const V1_ANNUAL_PROGRAMS_PATH = `/v1/annualPrograms`;

// tslint:disable:max-func-body-length
export function getAnnualProgramsRoutes(): IHandlerRoute[] {
  return [
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ANNUAL_PROGRAM_WRITE)],
      method: HttpMethods.POST,
      path: `${V1_ANNUAL_PROGRAMS_PATH}`,
      handler: new CreateAnnualProgramController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ANNUAL_PROGRAM_READ)],
      method: HttpMethods.GET,
      path: `${V1_ANNUAL_PROGRAMS_PATH}`,
      handler: new SearchAnnualProgramController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ANNUAL_PROGRAM_READ)],
      method: HttpMethods.GET,
      path: `${V1_ANNUAL_PROGRAMS_PATH}/:id`,
      handler: new GetAnnualProgramController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ANNUAL_PROGRAM_WRITE)],
      method: HttpMethods.PUT,
      path: `${V1_ANNUAL_PROGRAMS_PATH}/:id`,
      handler: new UpdateAnnualProgramController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.ANNUAL_PROGRAM_WRITE)],
      method: HttpMethods.DELETE,
      path: `${V1_ANNUAL_PROGRAMS_PATH}/:id`,
      handler: new DeleteAnnualProgramController().execute
    },
    {
      middlewares: [gdaAuthMiddlewareFactory.create(Permission.PROGRAM_BOOK_READ)],
      method: HttpMethods.GET,
      path: `${V1_ANNUAL_PROGRAMS_PATH}/:id/programBooks`,
      handler: new GetAnnualProgramProgramBooksController().execute
    }
  ];
}
