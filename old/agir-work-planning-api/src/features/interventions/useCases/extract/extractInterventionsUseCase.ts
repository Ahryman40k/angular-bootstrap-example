import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  InterventionDecisionType,
  InterventionsExtractionSelectableFields as SelectableFields,
  InterventionStatus,
  ITaxonomy,
  RequirementTargetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';
import * as moment from 'moment';
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
import { AuthorizedDateFormats } from '../../../../utils/moment/moment.enum';
import { Requirement } from '../../../requirements/models/requirement';
import { RequirementFindOptions } from '../../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../../requirements/mongo/requirementRepository';
import { InterventionFindOptions } from '../../models/interventionFindOptions';
import { interventionRepository } from '../../mongo/interventionRepository';
import { ExtractInterventionsValidator } from '../../validators/extractInterventionsValidator';
import { ExtractInterventionsCommand, IExtractInterventionsCommandProps } from './extractInterventionsCommand';

export const selectableFieldToColumnTitle = {
  [SelectableFields.id]: 'ID',
  [SelectableFields.interventionName]: 'Libellé',
  [SelectableFields.interventionYear]: 'Année initiale souhaitée',
  [SelectableFields.planificationYear]: 'Année planifiée',
  [SelectableFields.status]: 'Statut',
  [SelectableFields.statusDate]: 'Date statut',
  [SelectableFields.auditCreatedAt]: 'Date de création',
  [SelectableFields.interventionTypeId]: 'Type',
  [SelectableFields.workTypeId]: 'Nature des travaux',
  [SelectableFields.programId]: 'Programme',
  [SelectableFields.estimateAllowance]: 'Estimation budgétaire ($)',
  [SelectableFields.assetsLength]: 'Longueur (m)',
  [SelectableFields.assetsTypeId]: 'Type actif',
  [SelectableFields.requestorId]: 'Requérant',
  [SelectableFields.executorId]: 'Exécutant',
  [SelectableFields.boroughId]: 'Arrondissement',
  [SelectableFields.streetName]: 'Voie',
  [SelectableFields.streetFrom]: 'Voie de',
  [SelectableFields.streetTo]: 'Voie à',
  [SelectableFields.numberOfRefusals]: 'Nombre de refus',
  [SelectableFields.projectId]: 'ID de Projet',
  [SelectableFields.lastRevisionRequestDate]: 'Date de la dernière demande de révision',
  [SelectableFields.decisionRequired]: 'Décision requise',
  [SelectableFields.contact]: 'Contact',
  [SelectableFields.roadNetworkTypeId]: 'Type de réseau',
  [SelectableFields.medalId]: 'Médaille',
  [SelectableFields.externalReferenceIds]: 'ID externe',
  [SelectableFields.requirements]: 'Exigences de planification'
};

const selectableFieldsToTaxonomyGroups = {
  [SelectableFields.status]: [TaxonomyGroup.interventionStatus],
  [SelectableFields.interventionTypeId]: [TaxonomyGroup.interventionType],
  [SelectableFields.workTypeId]: [TaxonomyGroup.workType],
  [SelectableFields.programId]: [TaxonomyGroup.programType],
  [SelectableFields.assetsTypeId]: [TaxonomyGroup.assetType],
  [SelectableFields.requestorId]: [TaxonomyGroup.requestor],
  [SelectableFields.executorId]: [TaxonomyGroup.executor],
  [SelectableFields.boroughId]: [TaxonomyGroup.borough],
  [SelectableFields.roadNetworkTypeId]: [TaxonomyGroup.roadNetworkType],
  [SelectableFields.medalId]: [TaxonomyGroup.medalType],
  [SelectableFields.requirements]: [TaxonomyGroup.requirementType, TaxonomyGroup.requirementSubtype]
};

