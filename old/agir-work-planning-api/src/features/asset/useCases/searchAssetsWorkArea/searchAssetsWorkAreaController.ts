import { IAssetsWorkArea } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { UseCaseController } from '../../../../shared/useCaseController';
import { ISearchAssetsWorkAreaCommandProps } from './searchAssetsWorkAreaCommand';
import { SearchAssetsWorkAreaUseCase, searchAssetsWorkAreaUseCase } from './searchAssetsWorkAreaUseCase';

@autobind
export class SearchAssetsWorkAreaController extends UseCaseController<
  ISearchAssetsWorkAreaCommandProps,
  IAssetsWorkArea
> {
  protected useCase: SearchAssetsWorkAreaUseCase = searchAssetsWorkAreaUseCase;
  protected reqToInput(req: express.Request): ISearchAssetsWorkAreaCommandProps {
    return {
      assets: req.body.assets,
      expand: req.body.expand
    };
  }
}
