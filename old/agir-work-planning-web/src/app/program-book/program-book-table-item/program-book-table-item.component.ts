import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IEnrichedProject,
  IOrderedProject,
  ProjectExternalReferenceType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { filter, isNil, sumBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { MoreOptionsButtonComponent } from 'src/app/shared/components/more-options-button/more-options-button.component';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { IMenuItemConfig } from 'src/app/shared/models/menu/menu-item-config';
import { ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumnConfig, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { CurrencyKPipe } from 'src/app/shared/pipes/currencyk.pipe';
import { MetersToKilometersPipe } from 'src/app/shared/pipes/metersToKilometers.pipe';
import { ProjectCategoriesPipe } from 'src/app/shared/pipes/projectCategories.pipe';
import { TaxonomyPipe } from 'src/app/shared/pipes/taxonomies.pipe';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { Utils } from 'src/app/shared/utils/utils';

import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DrmSubmissionNumberFormatPipe } from 'src/app/shared/pipes/drm-submission-number-format.pipe';
import { MenuItemKey } from '../../shared/models/menu/menu-item-key';
import { IMoreOptionsMenuItem } from '../../shared/models/more-options-menu/more-options-menu-item';
import { ProjectMenuService } from '../../shared/services/project-menu.service';

@Component({
  selector: 'app-program-book-table-item',
  templateUrl: './program-book-table-item.component.html',
  styleUrls: ['./program-book-table-item.component.scss'],
  providers: [CurrencyKPipe, MetersToKilometersPipe, ProjectCategoriesPipe, TaxonomyPipe, DecimalPipe]
})
export class ProgramBookTableItemComponent extends BaseComponent implements OnChanges, OnInit, OnDestroy {
  @ViewChild('moreOptions', { read: MoreOptionsButtonComponent }) public moreOptions: MoreOptionsButtonComponent;

  @Input() public annualProgram: IEnrichedAnnualProgram;
  @Input() public columnConfig: IColumnConfig;
  @Input() public index: number;
  @Input() public menuItemConfig: IMenuItemConfig;
  @Input() public opened = false;
  @Input() public project: IEnrichedProject;
  @Input() public previousOrderedProject: IOrderedProject;
  @Input() public orderedProject: IOrderedProject;
  @Input() public programBook: IEnrichedProgramBook;
  @Input() public isOrdered: boolean;

  public DEFAULT_SUBMISSION_NUMBER = '00000000';

  public HiddenColumns = HiddenColumns;
  public menuItems: Observable<IMoreOptionsMenuItem[]>;
  public projectAnnualBudget: string;
  public projectAnnualLength: number;
  public columnOptions: IColumnOptions;
  public serviceAndPriorityLabels: { [priorityOrLabelCode: string]: string } = {};

  public form: FormGroup;

  public get background(): string {
    return this.orderedProject?.isManuallyOrdered ? 'bg-info' : 'hover-background';
  }

  public get levelRank(): string {
    return this.orderedProject?.levelRank === 0 || !this.orderedProject?.levelRank
      ? '-'
      : this.orderedProject?.levelRank.toString();
  }

  public get priorityServices(): string {
    const priorityServiceText = [];
    if (!this.project.servicePriorities) {
      return undefined;
    }

    for (const servicePriority of this.project.servicePriorities) {
      priorityServiceText.push(
        `${this.serviceAndPriorityLabels[servicePriority.service]} - ${
          this.serviceAndPriorityLabels[servicePriority.priorityId]
        }`
      );
    }
    return priorityServiceText.join(', ');
  }

  public get rank(): number {
    return this.orderedProject?.rank ? Math.floor(this.orderedProject?.rank) : this.orderedProject?.rank;
  }

  public get externalReferenceId(): string {
    return this.project.externalReferenceIds?.find(
      externalReferenceId => externalReferenceId.type === ProjectExternalReferenceType.infoRTUReferenceNumber
    )?.value;
  }

  constructor(
    private readonly menuService: ProjectMenuService,
    private readonly priorityScenarioService: PriorityScenarioService,
    private readonly formBuilder: FormBuilder,
    private readonly currencyKPipe: CurrencyKPipe,
    private readonly metersToKilometersPipe: MetersToKilometersPipe,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly appDrmSubmissionNumberFormatPipe: DrmSubmissionNumberFormatPipe,
    private decimalPipe: DecimalPipe
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    await this.initTaxonomies();
    this.initForm();
    this.updateColumnItems(this.columnConfig);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.project) {
      this.setMenuItemConfigs();
      this.menuItems = this.menuService.getMenuItems(changes.project.currentValue, this.destroy$, this.menuItemConfig);
      this.setProjectAnnualBudget();
      this.setProjectAnnualLength();
    }
    if (changes.columnConfig) {
      this.updateColumnItems(changes.columnConfig?.currentValue);
    }
  }

  private async initTaxonomies(): Promise<void> {
    const [services, priorities] = await combineLatest(
      this.taxonomiesService.group(TaxonomyGroup.service),
      this.taxonomiesService.group(TaxonomyGroup.priorityType)
    )
      .pipe(take(1))
      .toPromise();

    Object.assign(this.serviceAndPriorityLabels, ...Utils.taxonomiesToAcronymOrLabelCodeObjects(services));
    Object.assign(this.serviceAndPriorityLabels, ...Utils.taxonomiesToAcronymOrLabelCodeObjects(priorities));
  }

  private updateColumnItems(columnConfig: IColumnConfig): void {
    if (!columnConfig || !columnConfig.columns) {
      return;
    }
    this.columnConfig.columns.sort(column => column.displayOrder);
    this.updateColumnOptions();
  }

  private updateColumnOptions(): void {
    const isManual = this.orderedProject?.isManuallyOrdered;
    const projectLink = `window/projects/${this.project.id}/overview`;
    const budget = this.currencyKPipe.transform(this.projectAnnualBudget);
    const length = this.projectAnnualLength;

    this.columnOptions = {
      [ProgramBookTableColumns.BOROUGH]: { value: this.project.boroughId, taxonomyGroup: this.TaxonomyGroup.borough },
      [ProgramBookTableColumns.BUDGET]: { value: budget, permission: this.Permission.PROJECT_BUDGET_READ },
      [ProgramBookTableColumns.CATEGORY]: { value: this.project, annualProgramYear: this.annualProgram.year },
      [ProgramBookTableColumns.SUB_CATEGORY]: {
        value: this.project.subCategoryIds,
        taxonomyGroup: this.TaxonomyGroup.projectSubCategory
      },
      [ProgramBookTableColumns.END_YEAR]: { value: this.project.endYear },
      [ProgramBookTableColumns.EXECUTOR]: {
        value: this.project.executorId,
        taxonomyGroup: this.TaxonomyGroup.executor
      },
      [ProgramBookTableColumns.INITIAL_REQUESTOR]: {
        value: this.project.inChargeId,
        taxonomyGroup: this.TaxonomyGroup.requestor
      },
      [ProgramBookTableColumns.LABEL]: { value: this.project.projectName },
      [ProgramBookTableColumns.LENGTH]: { value: `${length} km` },
      [ProgramBookTableColumns.MEDALS]: { value: this.project.medalId, taxonomyGroup: this.TaxonomyGroup.medalType },
      [ProgramBookTableColumns.NO_BIC_INFO_RTU]: { value: this.externalReferenceId },
      [ProgramBookTableColumns.PRIORITY_LEVEL]: {
        value: this.levelRank,
        condition: this.isOrdered,
        isBadge: true,
        innerClass: isManual ? 'badge-info' : 'badge-light'
      },
      [ProgramBookTableColumns.PRIORITY_SERVICE]: {
        value: this.priorityServices
      },
      [ProgramBookTableColumns.PROJECT_ID]: {
        value: this.project.id,
        link: projectLink,
        innerClass: isManual ? 'text-info border-bottom-0' : 'text-primary'
      },
      [ProgramBookTableColumns.PROJECT_TYPE]: {
        value: this.project.projectTypeId,
        taxonomyGroup: this.TaxonomyGroup.projectType
      },
      [ProgramBookTableColumns.RANK]: { value: this.rank, condition: this.isOrdered },
      [ProgramBookTableColumns.ROAD_NETWORK_TYPE]: {
        value: this.project.roadNetworkTypeId,
        taxonomyGroup: this.TaxonomyGroup.roadNetworkType
      },
      [ProgramBookTableColumns.START_YEAR]: { value: this.project.startYear },
      [ProgramBookTableColumns.STREET_FROM]: { value: this.project.streetFrom },
      [ProgramBookTableColumns.STREET_NAME]: { value: this.project.streetName },
      [ProgramBookTableColumns.STREET_TO]: { value: this.project.streetTo },
      [ProgramBookTableColumns.SUBMISSION_NUMBER]: {
        value: this.appDrmSubmissionNumberFormatPipe.transform(this.project)
      }
    };
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      selection: [null]
    });
  }

  public setProjectAnnualBudget(): void {
    const matchingAnnualPeriod = this.project.annualDistribution.annualPeriods.find(
      ap => ap.year === this.annualProgram.year
    );
    this.projectAnnualBudget = this.decimalPipe.transform(matchingAnnualPeriod?.annualBudget, '1.0-3');
  }

  public setProjectAnnualLength(): void {
    this.projectAnnualLength = sumBy(this.project.interventions, ({ annualDistribution }) =>
      sumBy(
        filter(annualDistribution?.annualPeriods, period => period.year === this.annualProgram?.year),
        'annualLength'
      )
    );
  }

  private setMenuItemConfigs(): void {
    if (!this.menuItemConfig) {
      this.menuItemConfig = {};
    }
    if (this.isRemoveProject()) {
      return;
    }

    this.menuItemConfig.orderedProject = this.orderedProject;
    this.menuItemConfig.programBook = this.programBook;
    this.menuItemConfig.annualProgram = this.annualProgram;
    this.menuItemConfig.changeProjectRank = !!this.orderedProject;
    this.menuItemConfig.consultSequencingNotes = this.orderedProject?.isManuallyOrdered;
    this.menuItemConfig.removeProjectManualRank =
      this.orderedProject?.isManuallyOrdered &&
      !this.priorityScenarioService.arePriorityScenariosOutdated(this.programBook);
    this.menuItemConfig.addPriorityService = this.project.startYear >= this.annualProgram.year;
    this.menuItemConfig.hiddenMenuItems = [MenuItemKey.ROAD_SECTION_ACTIVITY];
    this.menuItemConfig.disableAddProjectToProgramBook = true;
  }

  private isRemoveProject(): boolean {
    return isNil(this.project.annualDistribution.annualPeriods.find(ap => ap.programBookId === this.programBook.id));
  }
}
