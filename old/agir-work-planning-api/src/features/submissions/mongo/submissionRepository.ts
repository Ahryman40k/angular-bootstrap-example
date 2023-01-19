import { isEmpty } from 'lodash';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Audit } from '../../audit/audit';
import { Document } from '../../documents/models/document';
import { ISubmissionRepository } from '../iSubmissionRepository';
import { ProgressHistoryItem } from '../models/progressHistoryItem';
import { SubmissionRequirement } from '../models/requirements/submissionRequirement';
import { StatusHistoryItem } from '../models/statusHistoryItem';
import { ISubmissionProps, Submission } from '../models/submission';
import { ISubmissionCriterias, SubmissionFindOptions } from '../models/submissionFindOptions';
import { submissionMatchBuilder } from '../submissionMatchBuilder';
import { ISubmissionAttributes, ISubmissionMongoDocument, SubmissionModel } from './submissionModel';

export const SUBMISSION_MANDATORY_FIELDS = [
  '_id',
  'drmNumber',
  'projectIds',
  'programBookId',
  'status',
  'progressStatus',
  'audit'
];
class SubmissionRepository extends BaseRepository<Submission, ISubmissionMongoDocument, SubmissionFindOptions>
  implements ISubmissionRepository {
  public get model(): SubmissionModel {
    return this.db.models.Submission;
  }

  protected async getMatchFromQueryParams(criterias: ISubmissionCriterias): Promise<any> {
    return submissionMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected getObjectIdentifier(obj: Submission): string {
    return obj.submissionNumber || (obj as any)?._id;
  }

  protected async toDomainModel(raw: ISubmissionAttributes): Promise<Submission> {
    let progressHistory: ProgressHistoryItem[];
    let documents: Document[];
    let requirements: SubmissionRequirement[];
    let statusHistory: StatusHistoryItem[];

    if (!isEmpty(raw.progressHistory)) {
      progressHistory = await Promise.all(raw.progressHistory.map(item => ProgressHistoryItem.toDomainModel(item)));
    }

    if (!isEmpty(raw.requirements)) {
      requirements = await Promise.all(raw.requirements.map(item => SubmissionRequirement.toDomainModel(item)));
    }

    if (!isEmpty(raw.documents)) {
      documents = await Promise.all(raw.documents.map(item => Document.toDomainModel(item)));
    }

    if (!isEmpty(raw.statusHistory)) {
      statusHistory = await Promise.all(raw.statusHistory.map(item => StatusHistoryItem.toDomainModel(item)));
    }

    const submissionProps: ISubmissionProps = {
      submissionNumber: raw._id,
      drmNumber: raw.drmNumber,
      programBookId: raw.programBookId.toString(),
      projectIds: raw.projectIds,
      status: raw.status,
      progressStatus: raw.progressStatus,
      statusHistory,
      documents,
      progressHistory,
      requirements,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return Submission.create(submissionProps).getValue();
  }

  protected toPersistence(submission: Submission): ISubmissionAttributes {
    return {
      _id: submission.submissionNumber,
      drmNumber: submission.drmNumber,
      programBookId: submission.programBookId,
      projectIds: submission.projectIds,
      status: submission.status,
      progressStatus: submission.progressStatus,
      requirements: submission.requirements.map(item => SubmissionRequirement.toPersistence(item)),
      documents: submission.documents.map(document => Document.toPersistance(document)),
      statusHistory: submission.statusHistory.map(item => StatusHistoryItem.toPersistence(item)),
      progressHistory: submission.progressHistory.map(item => ProgressHistoryItem.toPersistence(item)),
      audit: Audit.toPersistance(submission.audit)
    };
  }

  protected getProjection(fields: string[]): any {
    return super.getProjection(fields, SUBMISSION_MANDATORY_FIELDS);
  }
}

export const submissionRepository: ISubmissionRepository = new SubmissionRepository();
