import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { fakeBackendProvider } from './interceptors/fake-backend.interceptor';
import { HttpClientModule } from '@angular/common/http';
import { TaxonomyService } from './services/taxonomy.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    HttpClientModule,
    RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
    HeaderBarComponent
  ],
  providers: [
    fakeBackendProvider, 
    TaxonomyService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
