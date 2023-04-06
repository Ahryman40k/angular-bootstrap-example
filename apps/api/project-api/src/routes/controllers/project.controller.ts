import { MinimalProject } from '@ahryman40k/types/project-api-types';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import { IProjectService } from '../../domain';
import { z, AnyZodObject } from 'zod';

export type RouteDescriptor<H extends RequestHandler> = {
  middlewares: H[];
  method: 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
  path: string;
  handler: H;
};

const V1_PROJECTS_PATH = '/api/v1/project';

const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    return res.status(400).json(error);
  }
};

const CreateProjectEndPoint = z.object({
  body: z.object({
    project: MinimalProject,
  }),
});
type CreateProjectRequest = z.infer<typeof CreateProjectEndPoint>;

const GetProjectEndPoint = z.object({
  query: z.object({
    name: z.string({ required_error: 'name is a mandatory parameter' }),
  }),
});
type GetProjectRequest = z.infer<typeof GetProjectEndPoint>;

const getFunctionBuilder = (service: IProjectService): ((req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response): Promise<any> => {
    // get everything required here then call service
    const { query } = req as unknown as GetProjectRequest;

    return res.json(await service.getByIds([query.name]));
  };
};

const createFunctionBuilder = (service: IProjectService): ((req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response): Promise<any> => {
    // get everything required here then call service
    const { body } = req as unknown as CreateProjectRequest;

    return res.json(await service.create(body.project));
  };
};

export const project_routes = (p: { config: any; services: { project_service: IProjectService }  }): RouteDescriptor<RequestHandler>[] => [
  // Get project for specified id
  {
    middlewares: [validate(GetProjectEndPoint)],
    method: 'get',
    path: `${V1_PROJECTS_PATH}`,
    handler: getFunctionBuilder(p.services.project_service),
  },
  // Create a project
  {
    middlewares: [validate(CreateProjectEndPoint)],
    method: 'post',
    path: `${V1_PROJECTS_PATH}`,
    handler: createFunctionBuilder(p.services.project_service), // we need here to extract HTTP data or any to build a MinimalProject that can be added to a datasource
  },
];
