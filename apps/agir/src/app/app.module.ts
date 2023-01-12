import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BootstrapComponentsModule } from '@villemontreal/bootstrap-components';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BootstrapComponentsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
