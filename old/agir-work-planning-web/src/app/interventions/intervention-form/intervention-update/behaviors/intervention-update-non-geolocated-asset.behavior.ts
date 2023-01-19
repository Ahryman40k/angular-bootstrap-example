import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable, of } from 'rxjs';
import { InterventionService } from 'src/app/shared/services/intervention.service';

import { InterventionUpdateComponent } from '../intervention-update.component';
import { IInterventionUpdateBehavior } from './intervention-update.behavior';

export class InterventionUpdateNonGeolocatedAssetBehavior implements IInterventionUpdateBehavior {
  constructor(
    private readonly component: InterventionUpdateComponent,
    private readonly interventionService: InterventionService
  ) {}

  public getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    if (
      !this.component.intervention ||
      !this.component.interventionArea ||
      !this.component.form.value.assetType ||
      !this.component.form.value.requestor ||
      !this.component.form.value.planificationYear
    ) {
      return of(null);
    }
    return this.interventionService.getNonGeolocatedDuplicate(
      this.component.intervention.id,
      this.component.interventionArea,
      this.component.form.value.assetType,
      this.component.form.value.requestor,
      this.component.form.value.planificationYear
    );
  }

  public getDuplicateInterventionDependencies(): Observable<any>[] {
    return [
      this.component.intervention$,
      this.component.interventionArea$,
      this.component.form.controls.assetType.valueChanges,
      this.component.form.controls.requestor.valueChanges
    ];
  }
}
