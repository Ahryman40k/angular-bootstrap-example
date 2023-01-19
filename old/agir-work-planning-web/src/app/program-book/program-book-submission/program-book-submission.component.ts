import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  IEnrichedProject,
  ISubmission,
  ISubmissionCreateRequest,
  ISubmissionsSearchRequest,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isNil, orderBy, uniq } from 'lodash';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  ISubmissionLinkData,
  SubmissionNumberColumnComponent
} from 'src/app/shared/components/portals/submission-number-column/submission-number-column.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
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
import { SubmissionProjectErrorService } from 'src/app/shared/services/submission-project-error.service';
import { SubmissionProjectStoreService } from 'src/app/shared/services/submission-project-store.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserPreferenceService } from 'src/app/shared/services/user-preference.service';
import { WindowBroadcastService } from 'src/app/shared/window/window-broadcast.service';

import { ProgramBookSubmissionDrmAbstract } from '../shared/abstracts/submission-drm-abstract';
import {
  DEFAULT_TABLE_COLUMNS,
  IProjectOrderProps,
  NON_PNI_FIELDS,
  PNI_FIELDS,
  SUBMISSION_COLUMNS,
  SUBMISSION_FIELDS,
  TDirection
} from '../shared/models/submission-drm-columns';

const createSubmissionSuccess = 'Soumission crée avec succès';

@Component({
  selector: 'app-program-book-details-submission',
  styleUrls: ['./program-book-submission.component.scss'],
  templateUrl: './program-book-submission.component.html'
})
export class ProgramBookSubmissionComponent extends ProgramBookSubmissionDrmAbstract {
  public projects$ = this.submissionProjectStore.projects$;
  public actions = {
    cancel: 'Annuler',
    createSubmission: 'Créer une soumission'
  };

  public title = 'Gestion des soumissions';

