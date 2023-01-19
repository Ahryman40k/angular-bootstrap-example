import {
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { range } from 'lodash';
import { arrayOfNumbers } from 'src/app/shared/arrays/number-arrays';
import { InterventionType } from 'src/app/shared/models/interventions/intervention-type';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import {
  BaseInterventionFormComponent,
  INTERVENTION_CREATION_MAX_YEAR_INTERVAL
} from '../base-intervention-form.component';

export abstract class BaseInterventionCreationComponent extends BaseInterventionFormComponent {
  public get canSubmitAndCreateProject(): boolean {
    return !this.submitting && !this.form.controls.program.value && this.isValidBoroughId;
  }

  protected initForm(): void {
    super.initForm();
    this.form.controls.interventionType.setValue(InterventionType.initialNeed);
    this.form.controls.interventionType.disable();
    this.form.controls.interventionYear.valueChanges.subscribe(planificationYear => {
      this.form.patchValue({
        planificationYear
      });
    });
  }

  protected initYears(): void {
    const currentYear = new Date().getFullYear();
    this.years = arrayOfNumbers(currentYear, currentYear + INTERVENTION_CREATION_MAX_YEAR_INTERVAL);
  }

  protected setYearsWithinProject(project: IEnrichedProject): void {
    if (!project) {
      return;
    }
    this.years = range(project.startYear, project.endYear + 1);
  }

  public async submitAndCreateProject(): Promise<void> {
    const intervention = await this.submit();
    if (!intervention) {
      return;
    }
    void this.router.navigate(['/window/projects/create', intervention.id]);
  }

  protected async doSubmission(
    plainIntervention: IPlainIntervention,
    broadcastException?: BroadcastEventException
  ): Promise<IEnrichedIntervention> {
    const intervention = await this.interventionService.createIntervention(plainIntervention, broadcastException);
    intervention
      ? this.notificationsService.showSuccess("L'intervention a été créée avec succès")
      : this.notificationsService.showError("Impossible d'effectuer cette opération");
    return intervention;
  }
}
