import { Route } from '@angular/router';

export const appRoutes: Route[] = [
    {
        path: '',
        redirectTo: 'planification', 
        pathMatch: 'full'
    },
    { path: 'planification', loadComponent: () => import('./pages/planification/annual-program/annual-program.page.component').then( m=> m.AnnualProgramPageComponent)}
];
