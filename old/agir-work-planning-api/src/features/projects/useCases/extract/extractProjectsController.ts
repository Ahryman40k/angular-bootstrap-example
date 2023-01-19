import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { UseCaseController } from '../../../../shared/useCaseController';
import { IExtractProjectsCommandProps } from './extractProjectsCommand';
import { extractProjectsUseCase, ExtractProjectsUseCase } from './extractProjectsUseCase';

@autobind
export class ExtractProjectsController extends UseCaseController<IExtractProjectsCommandProps, IDownloadFileResult> {
  protected useCase: ExtractProjectsUseCase = extractProjectsUseCase;
  protected reqToInput(req: express.Request): IExtractProjectsCommandProps {
    return {
      ...req.body
    };
  }
}
