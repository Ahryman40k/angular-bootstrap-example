import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { concat, flatten } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { INTERVENTION_FIELDS } from 'src/app/shared/models/findOptions/interventionFields';
import { PROJECT_FIELDS } from 'src/app/shared/models/findOptions/projectFields';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { UserService } from 'src/app/shared/user/user.service';

export interface IProgramBookDisplayData {
  projects: IEnrichedProject[];
  removedProjects: IEnrichedProject[];
  programBook: IEnrichedProgramBook;
  hasPermissionProjectAnnualDistribution: boolean;
  hasProjectDecisionsPermission: boolean;
  hasPermissionInterventionAnnualDistribution: boolean;
  interventions: IEnrichedIntervention[];
}

@Component({
  selector: 'app-program-book-composition',
  templateUrl: './program-book-composition.component.html',
  styleUrls: ['./program-book-composition.component.scss']
})
export class ProgramBookCompositionComponent implements OnChanges {
  @Input() public programBook: IEnrichedProgramBook;

  private readonly programBookDataReady = new BehaviorSubject<IProgramBookDisplayData>(undefined);
  public programBookDataReady$ = this.programBookDataReady.asObservable();

  public projects: IEnrichedProject[];
  public removedProjects: IEnrichedProject[];

  public interventions: IEnrichedIntervention[];
  public hasPermissionProjectAnnualDistribution: boolean;
  public hasPermissionInterventionAnnualDistribution: boolean;
  public hasProjectDecisionsPermission: boolean;

  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly interventionService: InterventionService
  ) {}

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes.programBook?.previousValue !== changes.programBook?.currentValue) {
      this.hasPermissionInterventionAnnualDistribution = await this.userService.hasPermission(
        Permission.INTERVENTION_ANNUAL_DISTRIBUTION_READ
      );
      this.hasPermissionProjectAnnualDistribution = await this.userService.hasPermission(
        Permission.PROJECT_ANNUAL_DISTRIBUTION_READ
      );
      this.hasProjectDecisionsPermission = await this.userService.hasPermission(Permission.PROJECT_DECISION_READ);
      if (this.programBook?.priorityScenarios[0]?.orderedProjects?.paging.totalCount > 0) {
        this.projects = await this.getProgramBookProjects();
        const interventionIds = flatten(this.projects.map(e => e.interventionIds));
        if (interventionIds.length > 0) {
          await this.initInterventions(interventionIds);
        }
      } else {
        this.projects = [];
        this.interventions = [];
      }
      this.removedProjects = await this.getProgramBookRemovedProjects();
      this.programBookDataReady.next({
        programBook: this.programBook,
        projects: this.projects,
        removedProjects: this.removedProjects,
        interventions: this.interventions,
        hasPermissionProjectAnnualDistribution: this.hasPermissionProjectAnnualDistribution,
        hasPermissionInterventionAnnualDistribution: this.hasPermissionInterventionAnnualDistribution,
        hasProjectDecisionsPermission: this.hasProjectDecisionsPermission
      });
    }
  }

  public async getProgramBookProjects(): Promise<IEnrichedProject[]> {
    const defaultFields = [PROJECT_FIELDS.PROJECT_TYPE_ID, PROJECT_FIELDS.START_YEAR, PROJECT_FIELDS.INTERVENTION_IDS];
    const fieldsInPermission = [
      PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID,
      PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_ANNUALBUDGET
    ];
    const fields = concat(
      defaultFields,
      this.hasPermissionProjectAnnualDistribution ? fieldsInPermission : [],
      this.hasProjectDecisionsPermission ? PROJECT_FIELDS.DECESION_TYPE_ID : []
    );
    const searchRequest: IProjectPaginatedSearchRequest = {
      programBookId: this.programBook.id,
      offset: 0,
      limit: this.programBook?.priorityScenarios[0]?.orderedProjects?.paging.totalCount,
      fields
    };
    const projetcsResult = await this.projectService.getPaginatedProjects(searchRequest);
    return projetcsResult.items;
  }

  public async getProgramBookRemovedProjects(): Promise<IEnrichedProject[]> {
    if (this.programBook?.removedProjectsIds?.length > 0) {
      const defaultFields = [
        PROJECT_FIELDS.PROJECT_TYPE_ID,
        PROJECT_FIELDS.START_YEAR,
        PROJECT_FIELDS.INTERVENTION_IDS
      ];
      const fieldsInPermission = [
        PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_YEAR,
        PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_ANNUALBUDGET
      ];
      const fields = concat(defaultFields, this.hasPermissionProjectAnnualDistribution ? fieldsInPermission : []);
      const searchRequest: IProjectPaginatedSearchRequest = {
        id: this.programBook.removedProjectsIds,
        offset: 0,
        limit: this.programBook.removedProjectsIds.length,
        fields
      };
      const projetcsResult = await this.projectService.getPaginatedProjects(searchRequest);
      return projetcsResult.items;
    }
    return [];
  }

  public async initInterventions(interventionIds: string[]): Promise<void> {
    const defaultFields = [
      INTERVENTION_FIELDS.INTERVENTION_TYPE_ID,
      INTERVENTION_FIELDS.REQUESTOR_ID,
      INTERVENTION_FIELDS.PROGRAM_ID
    ];
    const fieldsInPermission = [
      INTERVENTION_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_YEAR,
      INTERVENTION_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_ANNUAL_LENGTH,
      INTERVENTION_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_ANNUAL_ALLOWANCE
    ];
    const fields = concat(defaultFields, this.hasPermissionInterventionAnnualDistribution ? fieldsInPermission : []);
    const searchObjects: IProjectPaginatedSearchRequest = {
      id: interventionIds,
      offset: 0,
      limit: interventionIds.length,
      fields
    };
    this.interventions = (
      await this.interventionService
        .searchPaginatedInterventions(searchObjects)
        .pipe(take(1))
        .toPromise()
    ).items;
  }
}
