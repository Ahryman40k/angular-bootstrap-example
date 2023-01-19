import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectsExtractionSelectableFields } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import { ExportService } from 'src/app/shared/services/export.service';
import { defaultProjectSearchStatuses } from 'src/app/shared/services/project.service';
import { ExportModalComponent } from '../export-modal.component';

const projectsColumnPropertiesToSelectableField = {
  _id: ProjectsExtractionSelectableFields.id,
  projectName: ProjectsExtractionSelectableFields.projectName,
  startYear: ProjectsExtractionSelectableFields.startYear,
  endYear: ProjectsExtractionSelectableFields.endYear,
  status: ProjectsExtractionSelectableFields.status,
  'decisions.status.audit.createdAt': ProjectsExtractionSelectableFields.statusDate,
  geometryPin: ProjectsExtractionSelectableFields.geometryPin,
  projectTypeId: ProjectsExtractionSelectableFields.projectTypeId,
  annualDistribution: ProjectsExtractionSelectableFields.annualPeriodsCategoryId,
  subCategoryIds: ProjectsExtractionSelectableFields.subCategoryIds,
  'globalBudget.allowance': ProjectsExtractionSelectableFields.globalBudgetAllowance,
  'length.value': ProjectsExtractionSelectableFields.length,
  inChargeId: ProjectsExtractionSelectableFields.inChargeId,
  executorId: ProjectsExtractionSelectableFields.executorId,
  medalId: ProjectsExtractionSelectableFields.medalId,
  boroughId: ProjectsExtractionSelectableFields.boroughId,
  streetName: ProjectsExtractionSelectableFields.streetName,
  streetFrom: ProjectsExtractionSelectableFields.streetFrom,
  streetTo: ProjectsExtractionSelectableFields.streetTo,
  interventionIds: ProjectsExtractionSelectableFields.interventionIds,
  'annualDistribution.annualPeriods.programBookId': ProjectsExtractionSelectableFields.annualPeriodsProgramBookId,
  submissionNumber: ProjectsExtractionSelectableFields.submissionNumber,
  riskId: ProjectsExtractionSelectableFields.riskId,
  roadNetworkTypeId: ProjectsExtractionSelectableFields.roadNetworkTypeId,
  servicePriorities: ProjectsExtractionSelectableFields.servicePriorities,
  // externalReferenceIds: ProjectsExtractionSelectableFields.externalReferenceIds,
  requirementPlanification: ProjectsExtractionSelectableFields.requirements,
  submissionNumberConception: ProjectsExtractionSelectableFields.designRequirements
};

@Component({
  selector: 'app-export-projects-modal',
  templateUrl: '../export-modal.html',
  styleUrls: ['../export-modal.scss']
})
export class ExportProjectsModalComponent extends ExportModalComponent {
  public exportedObjectsName: string = 'projets';

  constructor(activeModal: NgbActiveModal, private exportService: ExportService) {
    super(activeModal);
  }

  protected async export(): Promise<boolean> {
    // Mapping filters to the IProjectExtractSearchRequest interface
    return await this.exportService.exportProjects({
      ...this.filters,
      status: this.filters.status ?? defaultProjectSearchStatuses,
      submissionNumber: this.toArray(this.filters.submissionNumber),
      year: this.filters.toStartYear,
      fromEndYear: undefined,
      toStartYear: undefined,
      programBookId: this.filters.carnet,
      allCarnets: undefined,
      carnet: undefined,
      annualProgram: undefined,
      fields: this.columnProperties.map(col => projectsColumnPropertiesToSelectableField[col]).filter(x => !_.isNil(x))
    });
  }

  private toArray(submissionNumberFilter: any): string[] {
    return _.isEmpty(submissionNumberFilter)
      ? undefined
      : _.isArray(submissionNumberFilter)
      ? submissionNumberFilter
      : (submissionNumberFilter as string).split(',');
  }
}
