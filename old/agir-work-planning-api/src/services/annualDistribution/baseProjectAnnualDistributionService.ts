import {
  AdditionalCostType,
  IAdditionalCost,
  IAdditionalCostsTotalAmount,
  IAnnualBudgetDistributionSummary,
  IAnnualProjectDistributionSummary,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  IEnrichedProjectAnnualPeriod,
  ProjectCategory,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { range } from 'lodash';
import { IAnnualDistributionService } from './iAnnualDistributionService';
export abstract class BaseProjectAnnualDistributionService implements IAnnualDistributionService {
  public createAnnualDistribution(project: IEnrichedProject): IEnrichedProjectAnnualDistribution {
    const annualPeriods = this.createAnnualPeriods(project);
    const distributionSummary = this.createDistributionSummary();
    distributionSummary.totalInterventionBudgets = 0;
    return {
      annualPeriods,
      distributionSummary
    };
  }

  public updateAnnualDistribution(project: IEnrichedProject): void {
    const yearRange = this.getProjectYearRange(project);
    const annualPeriods: IEnrichedProjectAnnualPeriod[] = [];
    for (let i = 0; i < yearRange.length; i++) {
      const year = yearRange[i];
      let annualPeriod = this.getAnnualPeriodByYear(project.annualDistribution.annualPeriods, year);
      if (!annualPeriod) {
        annualPeriod = this.createAnnualPeriod(project, year);
      } else {
        this.updateAnnualPeriod(annualPeriod, project, i);
      }
      annualPeriods.push(annualPeriod);
    }
    project.annualDistribution.annualPeriods = annualPeriods;
  }

  private getAnnualPeriodByYear(
    annualPeriods: IEnrichedProjectAnnualPeriod[],
    year: number
  ): IEnrichedProjectAnnualPeriod {
    return annualPeriods.find(x => x.year === year);
  }

  private createAnnualPeriods(project: IEnrichedProject): IEnrichedProjectAnnualPeriod[] {
    const yearRange = this.getProjectYearRange(project);
    return yearRange.map(year => this.createAnnualPeriod(project, year));
  }

  protected createAnnualPeriod(project: IEnrichedProject, year: number): IEnrichedProjectAnnualPeriod {
    const rank = year - project.startYear;
    const annualPeriod: IEnrichedProjectAnnualPeriod = {
      rank,
      year,
      additionalCosts: this.createDefaultAdditionalCosts(),
      annualAllowance: 0,
      additionalCostsTotalBudget: 0,
      annualBudget: 0
    };

    this.updateAnnualPeriodStatus(annualPeriod, project.status);
    annualPeriod.categoryId = this.getProjectCategoryId(year, project.startYear, project.endYear, annualPeriod.status);

    return annualPeriod;
  }

  protected updateAnnualPeriod(
    annualPeriod: IEnrichedProjectAnnualPeriod,
    project: IEnrichedProject,
    index: number
  ): void {
    this.updateAnnualPeriodStatus(annualPeriod, project.status);
    annualPeriod.categoryId = this.getProjectCategoryId(
      annualPeriod.year,
      project.startYear,
      project.endYear,
      annualPeriod.status
    );
    annualPeriod.rank = index;
  }

  protected updateAnnualPeriodStatus(annualPeriod: IEnrichedProjectAnnualPeriod, projectStatus: string): void {
    if (projectStatus === ProjectStatus.replanned || projectStatus === ProjectStatus.postponed) {
      annualPeriod.status = projectStatus;
    } else if (projectStatus !== ProjectStatus.programmed && annualPeriod.programBookId) {
      annualPeriod.status = ProjectStatus.programmed;
    } else if (projectStatus === ProjectStatus.canceled) {
      annualPeriod.status = ProjectStatus.canceled;
    } else {
      annualPeriod.status = ProjectStatus.planned;
    }
  }

  protected createDefaultAdditionalCosts(): IAdditionalCost[] {
    return Object.values(AdditionalCostType).map(x => {
      return {
        type: x,
        amount: 0
      } as IAdditionalCost;
    });
  }

  private createDefaultAdditionalCostTotals(): IAdditionalCostsTotalAmount[] {
    return Object.values(AdditionalCostType).map(x => {
      return {
        type: x,
        amount: 0
      } as IAdditionalCostsTotalAmount;
    });
  }

  protected createDistributionSummary(): IAnnualProjectDistributionSummary {
    const additionalCostTotals = this.createDefaultAdditionalCostTotals();
    const totalAdditionalCosts = 0;
    const totalBudget = 0;
    const totalAnnualBudget: IAnnualBudgetDistributionSummary = { totalAllowance: 0 };
    return {
      totalBudget,
      additionalCostTotals,
      totalAdditionalCosts,
      totalAnnualBudget
    };
  }

  // Those 2 functions only exists to break circular dependencies
  // 36) src/services/annualDistribution/geolocatedAnnualDistributionService.ts -> src/services/annualDistribution/baseProjectAnnualDistributionService.ts -> src/features/projects/models/project.ts -> src/features/projects/models/plainProject.ts -> src/features/annualPeriods/models/projectAnnualPeriod.ts -> src/features/programBooks/models/programBook.ts -> src/features/annualPrograms/models/annualProgram.ts -> src/features/annualPrograms/annualProgramStateMachine.ts -> src/features/programBooks/mongo/programBookRepository.ts -> src/features/projects/mongo/projectRepository.ts -> src/features/interventions/mongo/interventionRepository.ts -> src/features/programBooks/programBooksOnProjectUpdateCommand.ts -> src/features/projects/projectService.ts -> src/factories/annualDistributionServiceFactory.ts
  // 37) src/services/annualDistribution/baseProjectAnnualDistributionService.ts -> src/features/projects/models/project.ts -> src/features/projects/models/plainProject.ts -> src/features/annualPeriods/models/projectAnnualPeriod.ts -> src/features/programBooks/models/programBook.ts -> src/features/annualPrograms/models/annualProgram.ts -> src/features/annualPrograms/annualProgramStateMachine.ts -> src/features/programBooks/mongo/programBookRepository.ts -> src/features/projects/mongo/projectRepository.ts -> src/features/interventions/mongo/interventionRepository.ts -> src/features/programBooks/programBooksOnProjectUpdateCommand.ts -> src/features/projects/projectService.ts -> src/factories/annualDistributionServiceFactory.ts -> src/services/annualDistribution/nonGeolocatedAnnualDistributionService.ts
  private getProjectYearRange(project: IEnrichedProject) {
    return range(project.startYear, project.endYear + 1);
  }
  private getProjectCategoryId(requestedYear: number, startYear: number, endYear: number, status: string) {
    if (status === ProjectStatus.postponed && requestedYear === startYear) {
      return ProjectCategory.postponed;
    }

    if (startYear < requestedYear && endYear >= requestedYear) {
      return ProjectCategory.completing;
    }

    return ProjectCategory.new;
  }
}
