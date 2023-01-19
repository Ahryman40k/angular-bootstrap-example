import { INexoImportLog, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { AlreadyExistsError } from '../../../../shared/domainErrors/alreadyExistsError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { Audit } from '../../../audit/audit';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { NexoImportFile } from '../../models/nexoImportFile';
import { NexoImportLog } from '../../models/nexoImportLog';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { NexoImportLogValidator } from '../../validators/nexoImportLogValidator';
import { IImportNexoFileProps, ImportNexoFileCommand } from './importNexoFileCommand';

export class InitNexoImportUseCase extends UseCase<IImportNexoFileProps, INexoImportLog> {
  public async execute(req: IImportNexoFileProps): Promise<Response<INexoImportLog>> {
    // Check processing import
    const alreadyExist: NexoImportLog = await NexoImportLogValidator.importAlreadyRunning();
    if (alreadyExist) {
      const errMessage = `Only 1 import can be processed at a time, current import ${alreadyExist.id} started at ${alreadyExist.audit.createdAt} by ${alreadyExist.audit.createdBy.userName}`;
      return left(new AlreadyExistsError(errMessage, errMessage));
    }

    // Validate file elements
    const importFileCommandResult: Result<ImportNexoFileCommand<IImportNexoFileProps>> = ImportNexoFileCommand.create(
      req
    );
    if (importFileCommandResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(importFileCommandResult)));
    }
    const importFileCommand = importFileCommandResult.getValue();

    // Create in DB
    const fileResult = NexoImportFile.create({
      name: importFileCommand.file.originalname,
      contentType: importFileCommand.file.mimetype,
      type: importFileCommand.fileType,
      status: NexoImportStatus.PENDING
    });
    if (fileResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(fileResult)));
    }
    const initFile = fileResult.getValue();
    const audit: Audit = Audit.fromCreateContext();
    const nexoImportLogCreateResult = NexoImportLog.create({
      status: NexoImportStatus.PENDING,
      files: [initFile],
      audit
    });
    const savedNexoImportLogResult = await nexoImportLogRepository.save(nexoImportLogCreateResult.getValue());
    if (savedNexoImportLogResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedNexoImportLogResult)));
    }
    const nexoImportLog: NexoImportLog = savedNexoImportLogResult.getValue();

    // upload file to storage api
    const uploadStorageResult = await storageApiService.create(importFileCommand.file);
    if (uploadStorageResult.isFailure) {
      nexoImportLog.setStatus(NexoImportStatus.FAILURE);
      await nexoImportLogRepository.save(nexoImportLog);
      return left(new UnexpectedError(Result.combineForError(uploadStorageResult)));
    }

    // update file with storage id
    initFile.setStorageId(uploadStorageResult.getValue().objectId);
    const nexoImportLogUpdateResult = NexoImportLog.create(
      {
        status: NexoImportStatus.PENDING,
        files: [initFile],
        audit
      },
      nexoImportLog.id
    );
    const nexoImportLogUpdateSaved = await nexoImportLogRepository.save(nexoImportLogUpdateResult.getValue());
    if (nexoImportLogUpdateSaved.isFailure) {
      return left(new UnexpectedError(Result.combineForError(nexoImportLogUpdateSaved)));
    }

    return right(
      Result.ok<INexoImportLog>(await nexoImportLogMapperDTO.getFromModel(nexoImportLogUpdateSaved.getValue()))
    );
  }
}

export const initNexoImportUseCase = new InitNexoImportUseCase();
