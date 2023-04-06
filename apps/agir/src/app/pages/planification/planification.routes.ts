import { Route } from "@angular/router";
import { AnnualProgramPageComponent } from "./annual-program/annual-program.page.component";

export const appRoutes: Route[] = [
    {
        path: '',
        component: AnnualProgramPageComponent
    },
    // { path: 'annual-program', loadComponent: () => import('./pages/planification/annual-program/annual-program.page.component').then( m=> m.AnnualProgramPageComponent)}
];