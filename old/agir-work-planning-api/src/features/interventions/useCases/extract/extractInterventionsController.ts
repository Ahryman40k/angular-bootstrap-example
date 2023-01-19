import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IExtractInterventionsCommandProps } from './extractInterventionsCommand';
import { ExtractInterventionsUseCase, extractInterventionsUseCase } from './extractInterventionsUseCase';

@autobind
export class ExtractInterventionsController extends UseCaseController<
  IExtractInterventionsCommandProps,
  IDownloadFileResult
> {
  protected useCase: ExtractInterventionsUseCase = extractInterventionsUseCase;
  protected reqToInput(req: express.Request): IExtractInterventionsCommandProps {
    return {
      ...req.body
    };
  }
}
