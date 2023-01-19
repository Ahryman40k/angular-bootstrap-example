import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedProgramBook,
  IEnrichedProject,
  ProjectDecisionType,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { filter, remove, sumBy } from 'lodash';
import { Observable } from 'rxjs';
import { enumValues } from 'src/app/shared/utils/utils';
import { IProgramBookDisplayData } from '../program-book-composition.component';
interface IProjectStatistic {
  projectCategory: string;
  integratedProjectCount: number;
  nonIntegratedProjectCount: number;
  projectEnvCount: number;
  othersProjectCount: number;
  budget: number;
}
enum ProjectCategoryFields {
  NEW = 'Nouveau',
  REPORTED = 'Reporté',
  IN_PROGRESS = 'Parachèvement',
  TOTAL = 'Total',
  REMOVEDS = 'Retirés'
}
@Component({
  selector: 'app-projects-composition',
  templateUrl: './projects-composition.component.html',
  styleUrls: ['./projects-composition.component.scss']
})
export class ProjectsCompositionComponent implements OnInit {
  // Data received from the ProgramBookCompositionComponent
  public projects: IEnrichedProject[];
  public removedProjects: IEnrichedProject[];
  public programBook: IEnrichedProgramBook;
  public hasPermissionProjectAnnualDistribution: boolean;
  public hasProjectDecisionsPermission: boolean;
  @Input() public programBookDataReady$: Observable<IProgramBookDisplayData>;

  // Local data
  public reportedPrejects: IEnrichedProject[];
  public projectsInProgress: IEnrichedProject[];
  public newProjects: IEnrichedProject[];

  public projectStatistics: IProjectStatistic[] = [];

  public projectCategoryFields = ProjectCategoryFields;

  public ngOnInit() {
    this.programBookDataReady$.subscribe(data => {
      if (!data) {
        return;
      }
      this.projects = data.projects;
      this.removedProjects = data.removedProjects;
      this.programBook = data.programBook;
      this.hasPermissionProjectAnnualDistribution = data.hasPermissionProjectAnnualDistribution;
      this.hasProjectDecisionsPermission = data.hasProjectDecisionsPermission;

      this.reportedPrejects = [];
      this.projectsInProgress = [];
      this.newProjects = [];
      this.projectStatistics = [];
      this.projects.forEach(p => {
        if (p.decisions?.find(e => e.typeId === ProjectDecisionType.postponed)) {
          this.reportedPrejects.push(p);
        } else if (p.startYear < this.programBook.annualProgram.year) {
          this.projectsInProgress.push(p);
        } else {
          this.newProjects.push(p);
        }
      });
      const projectCategoryFields = enumValues<ProjectCategoryFields>(ProjectCategoryFields);
      if (!this.hasProjectDecisionsPermission) {
        remove(projectCategoryFields, e => e === ProjectCategoryFields.REPORTED);
      }

      this.projectStatistics = projectCategoryFields.map(cat => {
        switch (cat) {
          case ProjectCategoryFields.NEW:
            return this.getStatisticFromCategory(ProjectCategoryFields.NEW, this.newProjects);
          case ProjectCategoryFields.IN_PROGRESS:
            return this.getStatisticFromCategory(ProjectCategoryFields.IN_PROGRESS, this.projectsInProgress);
          case ProjectCategoryFields.REPORTED:
            return this.getStatisticFromCategory(ProjectCategoryFields.REPORTED, this.reportedPrejects);
          case ProjectCategoryFields.TOTAL:
            return this.getStatisticFromCategory(ProjectCategoryFields.TOTAL, this.projects);
          case ProjectCategoryFields.REMOVEDS:
            return this.getStatisticFromCategory(ProjectCategoryFields.REMOVEDS, this.removedProjects);
          default:
        }
      });
    });
  }

  public getStatisticFromCategory(projectCat: string, projects: IEnrichedProject[]): IProjectStatistic {
    let budgetSum: number;
    if (projectCat !== ProjectCategoryFields.REMOVEDS) {
      budgetSum = sumBy(projects, ({ annualDistribution }) =>
        sumBy(
          filter(annualDistribution?.annualPeriods, period => period?.programBookId === this.programBook.id),
          'annualBudget'
        )
      );
    } else {
      budgetSum = sumBy(projects, ({ annualDistribution }) =>
        sumBy(
          filter(annualDistribution?.annualPeriods, period => period.year === this.programBook.annualProgram?.year),
          'annualBudget'
        )
      );
    }

    return {
      projectCategory: projectCat,
      integratedProjectCount: projects.filter(p => p.projectTypeId === ProjectType.integrated).length,
      projectEnvCount: projects.filter(p => p.projectTypeId === ProjectType.integratedgp).length,
      nonIntegratedProjectCount: projects.filter(p => p.projectTypeId === ProjectType.nonIntegrated).length,
      othersProjectCount: projects.filter(p => p.projectTypeId === ProjectType.other).length,
      budget: budgetSum
    };
  }
}
