import { Injectable } from '@angular/core';
import {
  IEnrichedProgramBook,
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  ISubmission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { PROJECT_FIELDS } from '../models/findOptions/projectFields';
import { ProjectService } from './project.service';
import { SubmissionProjectService } from './submission-project.service';

@Injectable({
  providedIn: 'root'
})
export class WindowSubmissionStoreService {
  private submissionSubject = new BehaviorSubject<ISubmission>(null);
  public submission$ = this.submissionSubject.asObservable();
  private projectsSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public projects$ = this.projectsSubject.asObservable();
  private programBookSubject = new BehaviorSubject<IEnrichedProgramBook>(null);
  public programBook$ = this.programBookSubject.asObservable();

  constructor(private submissionService: SubmissionProjectService, private projectService: ProjectService) {}

  public get submission(): ISubmission {
    return this.submissionSubject.getValue();
  }

  public get projects(): IEnrichedProject[] {
    return this.projectsSubject.getValue();
  }

  public get programBook(): IEnrichedProgramBook {
    return this.programBookSubject.getValue();
  }

  public setProgramBook(programBook: IEnrichedProgramBook) {
    this.programBookSubject.next(programBook);
  }

  public setSubmission(submission: ISubmission) {
    this.submissionSubject.next(submission);
  }

  public setProjects(projects: IEnrichedProject[]) {
    this.projectsSubject.next(projects);
  }

  public refresh(): void {
    if (this.submission) {
      this.submissionService
        .getSubmissionById(this.submissionSubject.value.submissionNumber)
        .pipe(take(1))
        .subscribe(submission => {
          this.setSubmission(submission);
        });
    }
  }

  public getProjects(): void {
    const filters: IProjectPaginatedSearchRequest = {
      id: this.submission.projectIds,
      fields: [
        PROJECT_FIELDS.PROJECT_NAME,
        PROJECT_FIELDS.PROJECT_TYPE_ID,
        PROJECT_FIELDS.INTERVENTION_IDS,
        PROJECT_FIELDS.STREET_NAME,
        PROJECT_FIELDS.STREET_FROM,
        PROJECT_FIELDS.STREET_TO,
        PROJECT_FIELDS.BOROUGH_ID,
        PROJECT_FIELDS.EXECUTOR_ID,
        PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID,
        PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_ANNUALBUDGET
      ],
      limit: this.submission.projectIds.length
    };
    this.projectService.searchProjects(filters).subscribe(async res => {
      this.setProjects(res.items);
    });
  }
}
