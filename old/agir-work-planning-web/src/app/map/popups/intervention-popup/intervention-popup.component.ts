import { Component } from '@angular/core';
import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';
import { InterventionService } from 'src/app/shared/services/intervention.service';

import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-intervention-popup',
  templateUrl: 'intervention-popup.component.html'
})
export class InterventionPopupComponent extends BasePopupComponent {
  public intervention: IEnrichedIntervention;

  constructor(private readonly interventionService: InterventionService) {
    super();
  }

  public async init(interventionId: string): Promise<void> {
    this.intervention = await this.interventionService.getIntervention(interventionId);
    this.initializedSubject.next();
  }
}
