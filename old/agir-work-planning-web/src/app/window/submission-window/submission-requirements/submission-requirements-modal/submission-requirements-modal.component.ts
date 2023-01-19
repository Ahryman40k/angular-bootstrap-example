import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IConflictualItem,
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  ISubmission,
  ISubmissionRequirement,
  ITaxonomy,
  ProjectStatus,
  SubmissionProgressStatus,
  SubmissionRequirementMention,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEqual, remove } from 'lodash';
import { take, takeUntil } from 'rxjs/operators';
import { arrayUtils } from 'src/app/shared/arrays/array.utils';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { BtnLabel } from 'src/app/shared/models/btn-label';
import { PROJECT_FIELDS } from 'src/app/shared/models/findOptions/projectFields';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { ObjectTypeService } from 'src/app/shared/services/object-type.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { RequirementMessages } from 'src/app/shared/services/requirement.service';
import { SearchObjectResults, SearchObjectsService } from 'src/app/shared/services/search-objects.service';
import { SubmissionRequirementsService } from 'src/app/shared/services/submission-requirements.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
const SEARCH_RESULTS_MAX_LENGTH = 5;

export enum requirementSubmissionType {
  specific = 'specific',
  generic = 'generic',
  obsolete = 'obsolete'
}

interface IISubTypeForSelect {
  label: { en: string; fr: string };
  subTypes: ITaxonomy[];
}
interface ISelectedObject extends IConflictualItem {
  data: IEnrichedProject;
  btnLabel: string;
}
@Component({
  selector: 'app-submission-requirements-modal',
  templateUrl: './submission-requirements-modal.component.html',
  styleUrls: ['./submission-requirements-modal.component.scss']
})
export class SubmissionRequirementsModalComponent extends BaseComponent implements OnInit {
  @Input() public title: string;
  @Input() public buttonLabel: string;
  @Input() public submissionRequirement: ISubmissionRequirement;

  public get submission(): ISubmission {
    return this.windowSubmissionStoreService.submission;
  }
  public get canSubmit(): boolean {
    return this.form.valid && this.formhasProjectIds();
  }
  public get isSpecific(): boolean {
    return this.form?.controls?.elementConcerned.value === requirementSubmissionType.specific;
  }

  public get submissionRequirementMention(): SubmissionRequirementMention {
    if (
      this.submission.progressStatus === SubmissionProgressStatus.PRELIMINARY_DRAFT ||
      this.submission.progressStatus === SubmissionProgressStatus.DESIGN
    ) {
      return SubmissionRequirementMention.BEFORE_TENDER;
    }
    return SubmissionRequirementMention.AFTER_TENDER;
  }

  public elementsConcerned = [
    {
      id: requirementSubmissionType.generic,
      label: 'Générique à la soumission'
    },
    {
      id: requirementSubmissionType.specific,
      label: 'Projet spécifique'
    }
  ];
  public readonly disabledSearchObjectTypes = [
    ObjectType.address,
    ObjectType.asset,
    ObjectType.submissionNumber,
    ObjectType.intervention
  ];
  public selectedObjects: ISelectedObject[] = [];
  public selectedProjects: IEnrichedProject[] = [];
  public submissionRequirementSubtypes: ITaxonomy[];
  public submissionRequirementTypes: ITaxonomy[];
  public requirementSubtypeForSelect: IISubTypeForSelect[] = [];
  public submissionProgressStatus = SubmissionProgressStatus;
  public btnLabel = BtnLabel.selected;
  public form: FormGroup;
  public submitting: boolean = false;
  constructor(
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly objectTypeService: ObjectTypeService,
    private readonly projectService: ProjectService,
    private readonly searchObjectsService: SearchObjectsService,
    private readonly activeModal: NgbActiveModal,
    private readonly submissionRequirementsService: SubmissionRequirementsService,
    private readonly notificationsService: NotificationsService,
    private readonly windowSubmissionStoreService: WindowSubmissionStoreService
  ) {
    super();
  }

