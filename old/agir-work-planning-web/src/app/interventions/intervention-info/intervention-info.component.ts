import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { InterventionType } from 'src/app/shared/models/interventions/intervention-type';
import { IInterventionPatch } from 'src/app/shared/models/interventions/intervention.model';
import { InterventionService } from 'src/app/shared/services/intervention.service';

@Component({
  selector: 'app-intervention-info',
  templateUrl: './intervention-info.component.html',
  styleUrls: ['./intervention-info.component.scss']
})
export class InterventionInfoComponent extends BaseComponent {
  private _intervention: IEnrichedIntervention;
  public get intervention(): IEnrichedIntervention {
    return this._intervention;
  }
  @Input()
  public set intervention(v: IEnrichedIntervention) {
    this._intervention = v;
    this.resetInterventionType();
  }

  public interventionType = new FormControl();

  constructor(private readonly interventionsService: InterventionService) {
    super();
    this.interventionType.valueChanges.subscribe(value => this.updateInterventionType(value));
  }

  public async updateInterventionType(value: boolean): Promise<void> {
    this.interventionType.disable({ emitEvent: false });
    const interventionType = value ? InterventionType.opportunity : InterventionType.initialNeed;
    try {
      const patch: IInterventionPatch = {
        interventionTypeId: interventionType
      };
      await this.interventionsService.patchIntervention(this.intervention, patch);
      // Make soft update
      Object.assign(this.intervention, patch);
    } catch (error) {
      this.resetInterventionType();
      throw error;
    } finally {
      this.interventionType.enable({ emitEvent: false });
    }
  }

  private resetInterventionType(): void {
    if (this.intervention) {
      this.interventionType.enable({ emitEvent: false });
    } else {
      this.interventionType.disable({ emitEvent: false });
    }
    this.interventionType.reset(this.interventionsService.isInterventionTypeOpportunity(this.intervention), {
      emitEvent: false
    });
  }
}
