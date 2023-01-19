import { Component, OnInit, ViewChild } from '@angular/core';
import { ITaxonomy, ITaxonomyList, Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MoreOptionsButtonComponent } from 'src/app/shared/components/more-options-button/more-options-button.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { IColumn, IColumnConfig } from 'src/app/shared/models/table/column-config-interfaces';
import {
  ITaxonomyGroupTableColumnOptions,
  TaxonomyTableColumnLabels
} from 'src/app/shared/models/taxonomies/taxonomy-group-table';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { TaxonomyGroupItemModalComponent } from '../taxonomy-group-item-modal/taxonomy-group-item-modal.component';

export enum TaxonomyGroupPermission {
  none = 'None',
  modificationOnly = 'ModificationOnly',
  activation = 'Activation',
  write = 'Write'
}

@Component({
  selector: 'app-taxonomy-group-table',
  templateUrl: './taxonomy-group-table.component.html',
  styleUrls: ['./taxonomy-group-table.component.scss']
})
export class TaxonomyGroupTableComponent extends BaseComponent implements OnInit {
  @ViewChild('moreOptions', { read: MoreOptionsButtonComponent }) public moreOptions: MoreOptionsButtonComponent;

  public Permission = Permission;
  public TaxonomyGroup = TaxonomyGroup;
  public TaxonomyTableColumnLabels = TaxonomyTableColumnLabels;

  public group: ITaxonomy;
  public tableItems;
  public taxonomies: ITaxonomy[];
  public isInitializingTaxonomyTable: boolean = false;
  public units$: Observable<ITaxonomyList[]>;

  public columnConfig: IColumnConfig = {
    columns: [],
    hiddenColumns: []
  };

  public baseColumns: IColumn[] = [
    {
      columnName: 'code',
      displayOrder: 1
    },
    {
      columnName: 'labelfr',
      displayOrder: 2
    },
    {
      columnName: 'labelen',
      displayOrder: 3
    },
    {
      columnName: 'actions',
      displayOrder: 11
    }
  ];

  public columnOptions: ITaxonomyGroupTableColumnOptions = {
    consultation: {
      shown: false,
      sortable: false
    },
    code: {
      shown: true,
      sortable: true
    },
    labelfr: {
      shown: true,
      sortable: true
    },
    labelen: {
      shown: true,
      sortable: true
    },
    url: {
      shown: false,
      sortable: false
    },
    category: {
      shown: false,
      sortable: false
    },
    requirementType: {
      shown: false,
      sortable: false
    },
    submissionRequirementSubtype: {
      shown: false,
      sortable: false
    },
    submissionRequirementType: {
      shown: false,
      sortable: false
    },
    rtuDataName: {
      shown: false,
      sortable: false
    },
    rtuDataId: {
      shown: false,
      sortable: false
    },
    rrva: {
      shown: false,
      sortable: false
    },
    rtuDataStatus: {
      shown: false,
      sortable: false
    },
    rtuDataPhase: {
      shown: false,
      sortable: false
    },
    rtuDataValue: {
      shown: false,
      sortable: false
    },
    rtuDataDefinition: {
      shown: false,
      sortable: false
    },
    acronymfr: {
      shown: false,
      sortable: false
    },
    acronymen: {
      shown: false,
      sortable: false
    },
    isInternal: {
      shown: false,
      sortable: false
    },
    geomaticKey: {
      shown: false,
      sortable: false
    },
    assetKey: {
      shown: false,
      sortable: false
    },
    unit: {
      shown: false,
      sortable: false
    },
    actions: {
      shown: true,
      sortable: false
    }
  };

