import { Pipe, PipeTransform } from '@angular/core';
import { IEnrichedObjective, ProgramBookObjectiveTargetType } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({
  name: 'vdmObjectiveProgressLabel'
})
export class ObjectiveProgressLabelPipe implements PipeTransform {
  public transform(objective: IEnrichedObjective): string {
    if (objective?.targetType === ProgramBookObjectiveTargetType.bid) {
      if (objective?.values.reference === 1) {
        return 'soumission';
      }
      return 'soumissions';
    }
    if (objective?.targetType === ProgramBookObjectiveTargetType.budget) {
      return 'K$';
    }
    return 'km';
  }
}
