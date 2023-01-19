import { CountByUseCase } from '../../../../shared/domain/useCases/countUseCase/countByUseCase';
import { Result } from '../../../../shared/logic/result';
import { ISubmissionRepository } from '../../iSubmissionRepository';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { Submission } from '../../models/submission';
import { ISubmissionFindOptionsProps, SubmissionFindOptions } from '../../models/submissionFindOptions';
import { submissionRepository } from '../../mongo/submissionRepository';

export class CountBySubmissionUseCase extends CountByUseCase<Submission, ISubmissionFindOptionsProps> {
  protected entityRepository: ISubmissionRepository = submissionRepository;
  protected mapper = submissionMapperDTO;

  protected createCommand(req: ISubmissionFindOptionsProps): Result<SubmissionFindOptions> {
    return SubmissionFindOptions.create(req);
  }
}

export const countBySubmissionUseCase = new CountBySubmissionUseCase();
