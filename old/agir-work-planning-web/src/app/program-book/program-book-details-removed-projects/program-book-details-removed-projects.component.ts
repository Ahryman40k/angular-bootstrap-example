import { Component, OnInit } from '@angular/core';
import { IEnrichedPaginatedProjects, ProjectExpand } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { MenuItemKey } from 'src/app/shared/models/menu/menu-item-key';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';

import { EMPTY_PAGINATED_RESULT } from 'src/app/shared/models/paginated-results';
import { ALL_PROGRAM_BOOK_TABLE_COLUMNS } from 'src/app/shared/models/table/column-config-enums';
import { BaseProgramBookTabComponent } from '../base-program-book-tab.component';

@Component({
  selector: 'app-program-book-details-removed-projects',
  styleUrls: ['./program-book-details-removed-projects.component.scss'],
  templateUrl: './program-book-details-removed-projects.component.html'
})
export class ProgramBookDetailsRemovedProjectsComponent extends BaseProgramBookTabComponent implements OnInit {
  public HiddenColumns = HiddenColumns;
  public MenuItemKey = MenuItemKey;

  constructor(
    programBookService: ProgramBookService,
    private readonly projectService: ProjectService,
    priorityScenarioService: PriorityScenarioService,
    dialogsService: DialogsService,
    userPreferenceService: UserPreferenceService
  ) {
    super(userPreferenceService, priorityScenarioService, dialogsService, programBookService);
  }

  public ngOnInit(): void {
    this.initColumnConfig();
  }

  public getProjects = (pagination: IPagination): Observable<IEnrichedPaginatedProjects> => {
    return combineLatest(this.programBookService.selectedProgramBookDetails$, this.columnConfig$).pipe(
      filter(([programBook, columnConfigs]) => columnConfigs.columns.length !== 0),
      switchMap(([programBook, columnConfigs]) => {
        if (isEmpty(programBook.removedProjectsIds)) {
          return of(EMPTY_PAGINATED_RESULT);
        }
        return this.projectService.getPaginatedProjects({
          id: programBook.removedProjectsIds,
          limit: pagination.offset + pagination.pageSize,
          offset: pagination.offset,
          fields: this.getFieldsFromUserPreferences(),
          expand: ProjectExpand.interventions
        });
      })
    );
  };

  private getFieldsFromUserPreferences(): string[] {
    const minimalFields = [
      'projectName',
      'annualDistribution',
      'interventionIds',
      'status',
      'boroughId',
      'executorId',
      'interventions'
    ];
    const configFields = this.columnConfig.columns
      .map(col => col.columnName)
      .map(colName => ALL_PROGRAM_BOOK_TABLE_COLUMNS.find(col => col.columnName === colName).fieldName);
    return uniq([...minimalFields, ...configFields]);
  }
}
