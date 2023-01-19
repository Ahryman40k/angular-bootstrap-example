import { IAssetLastIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { ISearchAssetsLastInterventionCommandProps } from './searchAssetsLastInterventionCommand';
import {
  SearchAssetsLastInterventionUseCase,
  searchAssetsLastInterventionUseCase
} from './searchAssetsLastInterventionUseCase';

@autobind
export class SearchAssetsLastInterventionController extends UseCaseController<
  ISearchAssetsLastInterventionCommandProps,
  IAssetLastIntervention[]
> {
  protected useCase: SearchAssetsLastInterventionUseCase = searchAssetsLastInterventionUseCase;
  protected reqToInput(req: express.Request): ISearchAssetsLastInterventionCommandProps {
    return {
      assetIds: req.body.assetIds,
      assetExternalReferenceIds: req.body.assetExternalReferenceIds,
      planificationYear: req.body.planificationYear
    };
  }
}
