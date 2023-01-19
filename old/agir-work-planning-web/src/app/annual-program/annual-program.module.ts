import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskModule } from 'ngx-mask';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProgramBookOpenComponent } from '../program-book/program-book-open/program-book-open.component';
import { ProgramBookShareFinalModalComponent } from '../program-book/program-book-share-final-modal/program-book-share-final-modal.component';
import { ProgramBookShareModalComponent } from '../program-book/program-book-share-modal/program-book-share-modal.component';
import { SharedModule } from '../shared/shared.module';
import { AnnualProgramDetailsProgrambooksComponent } from './annual-program-details-programbooks/annual-program-details-programbooks.component';
import { AnnualProgramDetailsProjectsTableItemsComponent } from './annual-program-details-projects-table-items/annual-program-details-projects-table-items.component';
import { AnnualProgramDetailsProjectsToScheduleComponent } from './annual-program-details-projects-to-schedule/annual-program-details-projects-to-schedule.component';
import { AnnualProgramDetailsSubmittedInterventionsComponent } from './annual-program-details-submitted-interventions/annual-program-details-submitted-interventions.component';
import { AnnualProgramDetailsSummaryComponent } from './annual-program-details-summary/annual-program-details-summary.component';
import { AnnualProgramExecutorDetailsComponent } from './annual-program-executor-details/annual-program-executor-details.component';
import { AnnualProgramInterventionsTableItemsComponent } from './annual-program-interventions-table-items/annual-program-interventions-table-items.component';
import { AnnualProgramModalComponent } from './annual-program-modal/annual-program-modal.component';
import { AnnualProgramRoutingModule } from './annual-program-routing.module';
import { AnnualProgramShareModalComponent } from './annual-program-share-modal/annual-program-share-modal.component';
import { AnnualProgramsExecutorComponent } from './annual-programs-executor/annual-programs-executor.component';
import { AnnualProgramsComponent } from './annual-programs/annual-programs.component';

@NgModule({
  imports: [
    CommonModule,
    AnnualProgramRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbModule,
    NgxMaskModule.forChild()
  ],
  declarations: [
    AnnualProgramsComponent,
    AnnualProgramModalComponent,
    AnnualProgramShareModalComponent,
    ProgramBookOpenComponent,
    ProgramBookShareModalComponent,
    ProgramBookShareFinalModalComponent,
    AnnualProgramsExecutorComponent,
    AnnualProgramExecutorDetailsComponent,
    AnnualProgramDetailsSummaryComponent,
    AnnualProgramDetailsProgrambooksComponent,
    AnnualProgramDetailsSubmittedInterventionsComponent,
    AnnualProgramInterventionsTableItemsComponent,
    AnnualProgramDetailsProjectsToScheduleComponent,
    AnnualProgramDetailsProjectsTableItemsComponent
  ],
  entryComponents: [
    AnnualProgramModalComponent,
    AnnualProgramShareModalComponent,
    ProgramBookOpenComponent,
    ProgramBookShareModalComponent,
    ProgramBookShareFinalModalComponent
  ]
})
export class AnnualProgramModule {}
