import { Component } from '@angular/core';
import { IAddressFull } from 'src/app/shared/models/location/address-full';
import { LocationService } from 'src/app/shared/services/location.service';

import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-address-popup',
  templateUrl: 'address-popup.component.html'
})
export class AddressPopupComponent extends BasePopupComponent {
  public address: IAddressFull;

  constructor(private readonly locationService: LocationService) {
    super();
  }

  public async init(addressId: string): Promise<void> {
    this.address = await this.locationService.getAddress(addressId).toPromise();
    this.initializedSubject.next();
  }
}