// tslint:disable: max-func-body-length
// tslint:disable: cyclomatic-complexity
export class ExtractInterventionsUseCase extends UseCase<IExtractInterventionsCommandProps, IDownloadFileResult> {
  public async execute(props: IExtractInterventionsCommandProps): Promise<Response<IDownloadFileResult>> {
    // Run input validations
    const [extractInterventionsCommandResult, openApiResult, taxonomyResult] = await Promise.all([
      ExtractInterventionsCommand.create(props),
      ExtractInterventionsValidator.validateAgainstOpenApi(props),
      ExtractInterventionsValidator.validateAgainstTaxonomies(props)
    ]);
    const inputValidationResult = Result.combine([extractInterventionsCommandResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    // Run validations for selected fields
    const selectedFieldsResult = await ExtractInterventionsValidator.validateSelectedFields(
      props.fields,
      enumValues(SelectableFields)
    );
    if (selectedFieldsResult.isFailure) {
      return left(new UnprocessableEntityError(selectedFieldsResult.errorValue()));
    }

    // Run permission validation for requirements
    const restrictedFieldsResult = await ExtractInterventionsValidator.validatePermissionsForRestrictedFields(
      props.fields
    );
    if (restrictedFieldsResult.isFailure) {
      return left(new ForbiddenError(restrictedFieldsResult.errorValue()));
    }

    // Find all corresponding interventions
    const interventionFindOptions = InterventionFindOptions.create({
      criterias: {
        ...props
      }
    }).getValue();
    const interventions = await interventionRepository.findAll(interventionFindOptions);

    // Get taxonomy entries required for mapping
    const taxonomies = await ExtractionUtils.getTaxonomiesForSelectedFields(
      props.fields,
      selectableFieldsToTaxonomyGroups
    );

    // Map interventions to objects
    let interventionObjectsForCsv: any[] = [];
    for (const chunkInterventions of _.chunk(interventions, configs.extraction.chunkSize)) {
      // Find all requirements for those interventions
      let requirements: Requirement[];
      if (props.fields.includes(SelectableFields.requirements)) {
        requirements = await requirementRepository.findAll(
          RequirementFindOptions.create({
            criterias: { itemType: RequirementTargetType.intervention, itemId: chunkInterventions.map(x => x.id) }
          }).getValue()
        );
      }

      // Map interventions of current chunk
      interventionObjectsForCsv = interventionObjectsForCsv.concat(
        this.mapInterventionsToDataObjectsForCsv(props.fields, chunkInterventions, requirements, taxonomies)
      );
    }

    // Generate and return CSV file
    return right(
      Result.ok<IDownloadFileResult>(
        ExtractionUtils.mapObjectListsToCsv(interventionObjectsForCsv, 'interventions', true)
      )
    );
  }

  private mapInterventionsToDataObjectsForCsv(
    fields: string[],
    interventions: IEnrichedIntervention[],
    requirements: Requirement[],
    taxonomies: { [x: string]: ITaxonomy[] }
  ): any[] {
    const mappedInterventions = [];
    // For each intervention, create entry from mapped data of selected fields
    for (const intervention of interventions) {
      const mappedIntervention = {};
      for (const field of fields) {
        let value: string;
        switch (field) {
          case SelectableFields.id:
            value = intervention.id;
            break;
          case SelectableFields.interventionName:
            value = intervention.interventionName;
            break;
          case SelectableFields.interventionYear:
            value = ExtractionUtils.formatNumber(intervention.interventionYear);
            break;
          case SelectableFields.planificationYear:
            value = ExtractionUtils.formatNumber(intervention.planificationYear);
            break;
          case SelectableFields.status:
            value = ExtractionUtils.findLabelInTaxonomies(
              TaxonomyGroup.interventionStatus,
              intervention.status,
              taxonomies
            );
            break;
          case SelectableFields.statusDate:
            value = ExtractionUtils.findAndFormatMostRecentDecisionDate(
              intervention,
              this.mapInterventionStatusToDecisionType(intervention.status)
            );
            break;
          case SelectableFields.auditCreatedAt:
            const creationDate = intervention.audit?.createdAt;
            value = creationDate ? moment(creationDate).format(AuthorizedDateFormats.SECOND) : '';
            break;
          case SelectableFields.interventionTypeId:
            value = ExtractionUtils.findLabelInTaxonomies(
              TaxonomyGroup.interventionType,
              intervention.interventionTypeId,
              taxonomies
            );
            break;
          case SelectableFields.workTypeId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.workType, intervention.workTypeId, taxonomies);
            break;
          case SelectableFields.programId:
            value = ExtractionUtils.findLabelInTaxonomies(
              TaxonomyGroup.programType,
              intervention.programId,
              taxonomies
            );
            break;
          case SelectableFields.estimateAllowance:
            value = ExtractionUtils.formatNumber(intervention.estimate?.allowance * 1000);
            break;
          case SelectableFields.assetsLength:
            const totalAssetsLength = this.calculateTotalLengthInMetersFromAssetsList(intervention.assets);
            value = ExtractionUtils.formatNumber(totalAssetsLength);
            break;
          case SelectableFields.assetsTypeId:
            let assetType = _.head(intervention.assets)?.typeId;
            if (assetType === AssetType['roadway-intersection'] || assetType === AssetType.roadwayIslands) {
              assetType = AssetType.roadway;
            }
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.assetType, assetType, taxonomies);
            break;
          case SelectableFields.requestorId:
            value = ExtractionUtils.findLabelInTaxonomies(
              TaxonomyGroup.requestor,
              intervention.requestorId,
              taxonomies
            );
            break;
          case SelectableFields.executorId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.executor, intervention.executorId, taxonomies);
            break;
          case SelectableFields.boroughId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.borough, intervention.boroughId, taxonomies);
            break;
          case SelectableFields.streetName:
            value = intervention.streetName;
            break;
          case SelectableFields.streetFrom:
            value = intervention.streetFrom;
            break;
          case SelectableFields.streetTo:
            value = intervention.streetTo;
            break;
          case SelectableFields.numberOfRefusals:
            const numberOfRefusals = intervention.decisions?.filter(x => x.typeId === InterventionDecisionType.refused)
              .length;
            value = Number(numberOfRefusals ?? 0).toString();
            break;
          case SelectableFields.projectId:
            value = intervention.project?.id;
            break;
          case SelectableFields.lastRevisionRequestDate:
            value = ExtractionUtils.findAndFormatMostRecentDecisionDate(
              intervention,
              InterventionDecisionType.revisionRequest
            );
            break;
          case SelectableFields.decisionRequired:
            value = intervention.decisionRequired ? 'Oui' : 'Non';
            break;
          case SelectableFields.contact:
            value = intervention.contact;
            break;
          case SelectableFields.roadNetworkTypeId:
            value = ExtractionUtils.findLabelInTaxonomies(
              TaxonomyGroup.roadNetworkType,
              intervention.roadNetworkTypeId,
              taxonomies
            );
            break;
          case SelectableFields.medalId:
            value = ExtractionUtils.findLabelInTaxonomies(TaxonomyGroup.medalType, intervention.medalId, taxonomies);
            break;
          case SelectableFields.externalReferenceIds:
            value = _.head(intervention.externalReferenceIds)?.value;
            break;
          case SelectableFields.requirements:
            value = ExtractionUtils.formatRequirements(
              requirements.filter(req => req.items.some(item => item.id === intervention.id)),
              taxonomies
            );
            break;
          default:
            // Should never happen, since selected fields have already been validated
            throw new Error(`Unrecognized field: ${field}`);
        }
        mappedIntervention[selectableFieldToColumnTitle[field]] = value ?? '';
      }
      mappedInterventions.push(mappedIntervention);
    }
    return mappedInterventions;
  }

  private calculateTotalLengthInMetersFromAssetsList(assets: IAsset[]): number {
    const lengthInMeters = assets?.map(asset => ExtractionUtils.lengthObjectToLengthInMeters(asset.length));
    return lengthInMeters?.length ? lengthInMeters.reduce((a, b) => a + b, 0) : undefined;
  }

  private mapInterventionStatusToDecisionType(interventionStatus: string): InterventionDecisionType {
    switch (interventionStatus) {
      case InterventionStatus.accepted:
        return InterventionDecisionType.accepted;
      case InterventionStatus.refused:
        return InterventionDecisionType.refused;
      case InterventionStatus.canceled:
        return InterventionDecisionType.canceled;
      default:
        return undefined;
    }
  }
}

export const extractInterventionsUseCase = new ExtractInterventionsUseCase();
