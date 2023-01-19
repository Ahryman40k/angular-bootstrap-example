import * as autobind from 'autobind-decorator';
import { constants } from '../../../config/constants';
import { UploadRequest } from '../../models/requests';
import { IImportFileProps } from '../domain/useCases/importFileCommand';
import { UseCase } from '../domain/useCases/useCase';
import { UseCaseController } from '../useCaseController';

@autobind
export abstract class UploadController<I extends IImportFileProps, O> extends UseCaseController<IImportFileProps, O> {
  protected abstract readonly useCase: UseCase<I, O>;
  protected reqToInput(req: UploadRequest): IImportFileProps {
    return {
      file: req[constants.request.FILE]
    };
  }
}
