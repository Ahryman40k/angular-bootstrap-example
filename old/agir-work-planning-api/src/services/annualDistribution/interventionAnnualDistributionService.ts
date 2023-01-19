import {
  CommentCategory,
  IAnnualInterventionDistributionSummary,
  IComment,
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IInterventionAnnualDistribution,
  IInterventionAnnualPeriod
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { isEmpty, isNil, sum as sumLodash, uniq } from 'lodash';
import { Audit } from '../../features/audit/audit';
import { commentMapperDTO } from '../../features/comments/mappers/commentMapperDTO';
import { Comment } from '../../features/comments/models/comment';
import { isIntervention } from '../../features/interventions/models/intervention';

class InterventionAnnualDistributionService {
  public create(interventions: IEnrichedIntervention[], annualPeriods: IEnrichedProjectAnnualPeriod[]) {
    this.generateAnnualPeriodFromProjectAnnualPeriods(interventions, annualPeriods);
    this.createDistributionSummary(interventions);
  }

  public generateAnnualPeriodFromProjectAnnualPeriods(
    interventions: IEnrichedIntervention[],
    annualPeriods: IEnrichedProjectAnnualPeriod[]
  ): void {
    for (const intervention of interventions) {
      const distributionAnnualPeriods = annualPeriods.filter(x => x.year >= intervention.planificationYear);
      const interventionAnnualPeriods: IInterventionAnnualPeriod[] = [];
      this.generateInterventionAnnualPeriods(
        distributionAnnualPeriods,
        interventionAnnualPeriods,
        intervention,
        annualPeriods
      );
      if (isIntervention(intervention)) {
        intervention.setAnnualDistribution({ annualPeriods: interventionAnnualPeriods });
      } else {
        intervention.annualDistribution = { annualPeriods: interventionAnnualPeriods };
      }
    }
  }

  private generateInterventionAnnualPeriods(
    distributionAnnualPeriods: IEnrichedProjectAnnualPeriod[],
    interventionAnnualPeriods: IInterventionAnnualPeriod[],
    intervention: IEnrichedIntervention,
    projectAnnualPeriods: IEnrichedProjectAnnualPeriod[]
  ): void {
    const projectStartYear = projectAnnualPeriods[0].year;
    const originalInterventionAnnualPeriods: IInterventionAnnualPeriod[] =
      intervention.annualDistribution?.annualPeriods || [];
    distributionAnnualPeriods.forEach(ap => {
      const currentAnnualPeriod = originalInterventionAnnualPeriods.find(
        originalInterventionAnnualPeriod => originalInterventionAnnualPeriod.year === ap.year
      );
      const defaultAnnualAllowance = projectAnnualPeriods.length === 1 ? intervention.estimate.allowance : 0;
      const rank = ap.year - projectStartYear;
      interventionAnnualPeriods.push({
        year: ap.year,
        annualAllowance: currentAnnualPeriod?.annualAllowance || defaultAnnualAllowance,
        annualLength: currentAnnualPeriod?.annualLength || 0,
        accountId: currentAnnualPeriod?.accountId || 0,
        rank
      });
    });
  }

  public createDistributionSummary(interventions: IEnrichedIntervention[]): void {
    for (const intervention of interventions) {
      intervention.annualDistribution.distributionSummary = this.generateDistributionSummary(
        intervention.annualDistribution
      );
    }
  }

  public generateDistributionSummary(
    interventionAnnualDistribution: IInterventionAnnualDistribution,
    note?: string
  ): IAnnualInterventionDistributionSummary {
    return {
      totalAllowance: interventionAnnualDistribution.annualPeriods
        .map(period => period.annualAllowance)
        .reduce((sum, current) => sum + current, 0),
      totalLength: interventionAnnualDistribution.annualPeriods
        .map(period => period.annualLength)
        .reduce((sum, current) => sum + current, 0),
      note: note ? note : null
    };
  }

  public async updateAnnualPeriods(
    project: IEnrichedProject,
    originalStartYear: number,
    originalEndYear: number
  ): Promise<void> {
    if (isEmpty(project.interventions)) {
      return;
    }

    const originalDuration = originalEndYear - originalStartYear;
    const duration = project.endYear - project.startYear;
    const deltaYear = duration - originalDuration;
    const isDurationSame = originalDuration === duration;
    const isOriginalProjectBigger = originalDuration > duration;
    const isOriginalProjectSmaller = originalDuration < duration;

    if (isDurationSame) {
      this.updateAnnualPeriodsYear(project.interventions, project.startYear);
    } else if (!isDurationSame && isOriginalProjectSmaller) {
      this.addInterventionsDefaultAnnualPeriods(project.interventions, originalEndYear, deltaYear);
      this.updateAnnualPeriodsYear(project.interventions, project.startYear);
    } else if (!isDurationSame && isOriginalProjectBigger) {
      this.updateAnnualPeriodsYear(project.interventions, project.startYear);
      await this.shrinkAnnualPeriods(project);
    }
  }

  private updateAnnualPeriodsYear(interventions: IEnrichedIntervention[], projectStartYear: number): void {
    for (const intervention of interventions) {
      intervention.annualDistribution.annualPeriods = intervention.annualDistribution.annualPeriods.map(ap => {
        ap.year = projectStartYear + ap.rank;
        return ap;
      });
    }
  }

  public addInterventionDefaultAnnualPeriods(
    intervention: IEnrichedIntervention,
    originalEndYear: number,
    deltaYear: number
  ): void {
    const annualPeriod = intervention.annualDistribution.annualPeriods.find(ap => ap.year === originalEndYear);
    if (annualPeriod) {
      for (let i = 1; i <= deltaYear; i++) {
        const rank = annualPeriod.rank + i;
        const year = annualPeriod.year + i;
        intervention.annualDistribution.annualPeriods.push(this.buildAnnualPeriod(rank, year));
      }
    }
  }

  private buildAnnualPeriod(rank: number, year: number): IInterventionAnnualPeriod {
    return {
      year,
      rank,
      annualAllowance: 0,
      annualLength: 0,
      accountId: 0
    };
  }

  private addInterventionsDefaultAnnualPeriods(
    interventions: IEnrichedIntervention[],
    originalEndYear: number,
    deltaYear: number
  ): void {
    interventions.forEach(intervention => {
      this.addInterventionDefaultAnnualPeriods(intervention, originalEndYear, deltaYear);
    });
  }

  private async shrinkAnnualPeriods(project: IEnrichedProject): Promise<void> {
    if (!project.interventions) {
      return;
    }
    const interventions: IEnrichedIntervention[] = project.interventions;
    await this.addOffPeriodsToLastPeriod(interventions, project.startYear, project.endYear);
    this.removeOffPeriods(interventions, project.endYear);
  }

  private removeOffPeriods(interventions: IEnrichedIntervention[], projectEndYear: number): void {
    interventions.forEach(intervention => {
      intervention.annualDistribution.annualPeriods = intervention.annualDistribution.annualPeriods.filter(
        ap => ap.year <= projectEndYear
      );
    });
  }

  private async addOffPeriodsToLastPeriod(
    interventions: IEnrichedIntervention[],
    projectStartYear: number,
    projectEndYear: number
  ): Promise<void> {
    const interventionsToUpdate = interventions.filter(intervention =>
      intervention.annualDistribution.annualPeriods.some(ap => ap.year > projectEndYear)
    );
    for (const intervention of interventionsToUpdate) {
      const annualPeriods = intervention.annualDistribution.annualPeriods;
      const annualPeriodsToRemove = annualPeriods.filter(ap => ap.year > projectEndYear);
      if (annualPeriodsToRemove) {
        let annualPeriodToUpdate = annualPeriods.find(ap => ap.year === projectEndYear);
        if (!annualPeriodToUpdate) {
          annualPeriodToUpdate = annualPeriodsToRemove.shift();
          Object.assign(annualPeriodToUpdate, { rank: projectEndYear - projectStartYear, year: projectEndYear });
        }
        const isEmptyAnnualPeriodsToRemove = isEmpty(annualPeriodsToRemove);
        const accountIds = !isEmptyAnnualPeriodsToRemove
          ? uniq(annualPeriodsToRemove.map(ap => ap.accountId).filter(x => x))
          : null;
        const annualAllowances = !isEmptyAnnualPeriodsToRemove
          ? annualPeriodsToRemove.map(ap => ap.annualAllowance)
          : [];
        annualPeriodToUpdate.annualAllowance += sumLodash(annualAllowances);
        const comment = await this.createRemoveAccountIdsComment(accountIds, annualPeriodToUpdate);
        if (comment) {
          if (isNil(intervention.comments)) {
            intervention.comments = [];
          }
          intervention.comments.push(comment);
        }
      }
    }
  }

  private async createRemoveAccountIdsComment(
    accountIds: number[],
    annualPeriodToUpdate: IInterventionAnnualPeriod
  ): Promise<IComment> {
    if (isEmpty(accountIds)) {
      return null;
    }

    const accountIdsToRemove = accountIds.filter(accountId => accountId !== annualPeriodToUpdate.accountId);
    if (isEmpty(accountIdsToRemove)) {
      return null;
    }

    const comment = Comment.create({
      categoryId: CommentCategory.historic,
      text: `Les numéros investis ( ${accountIdsToRemove.join(
        ', '
      )} ) ont été rétirés dû à une replanification du projet`,
      isPublic: true,
      isProjectVisible: true,
      audit: Audit.fromCreateContext()
    }).getValue();
    return commentMapperDTO.getFromModel(comment);
  }
}
export const interventionAnnualDistributionService = new InterventionAnnualDistributionService();
