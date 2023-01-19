import { Component, OnInit } from '@angular/core';
import {
  BoroughCode,
  InterventionDecisionType,
  InterventionStatus,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty } from 'lodash';
import { CustomizeInterventionFilterViewModalComponent } from 'src/app/shared/dialogs/customize-intervention-filter-view-modal/customize-intervention-filter-view-modal';
import { CustomizeInterventionTableViewModalComponent } from 'src/app/shared/dialogs/customize-intervention-table-view-modal/customize-intervention-table-view-modal.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ExportInterventionsModalComponent } from 'src/app/shared/dialogs/export-modal/export-interventions-modal/export-interventions-modal.component';
import { UserLocalStorageService } from 'src/app/shared/services/user-local-storage.service';
import { BaseComponent } from '../../shared/components/base/base.component';
import {
  DEFAULT_DISPLAYED_COLUMNS,
  InterventionDataSource
} from '../../shared/components/vdm-table/datasource/intervention-datasource';
import { TaxonomyPipe } from '../../shared/pipes/taxonomies.pipe';
import { UserService } from '../../shared/user/user.service';
const STORAGE_INTERVENTION_LIST_ATTRIBUTES = 'interventions-list-attributs-storage-key';
const STORAGE_INTERVENTION_LIST_FILTER = 'interventions-interventions-list-filter-storage-key';

@Component({
  selector: 'app-intervention-data-table',
  templateUrl: './intervention-data-table.component.html',
  styleUrls: ['./intervention-data-table.component.scss'],
  providers: [TaxonomyPipe, InterventionDataSource]
})
export class InterventionDataTableComponent extends BaseComponent implements OnInit {
  public get interventionCount(): number {
    return this.dataSource.count;
  }

  public interventionAttributes;
  public filters;
  public filterActivated;
  public searchValue;

  // Export
  public userHasExportPermission: boolean;
  public isExportEnabled: boolean;

  constructor(
    public dataSource: InterventionDataSource,
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
      .hasPermission(Permission.INTERVENTION_EXTRACT)
      .then(hasPermission => {
        this.userHasExportPermission = hasPermission;
      })
      .catch();
  }

  public get isLoading(): boolean {
    return this.dataSource.loading;
  }

  public async initDisplayedColumns(): Promise<void> {
    // await this.userLocalStorageService.set(STORAGE_INTERVENTION_LIST_ATTRIBUTES, DEFAULT_DISPLAYED_COLUMNS);
    const storageDataList = await this.userLocalStorageService.get<[string]>(STORAGE_INTERVENTION_LIST_ATTRIBUTES);
    await this.setInterventionAttributes(isEmpty(storageDataList) ? DEFAULT_DISPLAYED_COLUMNS : storageDataList);

    this.dataSource.isLoadEnabled = true;

    const storageDataFilter = await this.userLocalStorageService.get<[string]>(STORAGE_INTERVENTION_LIST_FILTER);
    const interventionFilters = isEmpty(storageDataFilter) ? null : storageDataFilter;
    if (interventionFilters) {
      await this.setInterventionFilter(interventionFilters);
    } else {
      this.dataSource.searchRequestSubject.next(this.dataSource.searchRequestSubject.value);
    }
  }

  public async openCustomizeInterventionTableViewModal(): Promise<void> {
    const modal = this.dialogsService.showModal(CustomizeInterventionTableViewModalComponent);
    const allInterventionList = await this.filterByPermissions(this.dataSource.columns.map(col => col.property));
    const fullColumns = this.dataSource.columns.filter(col => allInterventionList.includes(col.property));
    modal.componentInstance.initialize(this.interventionAttributes, fullColumns, DEFAULT_DISPLAYED_COLUMNS);
    const tableColumns = await modal.result;
    await this.setInterventionAttributes(tableColumns);
  }

