import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'agir-root',
  imports: [
    CommonModule, HttpClientModule, RouterModule, HeaderBarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true, 
 
})
export class AppComponent {
  title = 'agir';
}
