import { IApiError, IPlainProjectAnnualDistribution } from '@villemontreal/agir-work-planning-lib';
import { ErrorCodes, IEnrichedProject, ProjectStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

import { isEmpty, range } from 'lodash';
import { annualPeriodService } from '../../../services/annualPeriodService';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { AnnualProgram } from '../../annualPrograms/models/annualProgram';
import { ProjectAnnualPeriod } from '../models/projectAnnualPeriod';

export class ProjectAnnualPeriodValidator {
  public static validateProgramBookIdByAnnualProgram(
    annualPeriod: ProjectAnnualPeriod,
    annualProgram: AnnualProgram
  ): Result<any> {
    if (!annualPeriod.programBook?.id) {
      return Result.ok();
    }
    if (annualPeriod.year !== annualProgram.year) {
      return Result.fail(
        Guard.error(
          'project.annualDistribution.annualPeriods[].programBookId',
          ErrorCodes.ProjectAnnualPeriods,
          `Annual period's program book is not programmed in an annual program of the year ${annualProgram.year}`
        )
      );
    }
    return Result.ok();
  }

  public static validateAnnualPeriodsStatus(annualPeriods: ProjectAnnualPeriod[]): Result<any> {
    const results: Result<any>[] = [Result.ok()];
    annualPeriods.forEach((annualPeriod, index) => {
      if (isEmpty(annualPeriod.programBook?.id) && annualPeriod.status === ProjectStatus.programmed) {
        results.push(
          Result.fail(
            Guard.error(
              'annualPeriods',
              ErrorCodes.ProjectAnnualPeriods,
              `Annual period with status ${ProjectStatus.programmed} must have a programbookId`
            )
          )
        );
      }
      if (annualPeriod.programBook?.id && annualPeriod.status !== ProjectStatus.programmed) {
        results.push(
          Result.fail(
            Guard.error(
              `annualPeriods[${index}].status`,
              ErrorCodes.ProjectAnnualPeriods,
              `Annual period with programbookId must have status ${ProjectStatus.programmed}`
            )
          )
        );
      }
      if (
        index > 0 &&
        annualPeriods[index - 1].status !== ProjectStatus.programmed &&
        annualPeriod.status === ProjectStatus.programmed
      ) {
        results.push(
          Result.fail(
            Guard.error(
              `annualPeriods`,
              ErrorCodes.ProjectAnnualPeriods,
              `An annual period can only be programmed if the previous period was also programmed ( current annual period : ${annualPeriod.year} )`
            )
          )
        );
      }
    });
    return Result.combine(results);
  }

  private static validateAnnualPeriodsDates(
    annualPeriods: ProjectAnnualPeriod[],
    startYear: number,
    endYear: number
  ): Result<any> {
    const yearRange = range(startYear, endYear + 1);
    const results = yearRange.map(year => {
      if (isEmpty(annualPeriodService.getAnnualPeriodsFromYear(annualPeriods, year))) {
        return Result.fail(
          Guard.error(
            `annualDistribution.annualPeriods`,
            ErrorCodes.ProjectAnnualPeriods,
            `Project must have an annual period for each one of its years`
          )
        );
      }
      return Result.ok();
    });
    return Result.combine(results);
  }

  public static async validateAnnualPeriods(errorDetails: IApiError[], project: IEnrichedProject): Promise<void> {
    const result = Result.combine([
      ProjectAnnualPeriodValidator.validateAnnualPeriodsDates(
        await Promise.all(
          project.annualDistribution.annualPeriods.map(ap => ProjectAnnualPeriod.fromEnrichedToInstance(ap))
        ),
        project.startYear,
        project.endYear
      ),
      ProjectAnnualPeriodValidator.validateAnnualPeriodsStatus(
        await ProjectAnnualPeriod.fromEnrichedToInstanceBulk(project.annualDistribution.annualPeriods)
      )
    ]);
    if (result.isFailure) {
      result.error.forEach((err: any) => {
        errorDetails.push(err);
      });
    }
  }

  public static async validatePlainAnnualDistributionOpenApiModel(
    errorDetails: IApiError[],
    annualDistribution: IPlainProjectAnnualDistribution
  ): Promise<void> {
    await openApiInputValidator.validateInputModel(errorDetails, 'PlainProjectAnnualDistribution', annualDistribution);
  }

  public static async validateEnrichedAnnualDistributionOpenApiModel(
    errorDetails: IApiError[],
    annualDistribution: IPlainProjectAnnualDistribution
  ): Promise<void> {
    await openApiInputValidator.validateInputModel(
      errorDetails,
      'EnrichedProjectAnnualDistribution',
      annualDistribution
    );
  }

  public static validatePlainAnnualDistributionYears(
    errorDetails: IApiError[],
    annualDistribution: IPlainProjectAnnualDistribution,
    project: IEnrichedProject
  ): void {
    if (annualDistribution.annualPeriods) {
      if (!annualDistribution.annualPeriods.find(a => a.year)) {
        errorDetails.push({
          code: ErrorCodes.ProjectAnnualPeriods,
          message: 'The plain annual distribution periods must contain years',
          target: 'annualDistribution.annualPeriods'
        });
      }
      const projectYears = range(project.startYear, project.endYear + 1);
      for (const period of annualDistribution.annualPeriods) {
        if (!projectYears.includes(period.year)) {
          errorDetails.push({
            code: ErrorCodes.ProjectAnnualPeriods,
            message: `The period year ${period.year} is different from the project years`,
            target: 'annualDistribution.annualPeriods'
          });
        }
      }
    }
  }
}
