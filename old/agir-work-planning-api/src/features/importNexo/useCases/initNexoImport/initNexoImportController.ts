import { INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UploadRequest } from '../../../../models/requests';
import { UploadController } from '../../../../shared/upload/uploadController';
import { IImportNexoFileProps } from './importNexoFileCommand';
import { InitNexoImportUseCase, initNexoImportUseCase } from './initNexoImportUseCase';

@autobind
export class InitNexoImportController extends UploadController<IImportNexoFileProps, INexoImportLog> {
  protected readonly useCase: InitNexoImportUseCase = initNexoImportUseCase;
  protected success = this.created;
  protected reqToInput(req: UploadRequest): IImportNexoFileProps {
    return {
      ...super.reqToInput(req),
      fileType: req.body.fileType
    };
  }
}
