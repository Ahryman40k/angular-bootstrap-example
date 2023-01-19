import { Pipe, PipeTransform } from '@angular/core';
import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { RtuProjectService } from '../services/rtu-project.service';

@Pipe({
  name: 'appRtuProjectColor'
})
export class RtuProjectColorPipe implements PipeTransform {
  constructor(private readonly rtuProjectService: RtuProjectService) {}

  public transform(value: IRtuProject): string {
    return this.rtuProjectService.getRtuProjectColor(value);
  }
}
