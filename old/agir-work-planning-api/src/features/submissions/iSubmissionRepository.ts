import { IBaseRepository } from '../../repositories/core/baseRepository';
import { Submission } from './models/submission';
import { SubmissionFindOptions } from './models/submissionFindOptions';

// tslint:disable:no-empty-interface
export interface ISubmissionRepository extends IBaseRepository<Submission, SubmissionFindOptions> {}
