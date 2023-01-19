import { Injectable } from '@angular/core';
import {
  IEnrichedProject,
  ISubmission,
  ProjectStatus,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, flatten, isNil, remove, uniq } from 'lodash';
import { BehaviorSubject, Subject } from 'rxjs';
import { UserRestrictionsService } from '../user/user-restrictions.service';
@Injectable({ providedIn: 'root' })
export class SubmissionProjectStoreService {
  private sortProjectsSubject = new Subject<boolean>();
  public sortProjects$ = this.sortProjectsSubject.asObservable();

  private selectedProjectsSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public selectedProjects$ = this.selectedProjectsSubject.asObservable();

  private projectsSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  private submissionsSubject = new BehaviorSubject<ISubmission[]>([]);
  public submissions$ = this.submissionsSubject.asObservable();

  constructor(private readonly userRestrictionsService: UserRestrictionsService) {}

  public sortProjects() {
    this.sortProjectsSubject.next(true);
  }
  public get selectedProjects() {
    return this.selectedProjectsSubject.getValue();
  }

  public get selectedProjectsIds() {
    return this.selectedProjects.map(el => el.id);
  }

  public get projects() {
    return this.projectsSubject.getValue();
  }

  public get submissions() {
    return this.submissionsSubject.getValue();
  }

  public selectProject(project: IEnrichedProject) {
    const projects = this.selectedProjects;
    projects.push(project);
    this.selectedProjectsSubject.next(projects);
  }

  public selectAllProjects() {
    this.selectedProjectsSubject.next(this.selectableProjects);
  }

  public deselectProject(project: IEnrichedProject) {
    const projects = this.selectedProjects;
    remove(projects, item => item.id === project.id);
    this.selectedProjectsSubject.next(projects);
  }

  public setProjects(projects: IEnrichedProject[]) {
    this.projectsSubject.next(projects);
  }

  public setSubmissions(submissions: ISubmission[]) {
    this.submissionsSubject.next(submissions);
  }

  public clearSelectedProjects() {
    this.selectedProjectsSubject.next([]);
  }

  public clearProjects() {
    this.projectsSubject.next([]);
  }

  public clearSubmissions() {
    this.submissionsSubject.next([]);
  }

  public clearAll() {
    this.clearProjects();
    this.clearSubmissions();
    this.clearSelectedProjects();
  }

  public updateSubmission(newSubmission: ISubmission) {
    const newSubmissions = cloneDeep(this.submissions);
    const index = newSubmissions.findIndex(el => el.submissionNumber === newSubmission.submissionNumber);
    // update if exist
    if (index > -1) {
      newSubmissions.splice(index, 1, newSubmission);
    }
    // push if not
    else {
      newSubmissions.push(newSubmission);
    }
    this.setSubmissions(newSubmissions);
  }

  public patchProject(id: string, partialProject: Partial<IEnrichedProject>) {
    const newProjects = this.projects.map(el => (el.id === id ? { ...el, ...partialProject } : el));
    this.setProjects(newProjects);
  }

  public patchProjects(ids: string[], partialProject: Partial<IEnrichedProject>) {
    const newProjects = this.projects.map(el => (ids.includes(el.id) ? { ...el, ...partialProject } : el));
    this.setProjects(newProjects);
  }

  // checkbox projects

  public get selectableProjects(): IEnrichedProject[] {
    return this.projects.filter(el => !this.isCheckboxDisabled(el));
  }

  public get isCheckAllDisabled(): boolean {
    return (
      !(this.isAllProjectsWithSameSubmissionInvalid || this.isAllProjectsWithSameDrm) || !this.selectableProjects.length
    );
  }

  // return true when all projects have the same invalid submission number
  private get isAllProjectsWithSameSubmissionInvalid(): boolean {
    const projectsWithSubmissionInvalid = this.selectableProjects.filter(el => this.isProjectWithSubmissionInvalid(el));
    return (
      projectsWithSubmissionInvalid.length === this.selectableProjects.length &&
      projectsWithSubmissionInvalid.every(el => {
        return el.submissionNumber === projectsWithSubmissionInvalid[0].submissionNumber;
      })
    );
  }

