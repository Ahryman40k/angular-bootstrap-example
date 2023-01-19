import { Component, Input, Optional } from '@angular/core';
import { IAddressFull } from 'src/app/shared/models/location/address-full';

import { BaseObjectCardComponent } from '../../../shared/components/card/base-object-card.component';
import { MapNavigationService } from '../../../shared/services/map-navigation.service';

@Component({
  selector: 'app-address-card',
  templateUrl: './address-card.component.html'
})
export class AddressCardComponent extends BaseObjectCardComponent {
  @Input() public address: IAddressFull;

  constructor(@Optional() mapNavigationService: MapNavigationService) {
    super(mapNavigationService);
  }

  protected onClick(): void {
    this.navigateToSelection(this.address);
  }
}
