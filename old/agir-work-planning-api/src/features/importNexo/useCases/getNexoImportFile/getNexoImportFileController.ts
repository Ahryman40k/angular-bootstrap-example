import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { UseCaseController } from '../../../../shared/useCaseController';
import { INexoGetFileProps } from './getNexoImportFileCommand';
import { GetNexoImportFileUseCase, getNexoImportFileUseCase } from './getNexoImportFileUseCase';

@autobind
export class GetNexoImportFileController extends UseCaseController<INexoGetFileProps, IDownloadFileResult> {
  protected readonly useCase: GetNexoImportFileUseCase = getNexoImportFileUseCase;
  protected reqToInput(req: express.Request): INexoGetFileProps {
    return {
      nexoLogId: req.params.id,
      nexoFileId: req.params.fileId
    };
  }
}
