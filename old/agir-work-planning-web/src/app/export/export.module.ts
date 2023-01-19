import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskModule } from 'ngx-mask';

import { SharedModule } from '../shared/shared.module';
import { ExportRoutingModule } from './export-routing.module';
import { InterventionConceptionRequirementComponent } from './intervention-conception-requirement/intervention-conception-requirement.component';
import { InterventionDataTableComponent } from './intervention-data-table/intervention-data-table.component';
import { InterventionLinkComponent } from './intervention-link/intervention-link.component';
import { ProjectConceptionRequirementComponent } from './project-conception-requirement/project-conception-requirement.component';
import { ProjectDataTableComponent } from './project-data-table/project-data-table.component';
import { ProjectLinkProjectsComponent } from './project-link-projects/project-link-projects.component';
import { ProjectLinkComponent } from './project-link/project-link.component';
import { ProjectSubmissionNumberComponent } from './project-submission-number/project-submission-number.component';
import { ProjectYearProgrambookComponent } from './project-year-programbook/project-year-programbook.component';

@NgModule({
  declarations: [
    InterventionDataTableComponent,
    InterventionLinkComponent,
    ProjectLinkComponent,
    ProjectDataTableComponent,
    ProjectLinkProjectsComponent,
    ProjectYearProgrambookComponent,
    ProjectSubmissionNumberComponent,
    ProjectConceptionRequirementComponent,
    InterventionConceptionRequirementComponent
  ],
  entryComponents: [
    InterventionLinkComponent,
    ProjectLinkComponent,
    ProjectLinkProjectsComponent,
    ProjectYearProgrambookComponent,
    ProjectSubmissionNumberComponent,
    ProjectConceptionRequirementComponent,
    InterventionConceptionRequirementComponent
  ],
  imports: [CommonModule, ExportRoutingModule, SharedModule, ReactiveFormsModule, NgxMaskModule.forChild(), NgbModule],
  exports: [],
  providers: []
})
export class ExportModule {}
