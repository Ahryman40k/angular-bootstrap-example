import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedIntervention,
  InterventionStatus,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { InterventionColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { InterventionService } from 'src/app/shared/services/intervention.service';

@Component({
  selector: 'app-annual-program-interventions-table-items',
  templateUrl: './annual-program-interventions-table-items.component.html',
  styleUrls: ['./annual-program-interventions-table-items.component.scss']
})
export class AnnualProgramInterventionsTableItemsComponent implements OnInit {
  @Input() public intervention: IEnrichedIntervention;
  @Input() public columns: IColumn[];
  public programTaxonomies: ITaxonomy[];
  public columnOptions: IColumnOptions;
  constructor(private readonly interventionService: InterventionService) {}

  public ngOnInit() {
    void this.updateColumnOptions();
  }

  private async updateColumnOptions(): Promise<void> {
    const link = this.interventionService.getInterventionLink(this.intervention);
    let decision;
    if (this.intervention.decisionRequired) {
      decision = 'Requise';
    } else if (this.intervention.status === InterventionStatus.accepted) {
      decision = 'Acceptée';
    } else {
      decision = '';
    }
    this.columnOptions = {
      [InterventionColumns.ID]: { value: this.intervention.id, link },
      [InterventionColumns.INTERVENTION_NAME]: { value: this.intervention.interventionName },
      [InterventionColumns.PROGRAM_ID]: {
        value: this.intervention.programId,
        taxonomyGroup: TaxonomyGroup.programType
      },
      [InterventionColumns.DECESION_REQUIRED]: { value: decision },
      [InterventionColumns.INTERVENTION_TYPE_ID]: {
        value: this.intervention.interventionTypeId,
        taxonomyGroup: TaxonomyGroup.interventionType
      },
      [InterventionColumns.REQUESTOR_ID]: {
        value: this.intervention.requestorId,
        taxonomyGroup: TaxonomyGroup.requestor
      },
      [InterventionColumns.STREET_NAME]: { value: this.intervention.streetName },
      [InterventionColumns.STREET_FROM]: { value: this.intervention.streetFrom },
      [InterventionColumns.STREET_TO]: { value: this.intervention.streetTo },
      [InterventionColumns.BOROUGH_ID]: { value: this.intervention.boroughId, taxonomyGroup: TaxonomyGroup.borough }
    };
  }
}
