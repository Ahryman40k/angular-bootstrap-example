import { IAssetsWorkArea } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';

import { assetService } from '../../../../services/assetService';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { BUFFER_INTERVENTION_AREA_METERS, workAreaService } from '../../../../services/workAreaService';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { assetsWorkAreaMapperDTO } from '../../mappers/assetsWorkAreaMapperDTO';
import { Asset } from '../../models/asset';
import { AssetsWorkArea } from '../../models/assetsWorkArea';
import { SearchAssetsWorkAreaValidator } from '../../validators/searchAssetsWorkAreaValidator';
import { ISearchAssetsWorkAreaCommandProps, SearchAssetsWorkAreaCommand } from './searchAssetsWorkAreaCommand';

export class SearchAssetsWorkAreaUseCase extends UseCase<ISearchAssetsWorkAreaCommandProps, IAssetsWorkArea> {
  public async execute(req: ISearchAssetsWorkAreaCommandProps): Promise<Response<IAssetsWorkArea>> {
    const [searchAssetsWorkAreaCommandResult, openApiResult] = await Promise.all([
      SearchAssetsWorkAreaCommand.create(req),
      SearchAssetsWorkAreaValidator.validateAgainstOpenApi(req)
    ]);
    const inputValidationResult = Result.combine([searchAssetsWorkAreaCommandResult, openApiResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const searchAssetsWorkAreaCommand = searchAssetsWorkAreaCommandResult.getValue();
    const assetIdsAndResults = await assetService.getAssetsResults(searchAssetsWorkAreaCommand);

    const assetResults: Result<Asset>[] = Object.keys(assetIdsAndResults).map(key => assetIdsAndResults[key]);
    const result = Result.combine(assetResults);
    if (result.isFailure) {
      const notFoundIds = Object.keys(assetIdsAndResults)
        .map(assetId => {
          if (
            assetIdsAndResults[assetId].isFailure &&
            ((assetIdsAndResults[assetId].errorValue() as any) as IGuardResult).code === ErrorCode.NOT_FOUND
          ) {
            return assetId;
          }
          return null;
        })
        .filter(id => id);
      if (!isEmpty(notFoundIds)) {
        return left(new NotFoundError(notFoundIds.join(',')));
      }
      return left(new UnexpectedError(Result.combineForError(result)));
    }

    const polygons = await workAreaService.getPolygonsFromGeometries(
      assetResults.map(assetResult => assetResult.getValue().geometry)
    );
    const workArea = await workAreaService.generateWorkAreaFromPolygons(polygons, BUFFER_INTERVENTION_AREA_METERS);
    if (workArea) {
      const roadSections = await assetService.getRoadSections(workArea);
      workArea.properties = {
        ...(workArea.properties || {}),
        suggestedStreetName: spatialAnalysisService.getSuggestedName(roadSections)
      };
    }

    const assetWorkAreaResult = AssetsWorkArea.create({
      assets: assetResults.map(assetResult => assetResult.getValue()),
      workArea
    });

    if (assetWorkAreaResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(assetWorkAreaResult)));
    }

    return right(
      Result.ok<IAssetsWorkArea>(await assetsWorkAreaMapperDTO.getFromModel(assetWorkAreaResult.getValue()))
    );
  }
}

export const searchAssetsWorkAreaUseCase = new SearchAssetsWorkAreaUseCase();
