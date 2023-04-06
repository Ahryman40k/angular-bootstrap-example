import { IProjectService } from '../domain';
import { project_routes } from './controllers/project.controller';

export const getRoutes = (config: any, services: { project_service: IProjectService } ) => [...project_routes({ config, services })];
