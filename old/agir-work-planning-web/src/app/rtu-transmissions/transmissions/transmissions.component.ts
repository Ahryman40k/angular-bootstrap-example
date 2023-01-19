import { Component } from '@angular/core';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

@Component({
  selector: 'app-transmissions',
  templateUrl: './transmissions.component.html',
  styleUrls: ['./transmissions.component.scss']
})
export class TransmissionsComponent extends BaseComponent {
  constructor() {
    super();
  }
}
