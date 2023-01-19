import { IAssetsLastInterventionSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Command } from '../../../../shared/domain/command';
import {
  ExternalReferenceId,
  IExternalReferenceIdProps
} from '../../../../shared/domain/externalReferenceId/externalReferenceId';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface ISearchAssetsLastInterventionCommandProps extends IAssetsLastInterventionSearchRequest {
  assetExternalReferenceIds?: IExternalReferenceIdProps[];
}

export class SearchAssetsLastInterventionCommand extends Command<ISearchAssetsLastInterventionCommandProps> {
  public static create(props: ISearchAssetsLastInterventionCommandProps): Result<SearchAssetsLastInterventionCommand> {
    const guardAssetIds = Guard.guard({
      argument: props.assetIds,
      argumentName: 'assetIds',
      guardType: [GuardType.IS_ARRAY]
    });

    let guardAssetExternalReferenceIds: IGuardResult[] = [{ succeeded: true }];
    if (props.assetExternalReferenceIds) {
      const guardAssetExternalReferenceIdsArray = Guard.guard({
        argument: props.assetExternalReferenceIds,
        argumentName: 'assetExternalReferenceIds',
        guardType: [GuardType.IS_ARRAY]
      });
      if (guardAssetExternalReferenceIdsArray.succeeded) {
        guardAssetExternalReferenceIds = props.assetExternalReferenceIds.map((assetExternalReferenceId, idx) =>
          ExternalReferenceId.guard(assetExternalReferenceId, `[${idx}]`)
        );
      }
      guardAssetExternalReferenceIds.push(guardAssetExternalReferenceIdsArray);
    }

    // Must have at least one
    const guardHasAtLeastOne: IGuardResult = Guard.guard({
      argument: props,
      argumentName: 'assetIds / assetExternalReferenceIds',
      guardType: [GuardType.AT_LEAST_ONE],
      values: ['assetIds', 'assetExternalReferenceIds']
    });
    const guardAssetType = Guard.guard({
      argument: props.planificationYear,
      argumentName: 'planificationYear',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_YEAR]
    });
    const guard = Guard.combine([guardAssetIds, guardAssetType, ...guardAssetExternalReferenceIds, guardHasAtLeastOne]);
    if (!guard.succeeded) {
      return Result.fail<SearchAssetsLastInterventionCommand>(guard);
    }
    const searchAssetsCommand = new SearchAssetsLastInterventionCommand(props);
    return Result.ok<SearchAssetsLastInterventionCommand>(searchAssetsCommand);
  }

  public get assetIds(): string[] {
    return this.props.assetIds;
  }

  public get assetExternalReferenceIds(): IExternalReferenceIdProps[] {
    return this.props.assetExternalReferenceIds;
  }

  public get planificationYear(): number {
    return this.props.planificationYear;
  }
}