  public formhasProjectIds(): boolean {
    if (
      this.form?.controls?.elementConcerned.value === requirementSubmissionType.generic ||
      this.selectedProjects.length > 0
    ) {
      return true;
    }
    return false;
  }

  public ngOnInit() {
    this.taxonomiesService
      .group(TaxonomyGroup.submissionRequirementSubtype)
      .pipe(take(1))
      .subscribe(subtypeData => {
        this.submissionRequirementSubtypes = subtypeData;
        // group subTypes by type for the select exemple works : rehabEgBeforePrcpr , Travaux ESP avant PCPR
        const groupedRequirementSubtype = arrayUtils.groupBy(
          this.submissionRequirementSubtypes,
          element => element.properties.requirementType
        );
        this.taxonomiesService
          .group(TaxonomyGroup.submissionRequirementType)
          .pipe(take(1))
          .subscribe(typeData => {
            this.submissionRequirementTypes = typeData;
            this.submissionRequirementTypes.forEach((type, i) => {
              if (groupedRequirementSubtype.get(type?.code)) {
                this.requirementSubtypeForSelect.push({
                  label: { en: type.label.en, fr: type.label.fr },
                  subTypes: groupedRequirementSubtype.get(type.code)
                });
              }
            });
          });
      });
    this.createForm();

    if (this.submissionRequirement) {
      this.assignForm();
      if (!this.isGeneric()) {
        void this.initSelectedProjects();
      }
    }

    this.form.controls.subtype.valueChanges.subscribe(element => {
      const selectedRequirementType = this.submissionRequirementTypes.filter(
        e => e.code === element.properties.requirementType
      );
      this.form.controls.type.setValue(selectedRequirementType[0]);
    });
  }
  private assignForm(): void {
    this.form.reset({
      type: this.submissionRequirementTypes.find(e => e.code === this.submissionRequirement.typeId),
      subtype: this.submissionRequirementSubtypes.find(e => e.code === this.submissionRequirement.subtypeId),
      text: this.submissionRequirement.text,
      elementConcerned: this.isGeneric() ? this.elementsConcerned[0].id : this.elementsConcerned[1].id
    });
  }

  private async initSelectedProjects(): Promise<void> {
    const filter: IProjectPaginatedSearchRequest = {
      id: this.submissionRequirement.projectIds,
      bbox: null,
      fields: [
        PROJECT_FIELDS.PROJECT_NAME,
        PROJECT_FIELDS.PROJECT_TYPE_ID,
        PROJECT_FIELDS.SUBMISSION_NUMBER,
        PROJECT_FIELDS.STATUS,
        PROJECT_FIELDS.START_YEAR
      ]
    };
    const projectsSearched = await this.projectService.getProjects(filter);
    this.selectedObjects = [];
    this.assignConflictualItemObject(projectsSearched.items);
    this.selectedObjects.map(ci => (ci.btnLabel = BtnLabel.remove));
    this.selectedProjects = projectsSearched.items;
  }
  private createForm(): FormGroup {
    this.form = this.fb.group({
      type: [null, Validators.required],
      subtype: [null, Validators.required],
      text: [null, Validators.required],
      elementConcerned: [null, Validators.required],
      searchProjects: [null]
    });
    return this.form;
  }

  public async onSearchProjects(): Promise<void> {
    const term = this.form.controls.searchProjects.value;
    if (!term?.replace(/\s/g, '').length) {
      return undefined;
    }
    const filter: IProjectPaginatedSearchRequest = {
      q: term,
      limit: SEARCH_RESULTS_MAX_LENGTH,
      submissionNumber: this.submission?.submissionNumber,
      bbox: null,
      fields: [
        PROJECT_FIELDS.PROJECT_NAME,
        PROJECT_FIELDS.PROJECT_TYPE_ID,
        PROJECT_FIELDS.SUBMISSION_NUMBER,
        PROJECT_FIELDS.STATUS,
        PROJECT_FIELDS.START_YEAR
      ]
    };
    const projectsSearched = await this.projectService.getProjects(filter);
    this.selectedObjects = [];
    this.assignConflictualItemObject(projectsSearched.items);
  }

