import { Component, Inject, OnInit } from '@angular/core';
import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';
import { BaseComponentPortal } from '../../shared/components/portals/base-column-portal';
import { InterventionService } from '../../shared/services/intervention.service';

@Component({
  selector: 'app-intervention-link',
  templateUrl: './intervention-link.component.html',
  styleUrls: ['./intervention-link.component.scss']
})
export class InterventionLinkComponent extends BaseComponentPortal<IEnrichedIntervention> {
  constructor(
    private interventionService: InterventionService,
    @Inject(COLUMN_DATA) public data: IEnrichedIntervention
  ) {
    super(data);
  }
  public get href() {
    return this.interventionService.getInterventionLink(this.data);
  }
}
