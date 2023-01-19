import { ChangeDetectionStrategy, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IDrmProject, IEnrichedProject, IOrderedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, Dictionary, groupBy, isNil, orderBy } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { CheckboxComponent } from 'src/app/shared/forms/checkbox/checkbox.component';
import { ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumn, IColumnOptions } from 'src/app/shared/models/table/column-config-interfaces';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { DrmSubmissionNumberFormatPipe } from 'src/app/shared/pipes/drm-submission-number-format.pipe';
import { DrmProjectService } from 'src/app/shared/services/drmProject.service';
import { DrmProjectErrorService } from 'src/app/shared/services/drmProjectError.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';
import { WindowBroadcastService } from 'src/app/shared/window/window-broadcast.service';

import { ProgramBookTableDrmItemComponent } from '../program-book-drm-table-item/program-book-drm-table-item.component';
import { ProgramBookSubmissionDrmAbstract } from '../shared/abstracts/submission-drm-abstract';
import {
  DEFAULT_TABLE_COLUMNS,
  IProjectOrderProps,
  NON_PNI_FIELDS,
  PNI_FIELDS,
  TDirection
} from '../shared/models/submission-drm-columns';

const CONFIRMATION_MESSAGE =
  'La suppression des DRM entraînera la perte des données.\nÊtes-vous certain de vouloir continuer?';
const CONFIRMATION_MESSAGE_INDIVIDUEL =
  'La suppression du DRM entraînera la perte des données.\nÊtes-vous certain de vouloir continuer?';
const DELETE_A_DRM = 'Supprimer le DRM';
const DELETE_DRM = 'Supprimer les DRM';
@Component({
  selector: 'app-program-book-details-drm',
  styleUrls: ['./program-book-drm.component.scss'],
  templateUrl: './program-book-details-drm.html'
})
export class ProgramBookDetailsDrmComponent extends ProgramBookSubmissionDrmAbstract implements OnInit {
  public get isBottomBarActive(): boolean {
    if (!this.tableItems) {
      return false;
    }
    return this.tableItems.toArray().some(ti => ti.checkbox?.value);
  }

  protected get defaultColumns(): IColumn[] {
    return DEFAULT_TABLE_COLUMNS;
  }

  protected get projects(): IEnrichedProject[] {
    return this.projectsSubject.getValue();
  }

  @ViewChildren('programBookTableItems')
  public tableItems: QueryList<ProgramBookTableDrmItemComponent>;

  public title = 'Gestion des DRM';
  public emptyListMessage = 'Cette section est présentement vide';

  @ViewChild('masterCheckbox')
  public masterCheckbox: CheckboxComponent;

  private readonly projectsSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  public form: FormGroup;
  private isCheckboxesChecked = false;
  public selectedProjectCount = 0;
  public selectedDrmProjectCount = 0;
  public deleteDrmLabel = DELETE_A_DRM;

  constructor(
    protected readonly taxonomiesService: TaxonomiesService,
    protected readonly projectService: ProjectService,
    protected readonly formBuilder: FormBuilder,
    protected readonly notificationsService: NotificationsService,
    protected readonly windowBroadcastService: WindowBroadcastService,
    protected readonly interventionService: InterventionService,
    protected readonly drmProjectService: DrmProjectService,
    protected readonly drmProjectErrorService: DrmProjectErrorService,
    protected readonly appDrmSumbissionPipe: DrmSubmissionNumberFormatPipe,
    protected readonly dialogsService: DialogsService,
    protected readonly priorityScenarioService: PriorityScenarioService,
    public readonly programBookService: ProgramBookService,
    protected readonly userPreferenceService: UserPreferenceService
  ) {
    super(
      taxonomiesService,
      projectService,
      formBuilder,
      notificationsService,
      windowBroadcastService,
      interventionService,
      appDrmSumbissionPipe,
      dialogsService,
      priorityScenarioService,
      programBookService,
      userPreferenceService
    );
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initForm();
    this.initToggleBottomBar();
    this.initProjectsDrmChanged();
  }

