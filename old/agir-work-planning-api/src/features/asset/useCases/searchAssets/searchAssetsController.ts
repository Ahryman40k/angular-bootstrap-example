import { IAsset } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { SearchController } from '../../../../shared/controllers/searchController';
import { IAssetsPaginatedFindOptionsProps } from '../../models/assetFindPaginatedOptions';
import { searchAssetsUseCase, SearchAssetsUseCase } from './searchAssetsUseCase';

@autobind
export class SearchAssetsController extends SearchController<IAssetsPaginatedFindOptionsProps, IAsset> {
  protected useCase: SearchAssetsUseCase = searchAssetsUseCase;

  public async execute(req: express.Request, res: express.Response): Promise<any> {
    const result = await this.useCase.execute(this.reqToInput(req));

    if (result.isRight()) {
      // SHOULD BE PAGINATED IASSET
      return this.ok(res, result.value.getValue().items);
    }

    if (result.isLeft()) {
      this.mapToApiError(result.value);
    }
  }
}
