import {
  IAssetLastIntervention,
  IEnrichedIntervention,
  ILastIntervention
} from '@villemontreal/agir-work-planning-lib';
import { isNil } from 'lodash';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { convertStringOrStringArray } from '../../../../utils/arrayUtils';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { SearchAssetsLastInterventionValidator } from '../../validators/searchAssetsLastInterventionValidator';
import {
  ISearchAssetsLastInterventionCommandProps,
  SearchAssetsLastInterventionCommand
} from './searchAssetsLastInterventionCommand';

export class SearchAssetsLastInterventionUseCase extends UseCase<
  ISearchAssetsLastInterventionCommandProps,
  IAssetLastIntervention[]
> {
  public async execute(req: ISearchAssetsLastInterventionCommandProps): Promise<Response<IAssetLastIntervention[]>> {
    const [searchAssetsLastInterventionCommandResult, openApiResult, taxonomyResult] = await Promise.all([
      SearchAssetsLastInterventionCommand.create(req),
      SearchAssetsLastInterventionValidator.validateAgainstOpenApi(req),
      SearchAssetsLastInterventionValidator.validateTaxonomy(req)
    ]);
    const inputValidationResult = Result.combine([
      searchAssetsLastInterventionCommandResult,
      openApiResult,
      taxonomyResult
    ]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const searchAssetsLastInterventionCommand = searchAssetsLastInterventionCommandResult.getValue();
    const findOptionsResult = InterventionFindOptions.create({
      criterias: {
        toPlanificationYear: searchAssetsLastInterventionCommand.planificationYear,
        assetId: searchAssetsLastInterventionCommand.assetIds,
        assetExternalReferenceIds: searchAssetsLastInterventionCommand.assetExternalReferenceIds
      },
      orderBy: '-planificationYear,-createdAt',
      fields: ['planificationYear', 'assets.id', 'assets.externalReferenceIds'].join(',')
    });

    if (findOptionsResult.isFailure) {
      return left(new UnexpectedError(findOptionsResult.errorValue()));
    }

    const interventions: IEnrichedIntervention[] = await interventionRepository.findAll(findOptionsResult.getValue());
    const assetsLastInterventionResult = this.mapAssetsLastIntervention(
      interventions,
      searchAssetsLastInterventionCommand
    );

    return right(Result.ok(assetsLastInterventionResult));
  }

  private mapAssetsLastIntervention(
    interventions: IEnrichedIntervention[],
    command: SearchAssetsLastInterventionCommand
  ): IAssetLastIntervention[] {
    const assetLastInterventions: IAssetLastIntervention[] = [];

    if (!isNil(command.assetIds)) {
      convertStringOrStringArray(command.assetIds).forEach(assetId => {
        // looking for an intervention that has an asset with id equaling to assetId
        const interventionFound = interventions?.find(i => !!i.assets.find(asset => asset.id === assetId));
        const intervention: ILastIntervention = interventionFound
          ? {
              id: interventionFound.id,
              planificationYear: interventionFound.planificationYear
            }
          : null;
        // add an assetLastIntervention to the list
        assetLastInterventions.push({
          assetId,
          intervention
        });
      });
    }

    if (!isNil(command.assetExternalReferenceIds)) {
      command.assetExternalReferenceIds?.forEach(assetExternalReferenceId => {
        // looking for an intervention that has an asset with externalReferenceId equaling to assetExternalReferenceId
        const interventionFound = interventions?.find(
          i =>
            !!i.assets?.find(
              asset =>
                !!asset.externalReferenceIds?.find(
                  externalReferenceId =>
                    externalReferenceId.type === assetExternalReferenceId.type &&
                    externalReferenceId.value === assetExternalReferenceId.value
                )
            )
        );

        let intervention: ILastIntervention = null;
        if (interventionFound) {
          intervention = {
            id: interventionFound.id,
            planificationYear: interventionFound.planificationYear
          };
          // get an existing assetLastIntervention by the intervention found
          const assetLastIntervention = assetLastInterventions.find(
            ali => ali.intervention?.id === interventionFound.id
          );
          if (assetLastIntervention) {
            // assign assetExternalReferenceId to an existing assetLastIntervention
            assetLastIntervention.assetExternalReferenceId = assetExternalReferenceId;
            return;
          }
        }

        // add a new assetLastIntervention to the list
        assetLastInterventions.push({
          assetExternalReferenceId,
          intervention
        });
      });
    }

    return assetLastInterventions;
  }
}

export const searchAssetsLastInterventionUseCase = new SearchAssetsLastInterventionUseCase();
