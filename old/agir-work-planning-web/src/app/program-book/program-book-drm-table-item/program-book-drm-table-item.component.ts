import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  IApiError,
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IEnrichedProject,
  ITaxonomy
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CheckboxComponent } from 'src/app/shared/forms/checkbox/checkbox.component';
import { HiddenColumns } from 'src/app/shared/models/menu/hidden-columns';
import { ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumnConfig, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DrmProjectErrorService } from 'src/app/shared/services/drmProjectError.service';

import { BaseComponent } from 'src/app/shared/components/base/base.component';
import {
  ISubmissionLinkData,
  SubmissionNumberColumnComponent
} from 'src/app/shared/components/portals/submission-number-column/submission-number-column.component';
import { DrmSubmissionNumberFormatPipe } from 'src/app/shared/pipes/drm-submission-number-format.pipe';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { IMoreOptionsMenuItem } from '../../shared/models/more-options-menu/more-options-menu-item';
import { DrmProjectService } from '../../shared/services/drmProject.service';
import { IProjectOrderProps } from '../shared/models/submission-drm-columns';
enum BorderColor {
  borderDefault = '',
  borderWhite = 'border-white'
}

const CONFIRMATION_MESSAGE =
  'La suppression du DRM individuel entraînera la perte des données.\nÊtes-vous certain de vouloir continuer?';

@Component({
  selector: 'app-program-book-drm-table-item',
  templateUrl: './program-book-drm-table-item.component.html',
  styleUrls: ['./program-book-drm-table-item.component.scss']
})
export class ProgramBookTableDrmItemComponent extends BaseComponent implements OnChanges, OnInit, OnDestroy {
  @ViewChild('checkbox')
  public checkbox: CheckboxComponent;
  @Input() public annualProgram: IEnrichedAnnualProgram;
  @Input() public columnConfig: IColumnConfig;
  @Input() public index: number;
  @Input() public project: IEnrichedProject;
  @Input() public programBook: IEnrichedProgramBook;
  @Input() public condition: boolean;
  @Input() public programTaxonomies: ITaxonomy[];
  @Input() public boroughTaxonomies: ITaxonomy[];
  @Input() public form: FormGroup;

  public background = 'hover-background';
  public HiddenColumns = HiddenColumns;
  public menuItemsSubject = new BehaviorSubject<IMoreOptionsMenuItem[]>(null);
  public menuItems$ = this.menuItemsSubject.asObservable();
  public columnOptions: IColumnOptions;
  public myFormControlName: string;
  public disableMenu = false;

  // display checkbox classes
  public isCheckboxHidden = false;
  public borderColor = BorderColor.borderDefault;

  constructor(
    private readonly drmProjectService: DrmProjectService,
    private readonly drmProjectErrorService: DrmProjectErrorService,
    private readonly notificationService: NotificationsService,
    protected readonly appDrmSumbissionPipe: DrmSubmissionNumberFormatPipe
  ) {
    super();
  }

