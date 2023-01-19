import { Pipe, PipeTransform } from '@angular/core';
import { IObjectiveValues } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({
  name: 'vdmObjectiveProgress'
})
export class ObjectiveProgressPipe implements PipeTransform {
  public transform({ calculated = 0, reference = 0 }: IObjectiveValues): number {
    return Math.round((calculated / reference) * 100);
  }
}
