import { Component } from '@angular/core';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';

import { BaseProgramBookTabComponent } from '../base-program-book-tab.component';

@Component({
  selector: 'app-program-book-details-summary',
  templateUrl: './program-book-details-summary.component.html'
})
export class ProgramBookDetailsSummaryComponent extends BaseProgramBookTabComponent {
  constructor(
    priorityScenarioService: PriorityScenarioService,
    dialogsService: DialogsService,
    userPreferenceService: UserPreferenceService,
    programBookService: ProgramBookService
  ) {
    super(userPreferenceService, priorityScenarioService, dialogsService, programBookService);
  }
}