  public ngOnInit(): void {
    this.updateColumnItems(this.columnConfig);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.project) {
      this.setMenuMoreOptionsItems();
    }
    if (changes.project && changes.form) {
      this.initControl();
    }
    if (changes.columnConfig) {
      this.updateColumnItems(changes.columnConfig?.currentValue);
    }
    if (changes.project && changes.programTaxonomies) {
      this.initColumnOptions();
      this.drmProjectService.drmProjectDictionary$.pipe(takeUntil(this.destroy$)).subscribe(dict => {
        if (dict) {
          const key = this.appDrmSumbissionPipe.transform(this.project);
          if (!dict[key]) {
            return;
          }
          const drmOrderProps: IProjectOrderProps[] = dict[key];
          const drmOrderPropIndex = drmOrderProps.findIndex(dop => dop.id === this.project.id);

          this.setCheckboxBorder(drmOrderProps, drmOrderPropIndex);
          this.setCheckboxVisibility(drmOrderProps, drmOrderPropIndex);
        }
      });
    }
  }

  private initColumnOptions(): void {
    const link = `window/projects/${this.project.id}/overview`;
    const columnData: ISubmissionLinkData = {
      project: this.project
    };

    this.columnOptions = {
      [ProgramBookTableColumns.PROJECT_ID]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.project.id,
        link
      },
      [ProgramBookTableColumns.SUBMISSION_NUMBER]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.appDrmSumbissionPipe.transform(this.project),
        component: SubmissionNumberColumnComponent,
        columnData
      },
      [ProgramBookTableColumns.LABEL]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.project.projectName
      },
      [ProgramBookTableColumns.PROGRAM]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.getProgramCode(this.project.interventions?.find(i => !isNil(i.programId))?.programId),
        condition: false
      },
      [ProgramBookTableColumns.BOROUGH]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        taxonomyGroup: this.TaxonomyGroup.borough,
        value: this.project.boroughId
      }
    };
  }

  private updateColumnItems(columnConfig: IColumnConfig): void {
    if (!columnConfig || !columnConfig.columns) {
      return;
    }
    this.columnConfig.columns.sort(column => column.displayOrder);
  }

  private getProgramCode(code: string): string {
    if (!code) {
      return null;
    }
    const programTaxonomy = this.programTaxonomies.find(taxo => taxo.code === code);
    return programTaxonomy?.properties?.acronym?.fr || programTaxonomy?.label.fr;
  }

  private setMenuMoreOptionsItems(): void {
    const menuItems: IMoreOptionsMenuItem[] = [];
    this.addGenerateDrmMenuItem(menuItems);
    this.addDeleteDrmMenuItem(menuItems);
    this.menuItemsSubject.next(menuItems);
  }

  private addGenerateDrmMenuItem(menuItems: IMoreOptionsMenuItem[]): void {
    if (!isNil(this.project.drmNumber) || !isNil(this.project.submissionNumber)) {
      return;
    }
    menuItems.push({
      label: 'Générer un DRM individuel',
      action: () => {
        this.disableMenu = true;
        this.drmProjectService
          .postDrmNumber({ projectIds: [this.project.id], isCommonDrmNumber: false })
          .then(() => {
            this.drmProjectService.projectsDrmChangedSubject.next(true);
            this.notificationService.showSuccess('La génération du DRM a été effectuée avec succès');
            this.disableMenu = false;
          })
          .catch((e: IApiError) => {
            this.setMenuMoreOptionsItems();
            this.disableMenu = false;
            this.drmProjectErrorService.handleDrmNumberError(e, [this.project.id]);
          });
      },
      restrictionItems: this.restrictionItems
    });
  }

  private addDeleteDrmMenuItem(menuItems: IMoreOptionsMenuItem[]): void {
    if (isNil(this.project.drmNumber) || !isNil(this.project.submissionNumber)) {
      return;
    }
    menuItems.push({
      label: 'Supprimer le DRM',
      action: async () => {
        const result = await this.drmProjectService.showDeleteConfirmationModal(
          'Supprimer le DRM individuel',
          CONFIRMATION_MESSAGE
        );
        if (result) {
          await this.drmProjectService.deleteDrmNumber([this.project.id]);
          this.drmProjectService.projectsDrmChangedSubject.next(true);
          this.notificationService.showSuccess('La suppression du DRM a été effectuée avec succès');
        }
      },
      restrictionItems: this.restrictionItems
    });
  }

  private initControl(): void {
    this.myFormControlName = `checkbox-${this.project.id}`;
    this.form.addControl(this.myFormControlName, new FormControl(null));
  }

  public setValue(event: boolean): void {
    const value = event ? this.project.id : null;
    this.form.controls[this.myFormControlName].setValue(value);
  }

  private setCheckboxBorder(drmOrderProps: IProjectOrderProps[], drmOrderPropIndex: number): void {
    drmOrderProps.length > 1 && drmOrderPropIndex < drmOrderProps.length - 1
      ? (this.borderColor = BorderColor.borderWhite)
      : (this.borderColor = BorderColor.borderDefault);
  }

  private setCheckboxVisibility(drmOrderProps: IProjectOrderProps[], drmOrderPropIndex: number): void {
    const submissionNumbers = drmOrderProps.map(dop => dop.submissionNumber).filter(x => x !== '');
    this.isCheckboxHidden = submissionNumbers.length && drmOrderPropIndex > 0 ? true : false;
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [{ entity: this.project, entityType: 'PROJECT' }];
  }
}
