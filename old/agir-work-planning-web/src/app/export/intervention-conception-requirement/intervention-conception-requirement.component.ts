import { Component, Inject } from '@angular/core';
import { BaseComponentPortal } from 'src/app/shared/components/portals/base-column-portal';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';

@Component({
  selector: 'app-intervention-conception-requirement',
  templateUrl: './intervention-conception-requirement.component.html',
  styleUrls: ['./intervention-conception-requirement.component.scss']
})
export class InterventionConceptionRequirementComponent extends BaseComponentPortal<any> {
  constructor(@Inject(COLUMN_DATA) public data: any) {
    super(data);
  }
}
