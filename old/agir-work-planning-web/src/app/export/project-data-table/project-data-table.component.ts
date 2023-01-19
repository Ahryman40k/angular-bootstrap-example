import { Component, OnInit } from '@angular/core';
import {
  BoroughCode,
  IProjectPaginatedSearchRequest,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty } from 'lodash';
import {
  DEFAULT_DISPLAYED_COLUMNS,
  ProjectDataSource
} from 'src/app/shared/components/vdm-table/datasource/project-datasource';
import { CustomizeInterventionTableViewModalComponent } from 'src/app/shared/dialogs/customize-intervention-table-view-modal/customize-intervention-table-view-modal.component';
import { CustomizeProjectFilterViewComponent } from 'src/app/shared/dialogs/customize-project-filter-view/customize-project-filter-view.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ExportProjectsModalComponent } from 'src/app/shared/dialogs/export-modal/export-projects-modal/export-projects-modal.component';
import { TaxonomyPipe } from 'src/app/shared/pipes/taxonomies.pipe';
import { UserLocalStorageService } from 'src/app/shared/services/user-local-storage.service';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseComponent } from '../../shared/components/base/base.component';

const STORAGE_PROJECT_LIST_ATTRIBUTES = 'projects-list-attributs-storage-key';
const STORAGE_PROJECT_LIST_FILTER = 'projects-list-filter-storage-key';

export interface IProjectFilter extends IProjectPaginatedSearchRequest {
  allCarnets: string[];
  annualProgram?: string;
  carnet?: string[];
  boroughId?: string[];
}

@Component({
  selector: 'app-project-data-table',
  templateUrl: './project-data-table.component.html',
  styleUrls: ['./project-data-table.component.scss'],
  providers: [TaxonomyPipe, ProjectDataSource]
})
export class ProjectDataTableComponent extends BaseComponent implements OnInit {
  public get projectCount(): number {
    return this.dataSource.count;
  }
  public projectAttributes: string[];
  public filters: IProjectFilter;
  public filterActivated: boolean;
  public searchValue: string;

  // Export
  public userHasExportPermission: boolean;
  public isExportEnabled: boolean;

  constructor(
    public dataSource: ProjectDataSource,
    private readonly userLocalStorageService: UserLocalStorageService,
    protected readonly dialogsService: DialogsService,
    public readonly userService: UserService
  ) {
    super();
  }
  public async ngOnInit() {
    this.setUserHasExportPermission();
    await this.initDisplayedColumns();
    super.ngOnInit();
  }

  private setUserHasExportPermission() {
    this.userService
      .hasPermission(Permission.PROJECT_EXTRACT)
      .then(hasPermission => {
        this.userHasExportPermission = hasPermission;
      })
      .catch();
  }

  public get isLoading(): boolean {
    return this.dataSource.loading;
  }

  public async initDisplayedColumns(): Promise<void> {
    const storageDataList = await this.userLocalStorageService.get<[string]>(STORAGE_PROJECT_LIST_ATTRIBUTES);
    await this.setProjectAttributes(isEmpty(storageDataList) ? DEFAULT_DISPLAYED_COLUMNS : storageDataList);

    this.dataSource.isLoadEnabled = true;

    const storageDataFilter = await this.userLocalStorageService.get<any>(STORAGE_PROJECT_LIST_FILTER);
    const projectFilters = isEmpty(storageDataFilter) ? null : storageDataFilter;

    if (projectFilters) {
      await this.setProjectFilter(projectFilters, storageDataFilter?.allCarnets ? storageDataFilter.allCarnets : []);
    } else {
      this.dataSource.searchRequestSubject.next(this.dataSource.searchRequestSubject.value);
    }
  }

  public async openCustomizeProjectTableViewModal(): Promise<void> {
    const modal = this.dialogsService.showModal(CustomizeInterventionTableViewModalComponent);
    const allProjectList = await this.filterByPermissions(this.dataSource.columns.map(col => col.property));
    const fullColumns = this.dataSource.columns.filter(col => allProjectList.includes(col.property));
    modal.componentInstance.initialize(this.projectAttributes, fullColumns, DEFAULT_DISPLAYED_COLUMNS);
    const tableColumns = await modal.result;
    await this.setProjectAttributes(tableColumns);
  }