  public async openCustomizeInterventionFilterViewModal(): Promise<void> {
    const modal = this.dialogsService.showModal(CustomizeInterventionFilterViewModalComponent);
    const hasPermission = await this.userService.hasPermission(Permission.INTERVENTION_DECISION_READ);
    modal.componentInstance.initialize(this.filters, hasPermission);
    const filterResult = await modal.result;
    if (filterResult !== false) {
      await this.setInterventionFilter(filterResult);
    }
  }

  public async openExportInterventionsModal(): Promise<void> {
    const storageDataList = await this.userLocalStorageService.get<[string]>(STORAGE_INTERVENTION_LIST_ATTRIBUTES);
    const storageDataFilter = await this.userLocalStorageService.get<[string]>(STORAGE_INTERVENTION_LIST_FILTER);
    const modal = this.dialogsService.showModal(ExportInterventionsModalComponent);
    modal.componentInstance.initialize(storageDataFilter, storageDataList, this.interventionCount);
    await modal.result;
  }

  private setInterventionFilter = async filters => {
    if (filters) {
      this.filters = this.deleteNoValuesFields(filters);
      await this.userLocalStorageService.set(STORAGE_INTERVENTION_LIST_FILTER, this.filters);
      const queryBody = this.formatFormResult(cloneDeep(this.filters));
      this.filterActivated = Object.keys(queryBody).length > 1;
      this.dataSource.searchRequestSubject.next(queryBody);
    } else {
      this.filterActivated = false;
    }

    this.updateIsExportEnabled();
  };

  private updateIsExportEnabled() {
    this.isExportEnabled =
      this.filters?.fromPlanificationYear && this.filters?.fromPlanificationYear === this.filters?.toPlanificationYear;
  }

  private deleteNoValuesFields(result) {
    for (const key in result) {
      if ([null, ''].includes(result[key]) || result[key].length === 0) {
        delete result[key];
      }
    }
    return result;
  }

  private formatFormResult(result) {
    if (result.boroughId && result.boroughId.length > 0) {
      result.boroughId = result.boroughId.filter(el => el !== BoroughCode.MTL);
      if (result.boroughId.length === 0) {
        delete result.boroughId;
      }
    }
    if (result.status && result.status.length > 0) {
      if (result.status.includes(InterventionDecisionType.revisionRequest)) {
        result.decisionTypeId = [InterventionDecisionType.revisionRequest];
        result.status = result.status.filter(el => el !== InterventionDecisionType.revisionRequest);
        if (!result.status.includes(InterventionStatus.waiting)) {
          result.status.push(InterventionStatus.waiting);
        }
      }
    }
    result.q = this.searchValue || '';
    return result;
  }

  private setInterventionAttributes = async tableColumns => {
    if (tableColumns) {
      this.interventionAttributes = await this.filterByPermissions(tableColumns);
      await this.userLocalStorageService.set(STORAGE_INTERVENTION_LIST_ATTRIBUTES, this.interventionAttributes);
      // keep requirementsConception at last of list on view but not on localstorage
      if (this.interventionAttributes.includes('requirementsConception')) {
        const res = this.interventionAttributes.filter(e => e !== 'requirementsConception');
        res.push('requirementsConception');
        this.dataSource.displayedColumnsSubject.next(res);
      } else {
        this.dataSource.displayedColumnsSubject.next(this.interventionAttributes);
      }
    }
  };

  private async filterByPermissions(interventionAttributes): Promise<any> {
    const toBeRemoved = [];
    for await (const inter of interventionAttributes) {
      const needPermission = this.dataSource.columns.find(permRow => permRow.property === inter && permRow.permission);
      if (needPermission && needPermission.permission) {
        const hasPermission = await this.userService.hasPermission(needPermission.permission);
        if (!hasPermission) {
          toBeRemoved.push(inter);
        }
      }
    }

    return interventionAttributes.filter(inter => !toBeRemoved.includes(inter));
  }

  public searchInterventions(searchInterventionsValue: string) {
    this.searchValue = searchInterventionsValue;
    this.filters = { ...this.filters, q: this.searchValue };
    const queryBody = this.formatFormResult(cloneDeep(this.filters));
    this.dataSource.searchRequestSubject.next(queryBody);
  }
}
