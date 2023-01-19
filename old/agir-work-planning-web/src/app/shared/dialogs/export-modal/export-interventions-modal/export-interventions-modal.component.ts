import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  InterventionDecisionType,
  InterventionsExtractionSelectableFields,
  InterventionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import { ExportService } from 'src/app/shared/services/export.service';
import { ExportModalComponent } from '../export-modal.component';

const interventionsColumnPropertiesToSelectableField = {
  id: InterventionsExtractionSelectableFields.id,
  interventionName: InterventionsExtractionSelectableFields.interventionName,
  interventionYear: InterventionsExtractionSelectableFields.interventionYear,
  planificationYear: InterventionsExtractionSelectableFields.planificationYear,
  status: InterventionsExtractionSelectableFields.status,
  'decisions.typeId': InterventionsExtractionSelectableFields.numberOfRefusals,
  'decisions.status.audit.createdAt': InterventionsExtractionSelectableFields.statusDate,
  'decisions.revisionRequest.audit.createdAt': InterventionsExtractionSelectableFields.lastRevisionRequestDate,
  'audit.createdAt': InterventionsExtractionSelectableFields.auditCreatedAt,
  interventionTypeId: InterventionsExtractionSelectableFields.interventionTypeId,
  workTypeId: InterventionsExtractionSelectableFields.workTypeId,
  programId: InterventionsExtractionSelectableFields.programId,
  'estimate.allowance': InterventionsExtractionSelectableFields.estimateAllowance,
  'assets.length.value': InterventionsExtractionSelectableFields.assetsLength,
  'assets[0].typeId': InterventionsExtractionSelectableFields.assetsTypeId,
  requestorId: InterventionsExtractionSelectableFields.requestorId,
  executorId: InterventionsExtractionSelectableFields.executorId,
  boroughId: InterventionsExtractionSelectableFields.boroughId,
  streetName: InterventionsExtractionSelectableFields.streetName,
  streetFrom: InterventionsExtractionSelectableFields.streetFrom,
  streetTo: InterventionsExtractionSelectableFields.streetTo,
  'project.id': InterventionsExtractionSelectableFields.projectId,
  decisionRequired: InterventionsExtractionSelectableFields.decisionRequired,
  contact: InterventionsExtractionSelectableFields.contact,
  roadNetworkTypeId: InterventionsExtractionSelectableFields.roadNetworkTypeId,
  medalId: InterventionsExtractionSelectableFields.medalId,
  // externalReferenceIds: InterventionsExtractionSelectableFields.externalReferenceIds,
  requirementsConception: InterventionsExtractionSelectableFields.requirements
};

@Component({
  selector: 'app-export-interventions-modal',
  templateUrl: '../export-modal.html',
  styleUrls: ['../export-modal.scss']
})
export class ExportInterventionsModalComponent extends ExportModalComponent {
  public exportedObjectsName: string = 'interventions';

  constructor(activeModal: NgbActiveModal, private exportService: ExportService) {
    super(activeModal);
  }

  protected async export(): Promise<boolean> {
    // Mapping filters to the IInterventionExtractSearchRequest interface
    return await this.exportService.exportInterventions({
      ...this.filters,
      // TODO: remove mapping and replace with filtering by decisionType once it is implemented for exportation
      status: this.filters.status?.map(status =>
        status === InterventionDecisionType.revisionRequest ? InterventionStatus.waiting : status
      ),
      planificationYear: this.filters.fromPlanificationYear,
      fromPlanificationYear: undefined,
      toPlanificationYear: undefined,
      fields: this.columnProperties
        .map(col => interventionsColumnPropertiesToSelectableField[col])
        .filter(x => !_.isNil(x))
    });
  }
}
