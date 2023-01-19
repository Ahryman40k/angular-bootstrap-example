import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedAnnualProgram,
  IEnrichedProject,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { ProjectsColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';

@Component({
  selector: 'app-annual-program-details-projects-table-items',
  templateUrl: './annual-program-details-projects-table-items.component.html',
  styleUrls: ['./annual-program-details-projects-table-items.component.scss']
})
export class AnnualProgramDetailsProjectsTableItemsComponent implements OnInit {
  @Input() public project: IEnrichedProject;
  @Input() public columns: IColumn[];
  @Input() public annualProgram: IEnrichedAnnualProgram;

  public menuItems = [];
  public disableMenu: boolean = false;
  public columnOptions: IColumnOptions;
  constructor(
    private readonly projectService: ProjectService,
    private readonly programBookService: ProgramBookService
  ) {}

  public async ngOnInit() {
    void this.updateColumnOptions();
    await this.initMenuItems();
  }

  public async initMenuItems(): Promise<void> {
    const compatibleProgramBooks = await this.programBookService.getCompatibleProjectProgramBooks(
      this.annualProgram,
      this.project
    );
    compatibleProgramBooks?.forEach(programBook => {
      this.menuItems.push({
        label: `Ajouter au carnet ${programBook.name}`,
        action: () => this.programBookService.addProjectToProgramBook(programBook, this.project.id, this.annualProgram),
        permission: Permission.PROGRAM_BOOK_PROGRAM,
        restrictionItems: [
          { entity: programBook, entityType: 'PROGRAM_BOOK' },
          { entity: this.project, entityType: 'PROJECT' }
        ]
      });
    });
  }

  private async updateColumnOptions(): Promise<void> {
    const link = this.projectService.getProjectLink(this.project);
    let category: string = '';
    if (this.project.startYear < this.annualProgram.year) {
      category = 'Parachèvement';
    } else {
      category = 'Nouveau';
    }
    this.columnOptions = {
      [ProjectsColumns.ID]: { value: this.project.id, link },
      [ProjectsColumns.PROJECT_NAME]: { value: this.project.projectName },
      [ProjectsColumns.PROJECT_TYPE_ID]: {
        value: this.project.projectTypeId,
        taxonomyGroup: TaxonomyGroup.projectType
      },
      [ProjectsColumns.CATEGORY]: { value: category },
      [ProjectsColumns.STATUS]: {
        value: this.project.status,
        taxonomyGroup: TaxonomyGroup.projectStatus,
        isBadge: true,
        innerClass: 'badge-success'
      },
      [ProjectsColumns.STREET_NAME]: { value: this.project.streetName },
      [ProjectsColumns.STREET_FROM]: { value: this.project.streetFrom },
      [ProjectsColumns.STREET_TO]: { value: this.project.streetTo },
      [ProjectsColumns.BOROUGH_ID]: { value: this.project.boroughId, taxonomyGroup: TaxonomyGroup.borough }
    };
  }
}