  private initProjectsDrmChanged() {
    this.drmProjectService.projectsDrmChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initProjects();
    });
  }

  protected initForm(): void {
    this.form = this.formBuilder.group({});
  }

  protected initProjects(): void {
    this.setProjects([]);
    const fields = this.getFields();
    const limit = this.programBook.priorityScenarios[this.DEFAULT_SCENARIO_INDEX].orderedProjects.paging.totalCount;
    if (!limit) {
      return;
    }
    this.isLoading = true;
    this.projectService
      .searchProjects({
        programBookId: this.programBook.id,
        limit,
        fields
      })
      .pipe(take(1))
      .subscribe(async paginatedProjects => {
        this.setProjects(paginatedProjects.items);
        await this.expandProjects();
        this.initColumnConfig();
        this.initTableItemsChange();
        this.initToggleBottomBar();

        this.isLoading = false;
      });
  }

  protected setProjects(projects: IEnrichedProject[]): void {
    this.projectsSubject.next(projects);
  }

  public columnOptions(project: IEnrichedProject): IColumnOptions {
    const link = `window/projects/${project.id}/overview`;
    return {
      [ProgramBookTableColumns.PROJECT_ID]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: project.id,
        link
      },
      [ProgramBookTableColumns.SUBMISSION_NUMBER]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.appDrmSumbissionPipe.transform(project)
      },
      [ProgramBookTableColumns.LABEL]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: project.projectName
      },
      [ProgramBookTableColumns.PROGRAM]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.getProgramCode(project.interventions?.find(i => !isNil(i.programId))?.programId),
        condition: false
      },
      [ProgramBookTableColumns.BOROUGH]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        taxonomyGroup: this.TaxonomyGroup.borough,
        value: project.boroughId
      }
    };
  }

  private initToggleBottomBar(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checkboxes => {
      const projectIds: string[] = [];
      for (const key of Object.keys(checkboxes)) {
        if (checkboxes[key]) {
          projectIds.push(this.form.controls[key].value);
        }
      }
      this.setSelectedDrmProjectCount(projectIds);
      this.setDeleteDrmLabel();
      this.setSelectedProjectCount(projectIds);
    });
  }

  protected getFields(): string {
    return this.canProgramBookContainPni() ? PNI_FIELDS : NON_PNI_FIELDS;
  }

  private groupProjectsByProps(props: IProjectOrderProps[], direction: TDirection): Dictionary<IProjectOrderProps[]> {
    let cloneProps = cloneDeep(props);
    cloneProps = orderBy(cloneProps, ['value'], [direction]);

    return groupBy(cloneProps, valueProp =>
      valueProp.submissionNumber?.length ? valueProp.submissionNumber : valueProp.value
    );
  }

  protected orderProjectsByProps(props: IProjectOrderProps[], direction: TDirection): void {
    const groups = this.groupProjectsByProps(props, direction);

    let newIdx = 0;
    Object.keys(groups)?.forEach(key => {
      groups[key].forEach(valueAndId => {
        const projectIdx = this.projects.findIndex(p => p.id === valueAndId.id);
        const proj = this.projects.splice(projectIdx, 1)[0];
        this.projects.splice(newIdx, 0, proj);
        newIdx++;
      });
    });
    this.drmProjectService.drmProjectDictionarySubject.next(groups);
  }

  public toggleCheckboxes(): void {
    this.isCheckboxesChecked = !this.isCheckboxesChecked;
    this.setCheckboxesValue(this.isCheckboxesChecked);
  }

  private resetCheckboxes(): void {
    this.masterCheckbox.setValue(false);
    this.isCheckboxesChecked = false;
    this.setCheckboxesValue(false);
  }

  private setCheckboxesValue(checked: boolean): void {
    this.tableItems.toArray()?.forEach(ti => {
      if (!ti.checkbox.disabled) {
        ti.checkbox.setValue(checked);
      }
    });
  }

  private setSelectedDrmProjectCount(projectIds: string[]): void {
    const projects = this.projects.filter(p => projectIds.includes(p.id));
    this.selectedDrmProjectCount = projects.filter(p => !!p.drmNumber).length;
  }

  private setDeleteDrmLabel(): void {
    this.deleteDrmLabel = this.selectedDrmProjectCount === 1 ? DELETE_A_DRM : DELETE_DRM;
  }

  private setSelectedProjectCount(projectIds: string[]): void {
    this.selectedProjectCount = this.projects.filter(p => projectIds.includes(p.id)).length || 0;
  }

  protected cancel(): void {
    this.resetCheckboxes();
  }

  public async generateDrmNumber(isCommonDrmNumber: boolean): Promise<void> {
    this.isLoading = true;
    const projectIds: string[] = [];
    for (const key of Object.keys(this.form.value)) {
      if (this.form.value[key]) {
        projectIds.push(this.form.value[key]);
      }
    }
    let drmProjects: IDrmProject[];

    try {
      drmProjects = await this.drmProjectService.postDrmNumber({
        projectIds,
        isCommonDrmNumber
      });
    } catch (e) {
      this.drmProjectErrorService.handleDrmNumberError(e, projectIds);
      return;
    } finally {
      this.resetCheckboxes();
      this.form.reset();
    }

    projectIds?.forEach(projectId => {
      const drmProject = drmProjects.find(drmNum => drmNum.projectId === projectId);
      if (!drmProject) {
        return;
      }
      const project = this.projects.find(p => p.id === projectId);
      project.drmNumber = drmProject.drmNumber;
    });
    // Cloned otherwise angular doesn't detect change
    this.setProjects(cloneDeep(this.projects));
    this.initTableItemsChange();
    this.isLoading = false;
  }

  public async deleteDrmNumber(): Promise<void> {
    const drmNumbers = this.projects
      .map(p => {
        if (this.form.value[`checkbox-${p.id}`] === p.id) {
          return p.drmNumber;
        }
        return false;
      })
      .filter(x => x);
    const projectIds = this.projects
      .map(p => {
        if (drmNumbers.includes(p.drmNumber)) {
          return p.id;
        }
        return null;
      })
      .filter(x => x);
    const confirmationMessage =
      this.selectedDrmProjectCount > 1 ? CONFIRMATION_MESSAGE : CONFIRMATION_MESSAGE_INDIVIDUEL;
    const title = this.selectedDrmProjectCount > 1 ? DELETE_DRM : DELETE_A_DRM;
    const result = await this.drmProjectService.showDeleteConfirmationModal(title, confirmationMessage);
    if (result) {
      await this.drmProjectService.deleteDrmNumber(projectIds);
      this.notificationsService.showSuccess('La suppression des DRM a été effectuée avec succès');
      this.drmProjectService.projectsDrmChangedSubject.next(true);
      this.resetCheckboxes();
      this.form.reset();
    }
  }
}
