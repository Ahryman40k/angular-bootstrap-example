import { ActivatedRoute } from '@angular/router';
import { IEnrichedIntervention, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { WindowService } from '../shared/services/window.service';
import { UserService } from '../shared/user/user.service';
import { BaseDetailsComponent } from './base-details-component';

export abstract class BaseDecisionsComponent extends BaseDetailsComponent {
  public get intervention(): IEnrichedIntervention {
    return this.windowService.currentIntervention;
  }

  constructor(activatedRoute: ActivatedRoute, protected userService: UserService, windowService: WindowService) {
    super(windowService, activatedRoute);
  }
}
