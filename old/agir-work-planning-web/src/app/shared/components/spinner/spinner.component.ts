import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: 'spinner.component.html',
  host: {
    class: 'spinner-border',
    role: 'status'
  }
})
export class SpinnerComponent {}
