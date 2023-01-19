import {
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IServicePriority,
  ITaxonomy,
  ProgramBookStatus,
  ProjectDecisionType,
  ProjectsExtractionSelectableFields as SelectableFields,
  RequirementTargetType,
  SubmissionStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';
import { configs } from '../../../../../config/configs';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { ExtractionUtils } from '../../../../shared/extraction/extractionUtils';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { enumValues } from '../../../../utils/enumUtils';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { Requirement } from '../../../requirements/models/requirement';
import { RequirementFindOptions } from '../../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../../requirements/mongo/requirementRepository';
import { SubmissionRequirement } from '../../../submissions/models/requirements/submissionRequirement';
import { Submission } from '../../../submissions/models/submission';
import { SubmissionFindOptions } from '../../../submissions/models/submissionFindOptions';
import { submissionRepository } from '../../../submissions/mongo/submissionRepository';
import { ProjectFindOptions } from '../../models/projectFindOptions';
import { projectRepository } from '../../mongo/projectRepository';
import { ExtractProjectsValidator } from '../../validators/extractProjectsValidator';
import { ExtractProjectsCommand, IExtractProjectsCommandProps } from './extractProjectsCommand';

const submissionNumberColumnTitle = 'Numéro de soumission';

export const selectableFieldToColumnTitle = {
  [SelectableFields.id]: 'ID',
  [SelectableFields.projectName]: 'Libellé',
  [SelectableFields.startYear]: 'Année de début',
  [SelectableFields.endYear]: 'Année de fin',
  [SelectableFields.status]: 'Statut',
  [SelectableFields.statusDate]: 'Date statut',
  [SelectableFields.geometryPin]: 'Nature du projet',
  [SelectableFields.projectTypeId]: 'Type',
  [SelectableFields.annualPeriodsCategoryId]: 'Catégorie',
  [SelectableFields.subCategoryIds]: 'Sous-catégorie',
  [SelectableFields.globalBudgetAllowance]: 'Budget ($)',
  [SelectableFields.length]: 'Longueur (m)',
  [SelectableFields.inChargeId]: 'Requérant initial',
  [SelectableFields.executorId]: 'Exécutant',
  [SelectableFields.medalId]: 'Médaille',
  [SelectableFields.boroughId]: 'Arrondissement',
  [SelectableFields.streetName]: 'Voie',
  [SelectableFields.streetFrom]: 'Voie de',
  [SelectableFields.streetTo]: 'Voie à',
  [SelectableFields.interventionIds]: 'interventionIds', // Two columns are created for this field. See case of switch in mapProjectsToDataObjectsForCsv()
  [SelectableFields.annualPeriodsProgramBookId]: 'Carnet(s)',
  [SelectableFields.submissionNumber]: submissionNumberColumnTitle,
  [SelectableFields.drmNumber]: submissionNumberColumnTitle, // DRM numbers are displayed in the submissionNumber column
  [SelectableFields.riskId]: 'Type de risque',
  [SelectableFields.roadNetworkTypeId]: 'Type de réseau',
  [SelectableFields.servicePriorities]: 'Priorité de service',
  [SelectableFields.externalReferenceIds]: 'ID externe',
  [SelectableFields.requirements]: 'Exigences de planification',
  [SelectableFields.designRequirements]: 'Exigences de conception'
};

const selectableFieldsToTaxonomyGroups = {
  [SelectableFields.status]: [TaxonomyGroup.projectStatus],
  [SelectableFields.projectTypeId]: [TaxonomyGroup.projectType],
  [SelectableFields.annualPeriodsCategoryId]: [TaxonomyGroup.projectCategory],
  [SelectableFields.subCategoryIds]: [TaxonomyGroup.projectSubCategory],
  [SelectableFields.inChargeId]: [TaxonomyGroup.requestor],
  [SelectableFields.executorId]: [TaxonomyGroup.executor],
  [SelectableFields.medalId]: [TaxonomyGroup.medalType],
  [SelectableFields.boroughId]: [TaxonomyGroup.borough],
  [SelectableFields.riskId]: [TaxonomyGroup.riskType],
  [SelectableFields.roadNetworkTypeId]: [TaxonomyGroup.roadNetworkType],
  [SelectableFields.servicePriorities]: [TaxonomyGroup.service, TaxonomyGroup.priorityType],
  [SelectableFields.requirements]: [TaxonomyGroup.requirementType, TaxonomyGroup.requirementSubtype],
  [SelectableFields.designRequirements]: [
    TaxonomyGroup.submissionRequirementMention,
    TaxonomyGroup.submissionRequirementType,
    TaxonomyGroup.submissionRequirementSubtype
  ]
};

// tslint:disable: max-func-body-length
// tslint:disable: cyclomatic-complexity
export class ExtractProjectsUseCase extends UseCase<IExtractProjectsCommandProps, IDownloadFileResult> {
  public async execute(props: IExtractProjectsCommandProps): Promise<Response<IDownloadFileResult>> {
    // Run input validations
    const [extractProjectsCommandResult, openApiResult, taxonomyResult] = await Promise.all([
      ExtractProjectsCommand.create(props),
      ExtractProjectsValidator.validateAgainstOpenApi(props),
      ExtractProjectsValidator.validateAgainstTaxonomies(props)
    ]);
    const inputValidationResult = Result.combine([extractProjectsCommandResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    // Run validations for selected fields
    const selectedFieldsResult = await ExtractProjectsValidator.validateSelectedFields(
      props.fields,
      enumValues(SelectableFields)
    );
    if (selectedFieldsResult.isFailure) {
      return left(new UnprocessableEntityError(selectedFieldsResult.errorValue()));
    }

    // Run permission validation for requirements, annualPeriodsProgramBookId and designRequirements
    const restrictedFieldsResult = await ExtractProjectsValidator.validatePermissionsForRestrictedFields(props.fields);
    if (restrictedFieldsResult.isFailure) {
      return left(new ForbiddenError(restrictedFieldsResult.errorValue()));
    }

    // Find all corresponding projects
    const projectFindOptions = ProjectFindOptions.create({
      criterias: {
        ...props,
        ...{
          /* These criteria are used since 'year' isn't a ProjectFindOptions criteria */
          toStartYear: props.year,
          fromEndYear: props.year
        }
      }
    }).getValue();
    const projects = await projectRepository.findAll(projectFindOptions);

    // Get taxonomy entries required for mapping
    const taxonomies = await ExtractionUtils.getTaxonomiesForSelectedFields(
      props.fields,
      selectableFieldsToTaxonomyGroups
    );

    // Map projects to objects
    let projectObjectsForCsv: any[] = [];
    for (const chunkProjects of _.chunk(projects, configs.extraction.chunkSize)) {
      // Find all requirements for those projects
      let requirements: Requirement[];
      if (props.fields.includes(SelectableFields.requirements)) {
        requirements = await requirementRepository.findAll(
          RequirementFindOptions.create({
            criterias: { itemType: RequirementTargetType.project, itemId: chunkProjects.map(project => project.id) }
          }).getValue()
        );
      }

      // Find all programbooks for those projects
      let programBooks: ProgramBook[];
      if (props.fields.includes(SelectableFields.annualPeriodsProgramBookId)) {
        programBooks = await programBookRepository.findAll(
          ProgramBookFindOptions.create({
            criterias: {
              id: chunkProjects
                .map(project => project?.annualDistribution?.annualPeriods?.map(period => period?.programBookId))
                .flat()
                .filter(id => !_.isEmpty(id)),
              status: enumValues(ProgramBookStatus)
            },
            fields: ['_id', 'name']
          }).getValue()
        );
      }

      // Find all submissions for those projects
      let submissions: Submission[];
      if (props.fields.includes(SelectableFields.designRequirements)) {
        submissions = await submissionRepository.findAll(
          SubmissionFindOptions.create({
            criterias: { status: SubmissionStatus.VALID, projectIds: chunkProjects.map(project => project.id) },
            fields: ['_id', 'requirements', 'projectIds']
          }).getValue()
        );
      }

      // Map projects of current chunk
      projectObjectsForCsv = projectObjectsForCsv.concat(
        this.mapProjectsToDataObjectsForCsv(
          props.fields,
          chunkProjects,
          requirements,
          submissions,
          programBooks,
          taxonomies
        )
      );
    }

    // Generate and return CSV file
    return right(
      Result.ok<IDownloadFileResult>(ExtractionUtils.mapObjectListsToCsv(projectObjectsForCsv, 'projects', true))
    );
  }

  private mapProjectsToDataObjectsForCsv(
    fields: string[],
    projects: IEnrichedProject[],
    requirements: Requirement[],
    submissions: Submission[],
    programBooks: ProgramBook[],
    taxonomies: { [x: string]: ITaxonomy[] }
  ): any[] {
    const mappedProjects = [];
    // For each project, create entry from mapped data of selected fields
    for (const project of projects) {
      const mappedProject = {};
      for (const field of fields) {
        let value: string;
        switch (field) {
          case SelectableFields.id:
            value = project.id;
            break;
          case SelectableFields.projectName:
            value = project.projectName;
            break;
          case SelectableFields.startYear:
            value = ExtractionUtils.formatNumber(project.startYear);
            break;
          case SelectableFields.endYear:
            value = ExtractionUtils.formatNumber(project.endYear);
            break;
          case SelectableFields.status:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.projectStatus, project.status, taxonomies);
            break;
          case SelectableFields.statusDate:
            value = ExtractionUtils.findAndFormatMostRecentDecisionDate(
              project,
              this.mapProjectStatusToDecisionType(project.status)
            );
            break;
          case SelectableFields.geometryPin:
            value = project.geometryPin ? 'Géolocalisé' : 'Non-géolocalisé';
            break;
          case SelectableFields.projectTypeId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.projectType, project.projectTypeId, taxonomies);
            break;
          case SelectableFields.annualPeriodsCategoryId:
            value = this.findAndFormatLabelsInTaxonomiesAnnualPeriodsCategories(
              project.annualDistribution?.annualPeriods,
              taxonomies
            );
            break;
          case SelectableFields.subCategoryIds:
            value = this.findAndFormatLabelsInTaxonomies(
              TaxonomyGroup.projectSubCategory,
              project.subCategoryIds,
              taxonomies
            );
            break;
          case SelectableFields.globalBudgetAllowance:
            value = ExtractionUtils.formatNumber(project.globalBudget?.allowance * 1000);
            break;
          case SelectableFields.length:
            const lengthInMeters = ExtractionUtils.lengthObjectToLengthInMeters(project.length);
            value = ExtractionUtils.formatNumber(lengthInMeters);
            break;
          case SelectableFields.inChargeId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.requestor, project.inChargeId, taxonomies);
            break;
          case SelectableFields.executorId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.executor, project.executorId, taxonomies);
            break;
          case SelectableFields.medalId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.medalType, project.medalId, taxonomies);
            break;
          case SelectableFields.boroughId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.borough, project.boroughId, taxonomies);
            break;
          case SelectableFields.streetName:
            value = project.streetName;
            break;
          case SelectableFields.streetFrom:
            value = project.streetFrom;
            break;
          case SelectableFields.streetTo:
            value = project.streetTo;
            break;
          case SelectableFields.interventionIds:
            mappedProject["Nombre d'interventions"] = project.interventionIds?.length;
            mappedProject['IDs des interventions'] = this.joinStringArrayEntries(project.interventionIds);
            break;
          case SelectableFields.annualPeriodsProgramBookId:
            value = this.findAndFormatLabelsInTaxonomiesAnnualPeriodsProgramBookId(
              project.annualDistribution?.annualPeriods,
              programBooks
            );
            break;
          case SelectableFields.submissionNumber:
          case SelectableFields.drmNumber:
            if (_.isUndefined(mappedProject[submissionNumberColumnTitle])) {
              value = project.submissionNumber ?? project.drmNumber?.concat('00');
            }
            break;
          case SelectableFields.riskId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.riskType, project.riskId, taxonomies);
            break;
          case SelectableFields.roadNetworkTypeId:
            value = ExtractionUtils.findLabelInTaxonomies(
              TaxonomyGroup.roadNetworkType,
              project.roadNetworkTypeId,
              taxonomies
            );
            break;
          case SelectableFields.servicePriorities:
            value = this.findAndFormatLabelsInTaxonomiesServicePriorities(project.servicePriorities, taxonomies);
            break;
          case SelectableFields.externalReferenceIds:
            value = _.head(project.externalReferenceIds)?.value;
            break;
          case SelectableFields.requirements:
            value = ExtractionUtils.formatRequirements(
              requirements.filter(req => req.items.some(item => item.id === project.id)),
              taxonomies
            );
            break;
          case SelectableFields.designRequirements:
            value = this.formatSubmissionRequirements(
              submissions.find(submission => submission.projectIds?.includes(project.id))?.requirements,
              taxonomies
            );
            break;
          default:
            // Should never happen, since selected fields have already been validated
            throw new Error(`Unrecognized field: ${field}`);
        }
        if (
          field !== SelectableFields.interventionIds &&
          _.isUndefined(mappedProject[selectableFieldToColumnTitle[field]])
        ) {
          mappedProject[selectableFieldToColumnTitle[field]] = value ?? '';
        }
      }
      mappedProjects.push(mappedProject);
    }
    return mappedProjects;
  }

  private formatSubmissionRequirements(
    requirements: SubmissionRequirement[],
    taxonomies: { [x: string]: ITaxonomy[] }
  ): string {
    const formattedRequirements = requirements?.map(requirement => {
      const mention = ExtractionUtils.findLabelInTaxonomies(
        TaxonomyGroup.submissionRequirementMention,
        requirement.mentionId,
        taxonomies
      );
      const requirementType = ExtractionUtils.findLabelInTaxonomies(
        TaxonomyGroup.submissionRequirementType,
        requirement.typeId,
        taxonomies
      );
      const requirementSubType = ExtractionUtils.findLabelInTaxonomies(
        TaxonomyGroup.submissionRequirementSubtype,
        requirement.subtypeId,
        taxonomies
      );
      const obsolescence = requirement.isDeprecated ? ' - Obsolète' : '';
      return `${mention} - ${requirementType} - ${requirementSubType}${obsolescence} :\n${requirement.text}`;
    });

    // Join formatted requirements into a single string
    return _.isEmpty(formattedRequirements) ? '' : formattedRequirements.reduce((a, b) => a.concat('\n\n').concat(b));
  }

  private findAndFormatLabelsInTaxonomies(
    group: TaxonomyGroup,
    codes: string[],
    taxonomies: { [x: string]: ITaxonomy[] }
  ): string {
    const labels = codes
      ?.map(code => taxonomies[group].find(taxo => taxo.code === code)?.label?.fr)
      .filter(y => !_.isEmpty(y));
    return this.joinStringArrayEntries(labels);
  }

  private findAndFormatLabelsInTaxonomiesServicePriorities(
    servicePriorities: IServicePriority[],
    taxonomies: { [x: string]: ITaxonomy[] }
  ): string {
    const labels = servicePriorities?.map(priority =>
      ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.service, priority.service, taxonomies)
        .concat(' - ')
        .concat(ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.priorityType, priority.priorityId, taxonomies))
    );
    return this.joinStringArrayEntries(labels);
  }

  private findAndFormatLabelsInTaxonomiesAnnualPeriodsCategories(
    periods: IEnrichedProjectAnnualPeriod[],
    taxonomies: { [x: string]: ITaxonomy[] }
  ): string {
    const labels = periods?.map(period =>
      ExtractionUtils.formatNumber(period.year)
        .concat(' | ')
        .concat(ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.projectCategory, period.categoryId, taxonomies))
    );
    return this.joinStringArrayEntries(labels);
  }

  private findAndFormatLabelsInTaxonomiesAnnualPeriodsProgramBookId(
    periods: IEnrichedProjectAnnualPeriod[],
    programBooks: ProgramBook[]
  ): string {
    const yearsWithProgramBooks: string[] = [];
    for (const period of periods) {
      const programBookName = programBooks.find(programBook => period.programBookId === programBook.id)?.name;

      if (!_.isEmpty(programBookName)) {
        yearsWithProgramBooks.push(`${ExtractionUtils.formatNumber(period.year)} | ${programBookName}`);
      }
    }
    return this.joinStringArrayEntries(yearsWithProgramBooks);
  }

  private joinStringArrayEntries(entries: string[]): string {
    return _.isEmpty(entries) ? '' : entries.reduce((a, b) => a.concat(' ; ').concat(b));
  }

  private mapProjectStatusToDecisionType(projectStatus: string): ProjectDecisionType {
    switch (projectStatus) {
      case ProjectDecisionType.replanned:
        return ProjectDecisionType.replanned;
      case ProjectDecisionType.postponed:
        return ProjectDecisionType.postponed;
      case ProjectDecisionType.canceled:
        return ProjectDecisionType.canceled;
      default:
        return undefined;
    }
  }
}

export const extractProjectsUseCase = new ExtractProjectsUseCase();
