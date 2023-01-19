import * as autobind from 'autobind-decorator';
import { CountByController } from '../../../../shared/controllers/countByController';
import { Submission } from '../../models/submission';
import { ISubmissionFindOptionsProps } from '../../models/submissionFindOptions';
import { CountBySubmissionUseCase, countBySubmissionUseCase } from './countBySubmissionUseCase';

@autobind
export class CountBySubmissionController extends CountByController<Submission, ISubmissionFindOptionsProps> {
  protected useCase: CountBySubmissionUseCase = countBySubmissionUseCase;
}
