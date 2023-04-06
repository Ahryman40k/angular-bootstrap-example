import { enableProdMode, ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { fakeBackendProvider } from './app/interceptors/fake-backend.interceptor';
import { AgirErrorHandler } from './app/services/errorhandler';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
} else {
  console.log(environment);
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes), 
    fakeBackendProvider,
    {
      provide: ErrorHandler,
      useClass: AgirErrorHandler
    }
  ],
}).catch((err) => console.error(err));
