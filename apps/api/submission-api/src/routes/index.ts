import { ServerServices } from '../domain';
import { submission_routes } from './controllers/submission.controler';



export const getRoutes = (services: ServerServices) => ({
    ... submission_routes( services ),
});


export type RouterRoutes = ReturnType<typeof getRoutes>