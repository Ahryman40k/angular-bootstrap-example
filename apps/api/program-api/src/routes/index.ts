import { ServerServices } from '../domain';
import { annual_program_routes } from './controllers/annual-program.controler';



export const getRoutes = (services: ServerServices) => ({
    ... annual_program_routes( services ),
});


export type RouterRoutes = ReturnType<typeof getRoutes>