  // return true when all projects have the same drm and without any submission number
  private get isAllProjectsWithSameDrm(): boolean {
    const projectsWithDrmOnly = this.selectableProjects.filter(el => el.drmNumber && !el.submissionNumber);
    return (
      projectsWithDrmOnly.length === this.selectableProjects.length &&
      projectsWithDrmOnly.every(el => {
        return el.drmNumber === projectsWithDrmOnly[0].drmNumber;
      })
    );
  }

  public isCheckboxDisabled(project: IEnrichedProject): boolean {
    return (
      !this.isProjectWithDrm(project) ||
      !this.isProjectWithStatusPreliminaryOrderedOrFinalOrdered(project) ||
      this.isProjectWithSubmissionValid(project) ||
      this.isProjectNotCompatibleWithSelected(project) ||
      !this.userRestrictionsService.validate([{ entity: project, entityType: 'PROJECT' }])
    );
  }

  private isProjectWithDrm(project: IEnrichedProject): boolean {
    return !!project.drmNumber;
  }

  public isFirstProjectWithSubmission(project: IEnrichedProject): boolean {
    const firstIndex = this.projects.findIndex(el => {
      if (this.isProjectWithDrmOnly(project)) {
        return el.drmNumber === project.drmNumber && this.isProjectWithDrmOnly(el);
      }
      if (!project.drmNumber) {
        return !el.drmNumber;
      }
      return el.submissionNumber === project.submissionNumber;
    });
    return this.projects.findIndex(el => el.id === project.id) === firstIndex;
  }

  public isProjectWithStatusPreliminaryOrderedOrFinalOrdered(project: IEnrichedProject): boolean {
    return project.status === ProjectStatus.preliminaryOrdered || project.status === ProjectStatus.finalOrdered;
  }

  private isProjectNotCompatibleWithSelected(project: IEnrichedProject): boolean {
    if (!this.selectedProjects.length) {
      return false;
    }
    if (this.isSelectedProjectsWithDrmOnly) {
      return !isNil(project.submissionNumber) || this.drmFromSelectedProjects !== project.drmNumber;
    }
    if (this.isSelectedProjectsWithSubmissionInvalid) {
      return isNil(project.submissionNumber) || this.submissionNumberFromSelectedProjects !== project.submissionNumber;
    }
    return this.drmFromSelectedProjects !== project.drmNumber;
  }

  public isProjectWithSubmissionInvalid(project: IEnrichedProject): boolean {
    const submission = this.submissions.find(el => el.submissionNumber === project.submissionNumber);
    return submission ? submission.status === SubmissionStatus.INVALID : false;
  }

  public isProjectWithSubmissionValid(project: IEnrichedProject): boolean {
    const submission = this.submissions.find(el => el.submissionNumber === project.submissionNumber);
    return submission ? submission.status === SubmissionStatus.VALID : false;
  }
  public isProjectHasSubmissionRequirement(project: IEnrichedProject): boolean {
    const submission = this.submissions.find(
      sub => sub?.projectIds?.includes(project.id) && sub.status === SubmissionStatus.VALID
    );
    const submissionRequirementsProjectIds = uniq(flatten(submission?.requirements?.map(req => req.projectIds)));
    return submissionRequirementsProjectIds.includes(project.id);
  }

  public isProjectWithDrmOnly(project): boolean {
    return project.drmNumber && !project.submissionNumber;
  }

  private get isSelectedProjectsWithDrmOnly(): boolean {
    return this.selectedProjects.length !== 0 && this.selectedProjects.every(el => this.isProjectWithDrmOnly(el));
  }

  private get drmFromSelectedProjects(): string {
    return this.selectedProjects.length ? this.selectedProjects.find(x => x).drmNumber : '';
  }

  private get submissionNumberFromSelectedProjects(): string {
    return this.selectedProjects.length ? this.selectedProjects.find(x => x).submissionNumber : '';
  }

  private get isSelectedProjectsWithSubmissionInvalid(): boolean {
    return (
      this.selectedProjects.length !== 0 && this.selectedProjects.every(el => this.isProjectWithSubmissionInvalid(el))
    );
  }
}
