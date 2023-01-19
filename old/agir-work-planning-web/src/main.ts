import { registerLocaleData } from '@angular/common';
import frCA from '@angular/common/locales/fr-CA';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { LoggingService } from './app/shared/errors/logging.service';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

registerLocaleData(frCA, 'fr-CA');

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => new LoggingService().logError(err));
