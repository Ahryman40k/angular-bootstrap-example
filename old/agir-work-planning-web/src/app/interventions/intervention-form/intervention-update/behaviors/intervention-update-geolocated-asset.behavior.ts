import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable, of } from 'rxjs';
import { InterventionService } from 'src/app/shared/services/intervention.service';

import { InterventionUpdateComponent } from '../intervention-update.component';
import { IInterventionUpdateBehavior } from './intervention-update.behavior';

export class InterventionUpdateGeolocatedAssetBehavior implements IInterventionUpdateBehavior {
  constructor(
    private readonly component: InterventionUpdateComponent,
    private readonly interventionService: InterventionService
  ) {}

  public getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    if (
      !this.component.intervention ||
      !this.component.form.value.requestor ||
      !this.component.form.value.interventionYear
    ) {
      return of(null);
    }
    return this.interventionService.getGeolocatedDuplicate(
      this.component.intervention.id,
      // TODO: "Assets"
      // - see APOC-5620 fro more details
      this.component.intervention.assets[0].id,
      this.component.form.value.requestor,
      this.component.form.value.interventionYear
    );
  }

  public getDuplicateInterventionDependencies(): Observable<any>[] {
    return [
      this.component.intervention$,
      this.component.form.controls.requestor.valueChanges,
      this.component.form.controls.interventionYear.valueChanges
    ];
  }
}
