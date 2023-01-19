import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { extend } from 'jquery';
import { flatten } from 'lodash';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { ProjectsColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
import { ISubmissionProjectLine } from '../submission-projects/submission-projects.component';

@Component({
  selector: 'app-submission-projects-table-items',
  templateUrl: './submission-projects-table-items.component.html',
  styleUrls: ['./submission-projects-table-items.component.scss']
})
export class SubmissionProjectsTableItemsComponent extends BaseComponent implements OnInit {
  @Input() public submissionProject: ISubmissionProjectLine;
  @Input() public columns: IColumn[];

  public objectType = ObjectType;
  public opened = false;
  public columnOptions: IColumnOptions;
  constructor(
    public readonly interventionService: InterventionService,
    public readonly projectService: ProjectService,
    public readonly windowSubmissionStoreService: WindowSubmissionStoreService
  ) {
    super();
  }

  public ngOnInit() {
    this.updateColumnOptions();
  }

  private updateColumnOptions(): void {
    const submission = this.windowSubmissionStoreService.submission;
    const submissionProjectRequirementsIds = flatten(
      submission?.requirements?.map(r => r.projectIds.filter(id => id === this.submissionProject.project.id))
    );
    const link = this.projectService.getProjectLink(this.submissionProject.project);
    let programValue = {};
    if (this.submissionProject.project?.interventions?.length > 0) {
      programValue = {
        value: this.submissionProject.project?.interventions[0]?.programId,
        taxonomyGroup: TaxonomyGroup.programType
      };
    }
    this.columnOptions = {
      [ProjectsColumns.REQUIREMENT_COUNT]: {
        value: submissionProjectRequirementsIds.length,
        innerClass: 'count-badge',
        isBadge: true
      },
      [ProjectsColumns.ID]: { value: this.submissionProject.project.id, link },
      [ProjectsColumns.PROJECT_NAME]: { value: this.submissionProject.project.projectName },
      [ProjectsColumns.PROGRAM]: programValue,
      [ProjectsColumns.STREET_NAME]: { value: this.submissionProject.project.streetName },
      [ProjectsColumns.STREET_FROM]: { value: this.submissionProject.project.streetFrom },
      [ProjectsColumns.STREET_TO]: { value: this.submissionProject.project.streetTo },
      [ProjectsColumns.BOROUGH_ID]: {
        value: this.submissionProject.project.boroughId,
        taxonomyGroup: TaxonomyGroup.borough
      }
    };
  }
}
