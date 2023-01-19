import { OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AnnualProgramExpand,
  ICountBy,
  IEnrichedAnnualProgram,
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { concat, sumBy } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseComponent } from '../shared/components/base/base.component';
import { ANNUAL_PROGRAM_FIELDS } from '../shared/models/findOptions/annualProgramFindOptions';
import { AnnualProgramService } from '../shared/services/annual-program.service';
import { ProjectService } from '../shared/services/project.service';
import { SubmissionProjectService } from '../shared/services/submission-project.service';
import { UserService } from '../shared/user/user.service';

export abstract class BaseAnnualProgramProgram extends BaseComponent implements OnInit {
  public hasPermission: boolean = false;
  public currentAnnualProgram: IEnrichedAnnualProgram;
  public programBooksIds: string[] = [];
  constructor(
    public readonly annualProgramService: AnnualProgramService,
    public readonly userService: UserService,
    public readonly projectService: ProjectService,
    public readonly submissionService: SubmissionProjectService
  ) {
    super();
  }

  public async initAnnualProgram(programId: string): Promise<void> {
    this.currentAnnualProgram = await this.annualProgramService.getOne(
      programId,
      [
        ANNUAL_PROGRAM_FIELDS.EXECUTOR_ID,
        ANNUAL_PROGRAM_FIELDS.YEAR,
        ANNUAL_PROGRAM_FIELDS.DESCRIPTION,
        ANNUAL_PROGRAM_FIELDS.BUDGET_CAP,
        ANNUAL_PROGRAM_FIELDS.SHARED_ROLES,
        ANNUAL_PROGRAM_FIELDS.STATUS,
        ANNUAL_PROGRAM_FIELDS.AUDIT,
        ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_ID,
        ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_STATUS
      ],
      [AnnualProgramExpand.programBooks]
    );
    this.annualProgramService.updateSelectedAnnualProgram(this.currentAnnualProgram);
  }

  public async getProjects(
    programBooksIds: string[],
    defaultFields: string[],
    fieldsInPermission?: string[]
  ): Promise<IEnrichedProject[]> {
    this.hasPermission = await this.userService.hasPermission(Permission.PROJECT_ANNUAL_DISTRIBUTION_READ);
    const searchRequest: IProjectPaginatedSearchRequest = {
      programBookId: programBooksIds,
      offset: 0,
      limit: 100000,
      fields: concat(defaultFields, this.hasPermission ? fieldsInPermission : [])
    };
    const projectsResult = await this.projectService.getPaginatedProjects(searchRequest);
    return projectsResult.items;
  }

  public getSubmissionsCountBy(programBooksIds: string[], countBy: string, status?: string): Observable<ICountBy[]> {
    const searchRequest = {
      programBookId: programBooksIds,
      countBy,
      status
    };

    return this.submissionService.getSubmissionCountBy(searchRequest);
  }
}
