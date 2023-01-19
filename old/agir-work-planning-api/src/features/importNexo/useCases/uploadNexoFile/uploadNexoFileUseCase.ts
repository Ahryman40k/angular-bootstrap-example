import { INexoImportLog, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ConflictError } from '../../../../shared/domainErrors/conflictError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportFile } from '../../models/nexoImportFile';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { IUploadNexoFileProps, UploadNexoFileCommand } from './uploadNexoFileCommand';

export class UploadNexoFileUseCase extends UseCase<IUploadNexoFileProps, INexoImportLog> {
  public async execute(req: IUploadNexoFileProps): Promise<Response<INexoImportLog>> {
    // Validate file elements
    const uploadFileCommandResult: Result<UploadNexoFileCommand> = UploadNexoFileCommand.create(req);
    if (uploadFileCommandResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(uploadFileCommandResult)));
    }
    const uploadFileCommand: UploadNexoFileCommand = uploadFileCommandResult.getValue();
    const nexoImportLog = await nexoImportLogRepository.findById(uploadFileCommand.id);
    if (!nexoImportLog) {
      return left(new NotFoundError(`ImportLog with id ${uploadFileCommand.id} was not found`));
    }

    if (nexoImportLog.status !== NexoImportStatus.PENDING) {
      return left(
        new ConflictError(`Current status for nexoImportLog ${nexoImportLog.id} is not ${NexoImportStatus.PENDING}`)
      );
    }
    if (nexoImportLog.files.find(nexoFile => nexoFile.type === uploadFileCommand.fileType)) {
      return left(new ConflictError(`File type ${uploadFileCommand.fileType} already exists`));
    }
    const fileResult = NexoImportFile.create({
      name: uploadFileCommand.file.originalname,
      contentType: uploadFileCommand.file.mimetype,
      type: uploadFileCommand.fileType,
      status: NexoImportStatus.PENDING
    });
    if (fileResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(fileResult)));
    }

    // upload file to storage api
    const uploadStorageResult = await storageApiService.create(uploadFileCommand.file);
    if (uploadStorageResult.isFailure) {
      nexoImportLog.setStatus(NexoImportStatus.FAILURE);
      await nexoImportLogRepository.save(nexoImportLog);
      return left(new UnexpectedError(Result.combineForError(uploadStorageResult)));
    }
    // update file with storage id
    const addedFile = fileResult.getValue();
    addedFile.setStorageId(uploadStorageResult.getValue().objectId);
    nexoImportLog.addFile(addedFile);

    const savedNexoImportLogResult = await nexoImportLogRepository.save(nexoImportLog);
    if (savedNexoImportLogResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedNexoImportLogResult)));
    }

    return right(
      Result.ok<INexoImportLog>(await nexoImportLogMapperDTO.getFromModel(savedNexoImportLogResult.getValue()))
    );
  }
}

export const uploadNexoFileUseCase = new UploadNexoFileUseCase();
