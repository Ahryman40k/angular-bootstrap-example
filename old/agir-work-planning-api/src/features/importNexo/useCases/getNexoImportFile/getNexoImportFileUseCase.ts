import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { GetNexoImportFileCommand, INexoGetFileProps } from './getNexoImportFileCommand';

export class GetNexoImportFileUseCase implements UseCase<INexoGetFileProps, IDownloadFileResult> {
  public async execute(req: INexoGetFileProps): Promise<Response<IDownloadFileResult>> {
    const getNexoImportFileCommandResult = GetNexoImportFileCommand.create(req);

    if (getNexoImportFileCommandResult.isFailure) {
      return left(new InvalidParameterError(getNexoImportFileCommandResult.errorValue()));
    }

    const getNexoImportFileCommand = getNexoImportFileCommandResult.getValue();

    const nexoImportLog = await nexoImportLogRepository.findById(getNexoImportFileCommand.nexoLogId);
    if (!nexoImportLog) {
      return left(new NotFoundError(`Nexo import log ${getNexoImportFileCommand.nexoLogId} was not found`));
    }

    const file = nexoImportLog.files.find(f => f.id === getNexoImportFileCommand.nexoFileId);
    if (!file) {
      return left(
        new NotFoundError(
          `Nexo import file ${getNexoImportFileCommand.nexoFileId} was not found in the nexo import log ${getNexoImportFileCommand.nexoLogId}`
        )
      );
    }

    const downloadFileResult = await storageApiService.get(file.storageId);
    if (downloadFileResult.isFailure) {
      return left(
        new UnexpectedError(
          `An error occured during the download from storage api: ${(downloadFileResult.error as any).error}`
        )
      );
    }

    return right(Result.ok<IDownloadFileResult>(downloadFileResult.getValue()));
  }
}

export const getNexoImportFileUseCase = new GetNexoImportFileUseCase();