  constructor(private readonly dialogsService: DialogsService, private readonly taxonomiesService: TaxonomiesService) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
  }

  public initGroup(group: ITaxonomy): void {
    if (!group) {
      return;
    }

    this.group = group;
    this.isInitializingTaxonomyTable = true;
    this.resetColumns(group.code);
    combineLatest(
      this.taxonomiesService.group(group.code),
      this.taxonomiesService.groups(TaxonomyGroup.area, TaxonomyGroup.length),
      this.taxonomiesService.group(TaxonomyGroup.submissionRequirementSubtype)
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([taxonomies, unitGroups, submissionRequirementSubtypeTaxonomies]) => {
        const units = unitGroups[0].concat(unitGroups[1]);
        this.tableItems = taxonomies.map(item => {
          const unit = units.find(itemUnit => itemUnit.code === item.properties?.unit);
          const requirementSubtype = submissionRequirementSubtypeTaxonomies.find(
            el => el.code === item.properties?.relatedDesignRequirement
          );
          return {
            code: item.code,
            labelfr: item.label.fr,
            labelen: item.label.en,
            consultation: item.properties?.consultationOnly,
            internal: item.properties?.isInternal,
            url: item.properties?.url,
            rtuDataId: item.properties?.rtuData?.id,
            rtuDataName: item.properties?.rtuData?.name,
            rrva: item.properties?.rrvaNumArrPti,
            rtuDataStatus: item.properties?.rtuData?.status,
            rtuDataPhase: item.properties?.rtuData?.phase,
            rtuDataValue: item.properties?.rtuData?.value,
            rtuDataDefinition: item.properties?.rtuData?.definition,
            category: item.properties?.category,
            requirementType: item.properties?.requirementType,
            requirementSubtype: requirementSubtype?.label.fr,
            submissionRequirementType: item.properties?.requirementType,
            acronymfr: item.properties?.acronym?.fr,
            acronymen: item.properties?.acronym?.en,
            geomaticKey: item.properties?.geomaticKey,
            assetKey: item.properties?.assetKey,
            unit: unit ? unit.label?.fr : null,
            taxonomy: item,
            opened: false,
            menuItems: this.getMenuItems(item)
          };
        });
        this.isInitializingTaxonomyTable = false;
      });
  }

  public reset(): void {
    this.group = null;
    this.tableItems = null;
    this.isInitializingTaxonomyTable = false;
  }

  public sortColumn(column: string): void {
    const options = _.cloneDeep(this.columnOptions[column]);

    if (options.sortable) {
      this.columnConfig.columns.forEach(item => {
        this.columnOptions[item.columnName].sorted = null;
      });
      this.columnOptions[column].sorted = 'asc';
      let order: 'asc' | 'desc';

      if (options.sorted === 'asc') {
        this.columnOptions[column].sorted = order = 'desc';
      } else {
        this.columnOptions[column].sorted = order = 'asc';
      }

      this.tableItems = _.orderBy(this.tableItems, column, [order]);
    }
  }

  // tslint:disable-next-line: max-func-body-length
  private resetColumns(group: string): void {
    const columns: IColumn[] = _.cloneDeep(this.baseColumns);
    this.columnConfig.columns.forEach(item => {
      this.setColumnOptionVisibility(item.columnName, false);
      this.columnOptions[item.columnName].sorted = null;
    });
    switch (group) {
      case TaxonomyGroup.assetDataKey:
        columns.push(
          {
            columnName: 'geomaticKey',
            displayOrder: 8
          },
          {
            columnName: 'assetKey',
            displayOrder: 9
          },
          {
            columnName: 'unit',
            displayOrder: 10
          }
        );
        break;
      case TaxonomyGroup.assetType:
        columns.push({
          columnName: 'consultation',
          displayOrder: 0
        });
        break;
      case TaxonomyGroup.externalResource:
        columns.push({
          columnName: 'url',
          displayOrder: 4
        });
        break;
      case TaxonomyGroup.infoRtuPartner:
        columns.push({
          columnName: 'category',
          displayOrder: 4
        });
        break;
      case TaxonomyGroup.requirementSubtype:
        columns.push(
          {
            columnName: 'requirementType',
            displayOrder: 5
          },
          {
            columnName: 'submissionRequirementSubtype',
            displayOrder: 6
          }
        );
        break;
      case TaxonomyGroup.submissionRequirementSubtype:
        columns.push({
          columnName: 'requirementType',
          displayOrder: 5
        });
        break;
      case TaxonomyGroup.borough:
      case TaxonomyGroup.city:
        columns.push(
          {
            columnName: 'rtuDataName',
            displayOrder: 5
          },
          {
            columnName: 'rtuDataId',
            displayOrder: 4
          },
          {
            columnName: 'rrva',
            displayOrder: 6
          }
        );
        break;
      case TaxonomyGroup.bridge:
        columns.push(
          {
            columnName: 'rtuDataName',
            displayOrder: 5
          },
          {
            columnName: 'rtuDataId',
            displayOrder: 4
          }
        );
        break;
      case TaxonomyGroup.projectStatus:
        columns.push({
          columnName: 'rtuDataStatus',
          displayOrder: 4
        });
        columns.push({
          columnName: 'rtuDataPhase',
          displayOrder: 5
        });
        break;
      case TaxonomyGroup.programType:
        columns.push({
          columnName: 'acronymfr',
          displayOrder: 5
        });
        columns.push({
          columnName: 'acronymen',
          displayOrder: 6
        });
        columns.push({
          columnName: 'rtuDataValue',
          displayOrder: 7
        });
        columns.push({
          columnName: 'rtuDataDefinition',
          displayOrder: 8
        });

        break;
      case TaxonomyGroup.service:
        columns.push({
          columnName: 'acronymfr',
          displayOrder: 5
        });
        columns.push({
          columnName: 'acronymen',
          displayOrder: 6
        });
        break;
      case TaxonomyGroup.requestor:
        columns.push({
          columnName: 'isInternal',
          displayOrder: 7
        });
        break;
      default:
    }
    this.columnConfig.columns = columns.sort((a, b) => a.displayOrder - b.displayOrder);
    this.columnConfig.columns.forEach(item => this.setColumnOptionVisibility(item.columnName, true));
  }

  private setColumnOptionVisibility(columnName: string, isVisible: boolean): void {
    this.columnOptions[columnName].shown = isVisible;
  }

  public isColumnShown(columnName: string): boolean {
    return this.columnOptions[columnName].shown;
  }

  public isDetailButtonShown(): boolean {
    return this.group.code === TaxonomyGroup.assetType || this.group.code === TaxonomyGroup.service;
  }

  private getMenuItems(taxonomy: ITaxonomy): IMoreOptionsMenuItem[] {
    const menuItems: IMoreOptionsMenuItem[] = [];

    if (this.group.properties.permission !== TaxonomyGroupPermission.none) {
      menuItems.push({
        label: "Modifier l'élément",
        action: async () => {
          await this.showFormModal('Modifier un élément de taxonomie', 'Modifier', this.group, taxonomy);
        },
        permission: Permission.TAXONOMY_WRITE
      });
    }

    return menuItems;
  }

  public canAddToGroup(group: ITaxonomy): boolean {
    return group.properties.permission === TaxonomyGroupPermission.write;
  }

  public async showNewModal(): Promise<void> {
    await this.showFormModal('Ajouter un élément de taxonomie', 'Ajouter', this.group);
  }

  private async showFormModal(
    title: string,
    buttonLabel: string,
    group: ITaxonomy,
    taxonomy?: ITaxonomy
  ): Promise<any> {
    const modal = this.dialogsService.showModal(TaxonomyGroupItemModalComponent);
    modal.componentInstance.buttonLabel = buttonLabel;
    modal.componentInstance.title = title;
    modal.componentInstance.group = group;

    if (taxonomy) {
      modal.componentInstance.taxonomy = taxonomy;
    }

    await modal.result;
  }
}
