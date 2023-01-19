import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { GetByIdUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByIdUseCase';
import { Result } from '../../../../shared/logic/result';
import { ISubmissionRepository } from '../../iSubmissionRepository';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { Submission } from '../../models/submission';
import { SubmissionFindOptions } from '../../models/submissionFindOptions';
import { submissionRepository } from '../../mongo/submissionRepository';
import { GetSubmissionCommand } from './getSubmissionCommand';

export class GetSubmissionUseCase extends GetByIdUseCase<Submission, ISubmission, SubmissionFindOptions> {
  protected entityRepository: ISubmissionRepository = submissionRepository;
  protected mapper = submissionMapperDTO;

  protected createCommand(req: IByIdCommandProps): Result<GetSubmissionCommand> {
    return GetSubmissionCommand.create(req);
  }

  protected getFindOptions(getSubmissionCommand: GetSubmissionCommand): Result<SubmissionFindOptions> {
    return SubmissionFindOptions.create({
      criterias: {
        submissionNumber: getSubmissionCommand.id
      },
      expand: getSubmissionCommand.expand
    });
  }
}

export const getSubmissionUseCase = new GetSubmissionUseCase();
