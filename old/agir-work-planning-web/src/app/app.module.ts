import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbAlertModule, NgbDropdownModule, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MtlAuthenticationModule, MtlAuthLibraryConfig } from '@villemontreal/core-security-angular-lib';
import { NgxMaskModule } from 'ngx-mask';
import { environment } from 'src/environments/environment';

import { AnnualProgramModule } from './annual-program/annual-program.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrePlanificationModule } from './pre-planification/pre-planification.module';
import { ProgramBookModule } from './program-book/program-book.module';
import { RtuTransmissionsModule } from './rtu-transmissions/rtu-transmissions.module';
import { SpinnerOverlayComponent } from './shared/components/spinner-overlay/spinner-overlay.component';
import { GlobalErrorHandler } from './shared/errors/global-error-handler';
import { ErrorHttpInterceptor } from './shared/http/error-http-interceptor';
import { NotificationsComponent } from './shared/notifications/notifications.component';
import { SharedModule } from './shared/shared.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

/**
 * We need to use a factory to be able to build the app.
 * Exemple of issue we had: https://github.com/auth0/angular2-jwt/issues/537
 */
export function authenticationConfigFactory(): MtlAuthLibraryConfig {
  return environment.authentificationConfig;
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    NotificationsComponent,
    SpinnerOverlayComponent,
    UnauthorizedComponent,
    NotFoundComponent
  ],
  imports: [
    AppRoutingModule,
    AnnualProgramModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MtlAuthenticationModule.forRoot(authenticationConfigFactory),
    NgbAlertModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbPaginationModule,
    NgSelectModule,
    NgxMaskModule.forRoot(),
    PrePlanificationModule,
    ProgramBookModule,
    ReactiveFormsModule,
    RtuTransmissionsModule,
    TaxonomyModule,
    SharedModule
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorHttpInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fr-CA' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
