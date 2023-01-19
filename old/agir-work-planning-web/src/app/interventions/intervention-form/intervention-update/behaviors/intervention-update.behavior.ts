import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';

export interface IInterventionUpdateBehavior {
  getDuplicateIntervention(): Observable<IEnrichedIntervention>;
  getDuplicateInterventionDependencies(): Observable<any>[];
}
