import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  IEnrichedProject,
  ISubmission,
  ISubmissionRequirement,
  SubmissionProgressStatus,
  SubmissionRequirementMention,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, isEqual, orderBy, uniq } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { distinct, distinctUntilChanged, map, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionRequirementsService } from 'src/app/shared/services/submission-requirements.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { UserService } from 'src/app/shared/user/user.service';
import { requirementSubmissionType } from '../submission-requirements-modal/submission-requirements-modal.component';

interface IRequirementSubmissionLine {
  requirement: ISubmissionRequirement;
  projects: IEnrichedProject[];
  type: requirementSubmissionType;
}

@Component({
  selector: 'app-submission-requirements-list',
  templateUrl: './submission-requirements-list.component.html',
  styleUrls: ['./submission-requirements-list.component.scss']
})
export class SubmissionRequirementsListComponent extends BaseComponent implements OnInit {
  @Input() public filterSearch: FormGroup;
  @Input() public searchByProjectsId: Observable<string>;
  @Input() public restrictionItems: IRestrictionItem[];

  @Output() public openModalEdit = new EventEmitter();
  @Output() public openModalDelete = new EventEmitter();
  @Output() public openModalRequirementObsolete = new EventEmitter();

  public searchParams: any;
  public requirmentsLine: IRequirementSubmissionLine[] = [];
  public submission: ISubmission;
  public submissionRequirementMention = SubmissionRequirementMention;
  public noResultMessage: string = "Il n'y a pas d'exigences dans cette soumission";
  constructor(
    public readonly projectService: ProjectService,
    public readonly windowSubmissionStoreService: WindowSubmissionStoreService,
    public readonly userService: UserService,
    public readonly submissionRequirementsService: SubmissionRequirementsService
  ) {
    super();
  }
  public get canWriteRequirement(): boolean {
    if (!this.userService.currentUser) {
      return false;
    }
    return (
      this.userService.currentUser.hasPermission(this.Permission.SUBMISSION_REQUIREMENT_WRITE) &&
      this.submission.status === SubmissionStatus.VALID &&
      this.isValidSubmissionProgressStatus
    );
  }
  public get isValidSubmissionProgressStatus(): boolean {
    return this.submissionRequirementsService.isValidSubmissionProgressStatus(this.submission);
  }
  public isRequirementStatusValid(submissionReq: ISubmissionRequirement): boolean {
    if (submissionReq.mentionId === SubmissionRequirementMention.BEFORE_TENDER) {
      return (
        this.submission.progressStatus === SubmissionProgressStatus.PRELIMINARY_DRAFT ||
        this.submission.progressStatus === SubmissionProgressStatus.DESIGN
      );
    }
  }
  public ngOnInit() {
    this.windowSubmissionStoreService.submission$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, current) => prev === current),
        switchMap(submission => {
          this.submission = submission;
          const projectIds = uniq(flatten(this.submission?.requirements.map(req => req.projectIds)));
          return this.projectService.searchProjects({
            id: projectIds,
            fields: ['projectName']
          });
        })
      )
      .subscribe(data => {
        const projects = data.items;
        const requirementsOrderByDate = orderBy(
          this.submission?.requirements,
          [
            resultItem => {
              return resultItem.audit.lastModifiedAt ? resultItem.audit.lastModifiedAt : resultItem.audit.createdAt;
            }
          ],
          ['desc']
        );
        this.filterSearch.valueChanges
          .pipe(startWith(this.filterSearch.value), distinct())
          .subscribe(({ statusFilter, searchTerm }) => {
            this.requirmentsLine = requirementsOrderByDate.map(req => {
              let typeReq: requirementSubmissionType;

              if (this.isGeneric(req)) {
                typeReq = requirementSubmissionType.generic;
              } else if (!this.isGeneric(req)) {
                typeReq = requirementSubmissionType.specific;
              }
              return {
                requirement: req,
                projects: projects.filter(pr => req.projectIds.includes(pr.id)),
                type: typeReq
              };
            });

            this.requirmentsLine = this.requirmentsLine.filter(rl => {
              // exclude requirements with isDeprecated equal to true when array filter includes 'obsolete'
              return (
                statusFilter.includes(rl.type) &&
                !(statusFilter.includes(requirementSubmissionType.obsolete) && rl.requirement.isDeprecated)
              );
            });
            if (searchTerm !== '') {
              this.requirmentsLine = this.requirmentsLine.filter(rl => {
                return rl.requirement.projectIds.some(id => id.includes(searchTerm));
              });
            }
          });
      });
  }

  public isGeneric(requirement: ISubmissionRequirement): boolean {
    return isEqual(requirement.projectIds, this.submission.projectIds);
  }

  public openEditModal(submissionReq: ISubmissionRequirement) {
    this.openModalEdit.emit(submissionReq);
  }
  public openDeleteModal(submissionReq: ISubmissionRequirement) {
    this.openModalDelete.emit(submissionReq);
  }
  public openRequirementObsoleteModal(submissionReq: ISubmissionRequirement) {
    this.openModalRequirementObsolete.emit(submissionReq);
  }
}
