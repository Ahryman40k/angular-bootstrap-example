import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { ISubmissionRepository } from '../../iSubmissionRepository';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { Submission } from '../../models/submission';
import {
  ISubmissionFindPaginatedOptionsProps,
  SubmissionFindPaginatedOptions
} from '../../models/submissionFindPaginatedOptions';
import { submissionRepository } from '../../mongo/submissionRepository';

export class SearchSubmissionUseCase extends SearchUseCase<
  Submission,
  ISubmission,
  ISubmissionFindPaginatedOptionsProps
> {
  protected entityRepository: ISubmissionRepository = submissionRepository;
  protected mapper = submissionMapperDTO;

  protected createCommand(req: ISubmissionFindPaginatedOptionsProps): Result<SubmissionFindPaginatedOptions> {
    return SubmissionFindPaginatedOptions.create(req);
  }
}

export const searchSubmissionUseCase = new SearchSubmissionUseCase();
