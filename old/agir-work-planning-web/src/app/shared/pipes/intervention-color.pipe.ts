import { Pipe, PipeTransform } from '@angular/core';
import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';

import { InterventionService } from '../services/intervention.service';

@Pipe({
  name: 'appInterventionColor'
})
export class InterventionColorPipe implements PipeTransform {
  constructor(private readonly interventionService: InterventionService) {}

  public transform(value: IEnrichedIntervention): string {
    return this.interventionService.getInterventionColor(value);
  }
}
