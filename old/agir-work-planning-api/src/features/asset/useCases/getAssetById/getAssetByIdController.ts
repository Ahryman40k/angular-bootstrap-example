import { AssetExpand, IAsset } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { isEmpty } from 'lodash';

import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { Asset } from '../../models/asset';
import { AssetFindOptions } from '../../models/assetFindOptions';
import { IGetAssetByIdCommandProps } from './getAssetByIdCommand';
import { GetAssetByIdUseCase, getAssetByIdUseCase } from './getAssetByIdUseCase';

@autobind
export class GetAssetByIdController extends GetByIdController<Asset, IAsset, AssetFindOptions> {
  protected useCase: GetAssetByIdUseCase = getAssetByIdUseCase;

  protected reqToInput(req: express.Request): IGetAssetByIdCommandProps {
    let expand = `${AssetExpand.assetDetails}`;
    if (!isEmpty(req.query.expand)) {
      expand += `,${req.query.expand}`;
    }
    return {
      ...super.reqToInput(req),
      id: req.params.assetId,
      assetTypes: [req.params.assetType],
      expand
    };
  }
}
