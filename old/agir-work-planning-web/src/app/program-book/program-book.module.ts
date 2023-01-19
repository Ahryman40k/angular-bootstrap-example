import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskModule } from 'ngx-mask';

import { YearSelectionModalComponent } from '../shared/forms/year-selection-modal/year-selection-modal.component';
import { SharedModule } from '../shared/shared.module';
import { AddProjectToSubmissionModalComponent } from './add-project-to-submission-modal/add-project-to-submission-modal.component';
import { AutomaticLoadingProgrambookModalComponent } from './automatic-loading-programbook-modal/automatic-loading-programbook-modal.component';
import { InvalidSubmissionModalComponent } from './invalid-submission-modal/invalid-submission-modal.component';
import { ProgramBookCompositionComponent } from './program-book-composition/program-book-composition.component';
import { ProgramsCompositionComponent } from './program-book-composition/programs-composition/programs-composition.component';
import { ProjectsCompositionComponent } from './program-book-composition/projects-composition/projects-composition.component';
import { RequestorsCompositionComponent } from './program-book-composition/requestors-composition/requestors-composition.component';
import { ProgramBookDetailsDrmComponent } from './program-book-details-drm/program-book-details-drm';
import { ProgramBookDetailsProgrammedProjectsComponent } from './program-book-details-programmed-projects/program-book-details-programmed-projects';
import { ProgramBookDetailsRemovedProjectsComponent } from './program-book-details-removed-projects/program-book-details-removed-projects.component';
import { ProgramBookDetailsSummaryComponent } from './program-book-details-summary/program-book-details-summary.component';
import { ProgramBookDetailsComponent } from './program-book-details/program-book-details.component';
import { ProgramBookTableDrmItemComponent } from './program-book-drm-table-item/program-book-drm-table-item.component';
import { ProgramBookModalComponent } from './program-book-modal/program-book-modal.component';
import { ObjectiveCardComponent } from './program-book-objectives/objective-card/objective-card.component';
import { ObjectiveTableItemComponent } from './program-book-objectives/objective-table-item/objecive-table-item.component';
import { ProgramBookObjectivesComponent } from './program-book-objectives/program-book-objectives.component';
import { CategoryDropdownComponent } from './program-book-priority-levels/priority-level-card/category-dropdown/category-dropdown.component';
import { PriorityLevelCardComponent } from './program-book-priority-levels/priority-level-card/priority-level-card.component';
import { PriorityServiceDropdownComponent } from './program-book-priority-levels/priority-level-card/priority-service-dropdown/priority-service-dropdown.component';
import { ProgramBookPriorityScenariosComponent } from './program-book-priority-scenarios/program-book-priority-scenarios.component';
import { ProgramBookRoutingModule } from './program-book-routing.module';
import { ProgramBookSubmissionListComponent } from './program-book-submission-list/program-book-submission-list.component';
import { ProgramBookTableSubmissionItemsComponent } from './program-book-submission-table-items/program-book-submission-table-items.component';
import { ProgramBookSubmissionComponent } from './program-book-submission/program-book-submission.component';
import { ProgramBookTableItemComponent } from './program-book-table-item/program-book-table-item.component';
import { ProgramBookTableComponent } from './program-book-table/program-book-table.component';
import { SubmissionProgressHistoryModalComponent } from './submission-progress-history-modal/submission-progress-history-modal.component';
import { ValidSubmissionModalComponent } from './valid-submission-modal/valid-submission-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    NgxMaskModule.forChild(),
    NgbModule,
    ProgramBookRoutingModule,
    SharedModule,
    DragDropModule
  ],
  exports: [],
  declarations: [
    AddProjectToSubmissionModalComponent,
    AutomaticLoadingProgrambookModalComponent,
    CategoryDropdownComponent,
    InvalidSubmissionModalComponent,
    ValidSubmissionModalComponent,
    ObjectiveCardComponent,
    ObjectiveTableItemComponent,
    PriorityLevelCardComponent,
    PriorityServiceDropdownComponent,
    ProgramBookDetailsComponent,
    ProgramBookDetailsDrmComponent,
    ProgramBookSubmissionComponent,
    ProgramBookDetailsProgrammedProjectsComponent,
    ProgramBookDetailsRemovedProjectsComponent,
    ProgramBookDetailsSummaryComponent,
    ProgramBookModalComponent,
    ProgramBookObjectivesComponent,
    ProgramBookPriorityScenariosComponent,
    ProgramBookTableComponent,
    ProgramBookTableItemComponent,
    ProgramBookTableDrmItemComponent,
    ProgramBookTableSubmissionItemsComponent,
    ProgramBookSubmissionListComponent,
    SubmissionProgressHistoryModalComponent,
    YearSelectionModalComponent,
    ProgramBookCompositionComponent,
    ProjectsCompositionComponent,
    ProgramsCompositionComponent,
    RequestorsCompositionComponent,
    ValidSubmissionModalComponent
  ],
  entryComponents: [
    AddProjectToSubmissionModalComponent,
    AutomaticLoadingProgrambookModalComponent,
    InvalidSubmissionModalComponent,
    ValidSubmissionModalComponent,
    ProgramBookModalComponent,
    SubmissionProgressHistoryModalComponent,
    YearSelectionModalComponent
  ]
})
export class ProgramBookModule {}
