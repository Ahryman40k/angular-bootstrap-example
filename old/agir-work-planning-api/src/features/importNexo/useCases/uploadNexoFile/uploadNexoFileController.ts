import { INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UploadRequest } from '../../../../models/requests';
import { UploadController } from '../../../../shared/upload/uploadController';
import { IUploadNexoFileProps } from './uploadNexoFileCommand';
import { uploadNexoFileUseCase, UploadNexoFileUseCase } from './uploadNexoFileUseCase';

@autobind
export class UploadNexoFileController extends UploadController<IUploadNexoFileProps, INexoImportLog> {
  protected readonly useCase: UploadNexoFileUseCase = uploadNexoFileUseCase;
  protected reqToInput(req: UploadRequest): IUploadNexoFileProps {
    return {
      ...super.reqToInput(req),
      id: req.params.id,
      fileType: req.body.fileType
    };
  }
}