  public emptyListMessage = 'Ce carnet n’a aucune soumission pour l’instant.';

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
    protected readonly userPreferenceService: UserPreferenceService,
    protected readonly submissionProjectStore: SubmissionProjectStoreService,
    protected readonly submissionProjectService: SubmissionProjectService,
    private readonly submissionProjectErrorService: SubmissionProjectErrorService
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
    this.submissionProjectStore.clearAll();
    this.submissionProjectStore.sortProjects$.subscribe(() => {
      this.sortProjectsByColumn(this.sortedColumn, this.sortedDirection);
    });
  }

  protected initProjects(): void {
    this.submissionProjectStore.clearAll();
    const fields = this.getFields();
    const limit = this.programBook.priorityScenarios[this.DEFAULT_SCENARIO_INDEX].orderedProjects.paging.totalCount;
    if (!limit) {
      return;
    }
    this.isLoading = true;
    this.projectService
      .searchProjects({
        programBookId: this.programBook.id,
        fields,
        limit
      })
      .pipe(take(1))
      .subscribe(async paginatedProjects => {
        this.submissionProjectStore.setProjects(paginatedProjects.items);
        await this.expandProjects();
        this.getSubmissions();
        this.initColumnConfig();
        this.initTableItemsChange();
        this.isLoading = false;
      });
  }

  protected setProjects(projects: IEnrichedProject[]): void {
    this.submissionProjectStore.setProjects(projects);
  }

  private getSubmissions(): void {
    const submissionNumbers = uniq(this.projects.map(el => el.submissionNumber).filter(x => x));
    if (!submissionNumbers.length) {
      this.submissionProjectStore.clearSubmissions();
      return;
    }
    const searchRequest: ISubmissionsSearchRequest = {
      limit: submissionNumbers.length,
      fields: ['submissionNumber', 'status', 'projectIds', 'requirements'],
      submissionNumber: submissionNumbers
    };
    this.submissionProjectService
      .submissionPostSearch(searchRequest)
      .pipe(take(1))
      .subscribe((res: IPaginatedResults<ISubmission>) => {
        this.submissionProjectStore.setSubmissions(res.items);
      });
  }

  public switchCheckbox(value: boolean) {
    if (value) {
      this.submissionProjectStore.selectAllProjects();
    } else {
      this.submissionProjectStore.clearSelectedProjects();
    }
  }

  protected getFields(): string {
    return this.canProgramBookContainPni()
      ? `${PNI_FIELDS},${SUBMISSION_FIELDS}`
      : `${NON_PNI_FIELDS},${SUBMISSION_FIELDS}`;
  }

  public createSubmission() {
    const projectIds = this.submissionProjectStore.selectedProjectsIds;
    const submissionCreate: ISubmissionCreateRequest = {
      programBookId: this.programBook.id,
      projectIds
    };
    this.submissionProjectService
      .createSubmissionProject(submissionCreate)
      .pipe(take(1))
      .subscribe(
        (submission: ISubmission) => {
          this.notificationsService.showSuccess(createSubmissionSuccess);
          const partialProject: Partial<IEnrichedProject> = {
            submissionNumber: submission.submissionNumber
          };
          this.submissionProjectStore.clearSelectedProjects();
          this.submissionProjectStore.updateSubmission(submission);
          this.submissionProjectStore.patchProjects(projectIds, partialProject);
          this.submissionProjectStore.sortProjects();
        },
        (err: HttpErrorResponse) => {
          this.submissionProjectErrorService.handleCreateSubmissionError(err);
        }
      );
  }

  public cancel(): void {
    this.submissionProjectStore.clearSelectedProjects();
  }

  public get isCheckAllDisabled(): boolean {
    return this.submissionProjectStore.isCheckAllDisabled;
  }

  public get checkboxValue(): boolean {
    return (
      this.submissionProjectStore.selectedProjects.length &&
      this.submissionProjectStore.selectedProjects.length === this.submissionProjectStore.selectableProjects.length
    );
  }

  protected get projects(): IEnrichedProject[] {
    return this.submissionProjectStore.projects;
  }

  public get submissions(): ISubmission[] {
    return this.submissionProjectStore.submissions;
  }

  public get submissions$(): Observable<ISubmission[]> {
    return this.submissionProjectStore.submissions$;
  }

  public get selectedProjects$(): Observable<IEnrichedProject[]> {
    return this.submissionProjectStore.selectedProjects$;
  }

  protected get defaultColumns(): IColumn[] {
    const cols = cloneDeep(DEFAULT_TABLE_COLUMNS);
    cols.splice(cols.length - 1, 0, ...SUBMISSION_COLUMNS).map((el, index) => {
      return { ...el, displayOrder: index + 1 };
    });
    return cols;
  }

  public isProjectWithSubmissionInvalid(project: IEnrichedProject): boolean {
    const submission = this.submissions.find(el => el.submissionNumber === project.submissionNumber);
    return submission ? submission.status === SubmissionStatus.INVALID : false;
  }

  public columnOptions(project: IEnrichedProject): IColumnOptions {
    const columnData: ISubmissionLinkData = {
      isSubmissionInvalid: this.submissionProjectStore.isProjectWithSubmissionInvalid(project),
      project
    };
    const link = `window/projects/${project.id}/overview`;
    return {
      [ProgramBookTableColumns.PROJECT_ID]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: project.id,
        link
      },
      [ProgramBookTableColumns.SUBMISSION_NUMBER]: {
        permission: this.Permission.PROJECT_DRM_WRITE,
        value: this.appDrmSumbissionPipe.transform(project),
        component: SubmissionNumberColumnComponent,
        columnData
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
      },
      [ProgramBookTableColumns.STREET_NAME]: {
        permission: this.Permission.SUBMISSION_WRITE,
        value: project.streetName
      },
      [ProgramBookTableColumns.STREET_FROM]: {
        permission: this.Permission.SUBMISSION_WRITE,
        value: project.streetFrom
      },
      [ProgramBookTableColumns.STREET_TO]: {
        permission: this.Permission.SUBMISSION_WRITE,
        value: project.streetTo
      }
    };
  }

  protected orderProjectsByProps(props: IProjectOrderProps[], direction: TDirection): void {
    const orderedProps = orderBy(props, ['value'], [direction]);
    const projects = orderedProps
      .map(el => {
        return this.projects.find(pr => pr.id === el.id);
      })
      .filter(x => x);
    this.submissionProjectStore.setProjects(projects);
  }
}
