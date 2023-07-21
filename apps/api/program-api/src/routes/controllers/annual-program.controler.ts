
import { CreateAnnualProgramRequest, GetAnnualProgramByExecutorIdRequest } from '../types/create-annual-program.route';
import { ServerServices } from '../../domain';
import { Routes, createFunctionBuilder, makeGet, makePost, validate } from '../../framework';


const V1_ANNUAL_PROGRAM_PATH = '/api/v1/annualProgram';


export const annual_program_routes = (service: ServerServices): Routes => ({
 /* [makeGet(`${V1_ANNUAL_PROGRAM_PATH}/:annualProgramId`)]: {
    middlewares: [validate(GetAnnualProgramByIdRequest)],
    handler: createFunctionBuilder(service, 'annual-program.getById'),
  },*/
  [makeGet(`${V1_ANNUAL_PROGRAM_PATH}/:executorId`)]: {
    middlewares: [validate(GetAnnualProgramByExecutorIdRequest)],
    handler: createFunctionBuilder(service, 'annual-program.getByExecutorId'),
  },
  [makePost(V1_ANNUAL_PROGRAM_PATH)]: {
    middlewares: [validate(CreateAnnualProgramRequest)],
    handler: createFunctionBuilder(service, 'annual-program.create'),
  },
});
