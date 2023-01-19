import { IBicImportLog } from '@villemontreal/agir-work-planning-lib';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { Audit } from '../../../audit/audit';
import { bicImportLogMapperDTO } from '../../mappers/bicImportLogMapperDTO';
import { BicImportLog } from '../../models/bicImportLog';
import { bicImportLogRepository } from '../../mongo/bicImportLogRepository';

export class CreateBicImportLogUseCase extends UseCase<IBicImportLog, IBicImportLog> {
  public async execute(): Promise<Response<IBicImportLog>> {
    const bicImportLogCreateResult = BicImportLog.create({
      audit: Audit.fromCreateContext()
    });

    if (bicImportLogCreateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(bicImportLogCreateResult)));
    }
    const savedBicImportLogsResult = await bicImportLogRepository.save(bicImportLogCreateResult.getValue());
    if (savedBicImportLogsResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedBicImportLogsResult)));
    }

    return right(
      Result.ok<IBicImportLog>(await bicImportLogMapperDTO.getFromModel(savedBicImportLogsResult.getValue()))
    );
  }
}

export const createBicImportLogUseCase = new CreateBicImportLogUseCase();
