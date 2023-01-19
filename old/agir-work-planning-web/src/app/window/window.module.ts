import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { InterventionsModule } from '../interventions/interventions.module';
import { MapModule } from '../map/map.module';
import { SharedModule } from '../shared/shared.module';
import { InterventionAnnualPeriodsComponent } from './annual-periods/intervention-annual-periods/intervention-annual-periods.component';
import { ProjectAnnualPeriodsComponent } from './annual-periods/project-annual-periods/project-annual-periods.component';
import { AssetDetailsComponent } from './asset-details/asset-details.component';
import { InterventionCommentsComponent } from './comments/intervention-comments/intervention-comments.component';
import { ProjectCommentsComponent } from './comments/project-comments/project-comments.component';
import { DecisionRequiredWarningComponent } from './decision-required-warning/decision-required-warning.component';
import { DecisionRequiredComponent } from './decision-required/decision-required.component';
import { DocumentsInterventionComponent } from './documents/intervention/documents.intervention.component';
import { DocumentsProjectComponent } from './documents/project/documents.project.component';
import { InterventionConceptionDataComponent } from './intervention-conception-data/intervention-conception-data.component';
import { InterventionDecisionsComponent } from './intervention-decisions/intervention-decisions.component';
import { InterventionDetailsComponent } from './intervention-details/intervention-details.component';
import { InterventionRequirementComponent } from './intervention-requirement/intervention-requirement.component';
import { OpportunityNoticeAssetItemComponent } from './opportunity-notices/opportunity-notice-asset-item/opportunity-notice-asset-item.component';
import { OpportunityNoticeAssetsListComponent } from './opportunity-notices/opportunity-notice-assets-list/opportunity-notice-assets-list.component';
import { OpportunityNoticeAssetsWithInterventionComponent } from './opportunity-notices/opportunity-notice-assets/opportunity-notice-assets-with-intervention.component';
import { OpportunityNoticeAssetsWithoutInterventionComponent } from './opportunity-notices/opportunity-notice-assets/opportunity-notice-assets-without-intervention.component';
import { OpportunityNoticesCreateComponent } from './opportunity-notices/opportunity-notices-create/opportunity-notices-create.component';
import { OpportunityNoticesResponseComponent } from './opportunity-notices/opportunity-notices-response/opportunity-notices-response.component';
import { OpportunityNoticesComponent } from './opportunity-notices/opportunity-notices/opportunity-notices.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';
import { ProjectRequirementComponent } from './project-requirement/project-requirement.component';
import { RtuProjectDetailsComponent } from './rtu-project-details/rtu-project-details.component';
import { SubmissionContentComponent } from './submission-window/submission-content/submission-content.component';
import { SubmissionDocumentsComponent } from './submission-window/submission-documents/submission-documents.component';
import { SubmissionHistoryComponent } from './submission-window/submission-history/submission-history.component';
import { SubmissionProjectsTableItemsComponent } from './submission-window/submission-projects-table-items/submission-projects-table-items.component';
import { SubmissionProjectsComponent } from './submission-window/submission-projects/submission-projects.component';
import { SubmissionRequirementsListComponent } from './submission-window/submission-requirements/submission-requirements-list/submission-requirements-list.component';
import { SubmissionRequirementsComponent } from './submission-window/submission-requirements/submission-requirements.component';
import { WindowContentInterventionsComponent } from './window-content-interventions/window-content-interventions.component';
import { WindowContentProjectsComponent } from './window-content-projects/window-content-projects.component';
import { WindowRoutingModule } from './window-routing.module';

@NgModule({
  declarations: [
    DecisionRequiredComponent,
    DecisionRequiredWarningComponent,
    DocumentsInterventionComponent,
    DocumentsProjectComponent,
    InterventionAnnualPeriodsComponent,
    InterventionCommentsComponent,
    InterventionDecisionsComponent,
    InterventionDetailsComponent,
    InterventionRequirementComponent,
    OpportunityNoticesComponent,
    OpportunityNoticesCreateComponent,
    OpportunityNoticesResponseComponent,
    OpportunityNoticeAssetItemComponent,
    OpportunityNoticeAssetsListComponent,
    OpportunityNoticeAssetsWithInterventionComponent,
    OpportunityNoticeAssetsWithoutInterventionComponent,
    ProjectAnnualPeriodsComponent,
    ProjectCommentsComponent,
    ProjectDetailsComponent,
    ProjectRequirementComponent,
    RtuProjectDetailsComponent,
    SubmissionHistoryComponent,
    WindowContentInterventionsComponent,
    SubmissionContentComponent,
    SubmissionDocumentsComponent,
    WindowContentProjectsComponent,
    AssetDetailsComponent,
    SubmissionProjectsComponent,
    SubmissionProjectsTableItemsComponent,
    SubmissionRequirementsComponent,
    SubmissionRequirementsListComponent,
    InterventionConceptionDataComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    InterventionsModule,
    MapModule,
    NgbDropdownModule,
    NgbModule,
    NgSelectModule,
    ReactiveFormsModule,
    SharedModule,
    WindowRoutingModule
  ]
})
export class WindowModule {}