  private assignConflictualItemObject(projects: IEnrichedProject[]): void {
    projects.forEach(item => {
      this.selectedObjects.push(this.createConflictualItemObject(item));
    });
    this.selectedObjects = this.selectedObjects.filter(e => e.id && this.isObjectWithValidStatus(e.data.status));
  }
  protected createConflictualItemObject(project: IEnrichedProject): ISelectedObject {
    return {
      id: project.id,
      data: project,
      type: ObjectType.project,
      btnLabel: BtnLabel.selected
    };
  }

  private toggleBtnLabel(event: ISelectedObject): void {
    if (event.btnLabel === BtnLabel.selected) {
      event.type = ObjectType.project;
      event.btnLabel = BtnLabel.remove;
    } else {
      event.btnLabel = BtnLabel.selected;
    }
  }
  public filterSearchResults = (results: IEnrichedProject[]) => {
    return results?.filter(element => this.isObjectWithValidStatus(element.status));
  };

  public isObjectWithValidStatus(status: string): boolean {
    const invalidStatuses: string[] = [ProjectStatus.canceled];
    return !invalidStatuses.includes(status);
  }

  public handleConflictualPair(event: ISelectedObject, index: number): void {
    if (this.btnLabel === BtnLabel.remove) {
      this.selectedObjects.splice(index, 1);
    } else {
      const object = this.createConflictualItemObject(event);
      this.selectedObjects.splice(1, 0, object);
    }
    this.toggleBtnLabel(event);
  }

  public selectProject(event: ISelectedObject) {
    if (event.btnLabel === BtnLabel.selected) {
      event.btnLabel = BtnLabel.remove;
      this.selectedProjects.push(event.data);
    } else {
      event.btnLabel = BtnLabel.selected;
      this.selectedProjects.push(event.data);
      remove(this.selectedProjects, p => p.id === event.data.id);
    }
  }

  public create(): void {
    let projectIds;
    if (this.form.controls.elementConcerned.value === requirementSubmissionType.specific) {
      projectIds = this.selectedProjects.map(p => p.id);
    } else if (this.form.controls.elementConcerned.value === requirementSubmissionType.generic) {
      projectIds = this.submission.projectIds;
    }
    this.submitting = true;
    const requirementUpsert: any = {
      subtypeId: this.form.controls.subtype.value.code,
      text: this.form.controls.text.value,
      projectIds
    };
    if (this.submissionRequirement) {
      this.submissionRequirementsService
        .updateSubmissionRequirement(this.submission.submissionNumber, requirementUpsert, this.submissionRequirement.id)
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe(
          data => {
            this.notificationsService.show(RequirementMessages.updateSuccess, NotificationAlertType.success);
            this.windowSubmissionStoreService.refresh();
            this.activeModal.close();
          },
          error => {
            this.notificationsService.show(RequirementMessages.addError, NotificationAlertType.danger);
          }
        );
    } else {
      this.submissionRequirementsService
        .addSubmissionRequirement(this.submission.submissionNumber, requirementUpsert)
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe(
          data => {
            this.notificationsService.show(RequirementMessages.addSuccess, NotificationAlertType.success);
            this.windowSubmissionStoreService.refresh();
            this.activeModal.close();
          },
          error => {
            this.notificationsService.show(RequirementMessages.addError, NotificationAlertType.danger);
          }
        );
    }

    this.submitting = false;
  }
  public isGeneric(): boolean {
    return isEqual(this.submissionRequirement?.projectIds, this.submission.projectIds);
  }

  public cancel() {
    this.activeModal.close();
  }
}