  private async setProjectAttributes(tableColumns: string[]): Promise<void> {
    if (tableColumns) {
      this.projectAttributes = await this.filterByPermissions(tableColumns);
      await this.userLocalStorageService.set(STORAGE_PROJECT_LIST_ATTRIBUTES, this.projectAttributes);

      this.dataSource.shouldGetConceptionRequirements = this.projectAttributes.includes('submissionNumberConception');
      this.dataSource.shouldGetPlanificationRequirements = this.projectAttributes.includes('requirementPlanification');

      let result = this.projectAttributes;

      // requirementPlanification and submissionNumberConception displayed on one column on the table view
      // and it should be at the end of the table view
      if (this.dataSource.shouldGetPlanificationRequirements) {
        result = result.filter(e => !['requirementPlanification'].includes(e));
      }

      if (this.dataSource.shouldGetConceptionRequirements) {
        result = result.filter(e => !['submissionNumberConception'].includes(e));
      }
      // set submissionNumberConception column at the end of table columns
      if (this.dataSource.shouldGetConceptionRequirements || this.dataSource.shouldGetPlanificationRequirements) {
        result.push('submissionNumberConception');
      }

      this.dataSource.displayedColumnsSubject.next(result);
    }
  }

  private async filterByPermissions(projectAttributes: string[]): Promise<string[]> {
    const toBeRemoved = [];
    for await (const inter of projectAttributes) {
      const needPermission = this.dataSource.columns.find(permRow => permRow.property === inter && permRow.permission);
      if (needPermission && needPermission.permission) {
        const hasPermission = await this.userService.hasPermission(needPermission.permission);
        if (!hasPermission) {
          toBeRemoved.push(inter);
        }
      }
    }
    return projectAttributes.filter(inter => !toBeRemoved.includes(inter));
  }

  public patchSearchProjects(searchProjectsValue: string): void {
    this.searchValue = searchProjectsValue;
    const queryBody = this.formatFormResult(cloneDeep(this.filters), this.filters.allCarnets);
    this.dataSource.searchRequestSubject.next({ ...queryBody, q: this.searchValue });
  }

  public async openCustomizeProjectFilterViewModal(): Promise<void> {
    const modal = this.dialogsService.showModal(CustomizeProjectFilterViewComponent);
    const hasPermission = await this.userService.hasPermission(Permission.PROJECT_DECISION_READ);
    modal.componentInstance.initialize(this.filters, hasPermission);
    const modelResult = await modal.result;
    if (modelResult && modelResult.filterResult && modelResult.allCarnets) {
      await this.setProjectFilter(modelResult.filterResult, modelResult.allCarnets);
    }
  }

  public async openExportProjectsModal(): Promise<void> {
    const storageDataList = await this.userLocalStorageService.get<[string]>(STORAGE_PROJECT_LIST_ATTRIBUTES);
    const storageDataFilter = await this.userLocalStorageService.get<[string]>(STORAGE_PROJECT_LIST_FILTER);
    const modal = this.dialogsService.showModal(ExportProjectsModalComponent);
    modal.componentInstance.initialize(storageDataFilter, storageDataList, this.projectCount);
    await modal.result;
  }

  private setProjectFilter = async (filters: IProjectFilter, allCarnets = []): Promise<void> => {
    if (filters) {
      this.filters = this.deleteNoValuesFields(filters);
      this.filters.allCarnets = allCarnets;
      await this.userLocalStorageService.set(STORAGE_PROJECT_LIST_FILTER, this.filters);

      const queryBody = this.formatFormResult(cloneDeep(filters), allCarnets);
      this.filterActivated = Object.keys(queryBody).length > 1;
      this.dataSource.searchRequestSubject.next(queryBody);
    } else {
      this.filterActivated = false;
    }

    this.updateIsExportEnabled();
  };

  private updateIsExportEnabled() {
    this.isExportEnabled = this.filters?.toStartYear && this.filters?.toStartYear === this.filters?.fromEndYear;
  }

  private deleteNoValuesFields(result: IProjectFilter) {
    for (const key in result) {
      if ([undefined, null, ''].includes(result[key]) || result[key].length === 0) {
        delete result[key];
      }
    }
    return result;
  }

  private formatFormResult(result: IProjectFilter, allCarnets: string[]) {
    if (result.annualProgram) {
      if (result.carnet) {
        result.programBookId = result.carnet;
      } else {
        if (allCarnets && allCarnets.length > 0) {
          result.programBookId = allCarnets;
        } else {
          delete result.programBookId;
        }
      }
    }
    delete result.annualProgram;
    delete result.allCarnets;
    delete result.carnet;
    if (result.boroughId && result.boroughId.length > 0) {
      result.boroughId = result.boroughId.filter(el => el !== BoroughCode.MTL);
      if (result.boroughId.length === 0) {
        delete result.boroughId;
      }
    }
    result.q = this.searchValue || '';
    return result;
  }
}
