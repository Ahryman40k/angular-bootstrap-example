import {
  ErrorCodes,
  IApiError,
  IEnrichedProject,
  IProjectDecision,
  ITaxonomy,
  ProgramBookStatus,
  ProjectDecisionType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';

import { ProjectAnnualPeriod } from '../features/annualPeriods/models/projectAnnualPeriod';
import { taxonomyService } from '../features/taxonomies/taxonomyService';
import { openApiInputValidator } from '../utils/openApiInputValidator';
import { appUtils } from '../utils/utils';
import { commonValidator, ITaxonomyValidatorProperty } from './commonValidator';

class ProjectDecisionValidator {
  public async validateProjectDecisionInput(errorDetails: IApiError[], decision: IProjectDecision): Promise<void> {
    const taxonomies: ITaxonomy[] = await taxonomyService.getGroup(TaxonomyGroup.projectDecisionType);

    await openApiInputValidator.validateInputModel(errorDetails, 'ProjectDecision', decision);
    this.validateProjectDecisionTaxonomy(errorDetails, decision, taxonomies);
  }

  public validateProjectDecisionTaxonomy(
    errorDetails: IApiError[],
    decision: IProjectDecision,
    taxonomies: ITaxonomy[]
  ): void {
    const projectDecisionTaxonomyProperties: ITaxonomyValidatorProperty[] = [
      { param: 'typeId', taxonomyGroup: TaxonomyGroup.projectDecisionType, optionnal: false }
    ];

    for (const property of projectDecisionTaxonomyProperties) {
      const objectPropertyValue = _.get(decision, property.param);
      if (!property.optionnal || objectPropertyValue) {
        commonValidator.validateTaxonomies(errorDetails, taxonomies, property, objectPropertyValue);
      }
    }
  }

  public validateProjectDecisionYears(errorDetails: IApiError[], decision: IProjectDecision): void {
    const { startYear, endYear } = decision;
    if (decision.typeId !== ProjectDecisionType.postponed && decision.typeId !== ProjectDecisionType.replanned) {
      if (startYear) {
        errorDetails.push({
          code: ErrorCodes.ProjectStartYear,
          message: `Decision startYear must not be defined`,
          target: 'startYear'
        });
      }
      if (endYear) {
        errorDetails.push({
          code: ErrorCodes.ProjectEndYear,
          message: `Decision endYear must not be defined`,
          target: 'endYear'
        });
      }
      return;
    }
    const currentYear = appUtils.getCurrentYear();
    if (!startYear) {
      errorDetails.push({
        code: ErrorCodes.ProjectStartYear,
        message: `Decision startYear must be defined`,
        target: 'startYear'
      });
    }
    if (!endYear) {
      errorDetails.push({
        code: ErrorCodes.ProjectEndYear,
        message: `Decision endYear must be defined`,
        target: 'endYear'
      });
    }
    if (startYear && currentYear > startYear) {
      errorDetails.push({
        code: ErrorCodes.ProjectStartYear,
        message: `Decision startYear must be greater than or equal ${currentYear}`,
        target: 'startYear'
      });
    }
    if (startYear && endYear && startYear > endYear) {
      errorDetails.push({
        code: ErrorCodes.ProjectEndYear,
        message: `Decision endYear must be greater than or equal the startYear ${startYear}`,
        target: 'endYear'
      });
    }
  }

  /**
   * Validate that the programBook can be removed from program book
   * @param businessErrorDetails
   * @param programBook
   */
  public async validateCanBeRemovedFromProgramBook(
    businessErrorDetails: IApiError[],
    input: IProjectDecision,
    annualPeriod: ProjectAnnualPeriod,
    project: IEnrichedProject
  ): Promise<void> {
    if (input.typeId !== ProjectDecisionType.removeFromProgramBook) {
      return;
    }
    if (!annualPeriod) {
      businessErrorDetails.push({
        code: ErrorCodes.BusinessRule,
        message: `The annualPeriod doesn't exist`,
        target: 'project.annualDistribution.annualPeriods'
      });
      return;
    }
    const programBook = annualPeriod.programBook;
    if (!programBook) {
      businessErrorDetails.push({
        code: ErrorCodes.ProjectDecisionProgramBook,
        message: `The annualPeriod is not in a program book`,
        target: 'programBookId'
      });
      return;
    }
    const validStatuses = [
      ProgramBookStatus.programming,
      ProgramBookStatus.submittedPreliminary,
      ProgramBookStatus.submittedFinal
    ];
    if (_.isEmpty(programBook) || !validStatuses.includes(programBook.status)) {
      businessErrorDetails.push({
        code: ErrorCodes.ProjectDecisionProgramBook,
        message: `Program book with id: "${programBook?.id}" does not have one of those statuses (${validStatuses.join(
          ', '
        )})`,
        target: 'programBookId'
      });
    }

    if (programBook?.isAutomaticLoadingInProgress) {
      businessErrorDetails.push({
        code: ErrorCodes.ProgramBookIsAutomaticLoadingInProgress,
        message: `A program book is no longer accessible for modification during an automatic loading with ID : '${programBook.id}'.`,
        target: 'isAutomaticLoadingInProgress'
      });
    }

    const annualPeriods = await ProjectAnnualPeriod.fromEnrichedToInstanceBulk(
      project.annualDistribution.annualPeriods
    );
    const annualPeriodIndex = annualPeriods.findIndex(ap => ap.year === annualPeriod.year);
    for (let i = project.annualDistribution.annualPeriods.length - 1; i > annualPeriodIndex; i--) {
      if (project.annualDistribution.annualPeriods[i].programBookId) {
        businessErrorDetails.push({
          code: ErrorCodes.ProjectDecisionProgramBook,
          message: `The previous project's annual periods cannot be programmed`,
          target: 'programBookId'
        });
      }
    }
  }
}

export const projectDecisionValidator = new ProjectDecisionValidator();
