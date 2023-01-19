import {
  IAudit,
  IEnrichedDocument,
  IProgressHistoryItem,
  IStatusHistoryItem,
  ISubmission,
  ISubmissionRequirement
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, pick } from 'lodash';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { documentMapperDTO } from '../../documents/mappers/documentMapperDTO';
import { Submission } from '../models/submission';
import { progressHistoryMapperDTO } from './progressHistoryItemMapperDTO';
import { submissionRequirementMapperDTO } from './requirementItemMapperDTO';
import { statusHistoryMapperDTO } from './statusHistoryItemMapperDTO';

export interface ISubmissionMapperDTOOptions {
  fields: string[];
}
class SubmissionMapperDTO extends FromModelToDtoMappings<Submission, ISubmission, ISubmissionMapperDTOOptions> {
  protected async getFromNotNullModel(
    submission: Submission,
    options: ISubmissionMapperDTOOptions
  ): Promise<ISubmission> {
    const [statusHistoryItemDTOs, progressHistoryItemDTOs, requirementTDOs, documentDTO, auditDTO] = await Promise.all([
      statusHistoryMapperDTO.getFromModels(submission.statusHistory),
      progressHistoryMapperDTO.getFromModels(submission.progressHistory),
      submissionRequirementMapperDTO.getFromModels(submission.requirements),
      documentMapperDTO.getFromModels(submission.documents),
      auditMapperDTO.getFromModel(submission.audit)
    ]);
    return this.map(
      submission,
      statusHistoryItemDTOs,
      progressHistoryItemDTOs,
      requirementTDOs,
      documentDTO,
      auditDTO,
      options
    );
  }

  private map(
    submission: Submission,
    statusHistoryItemDTOs: IStatusHistoryItem[],
    progressHistoryItemsDTOs: IProgressHistoryItem[],
    requirementDTOs: ISubmissionRequirement[],
    documentsDTO: IEnrichedDocument[],
    auditDTO: IAudit,
    options: ISubmissionMapperDTOOptions
  ): ISubmission {
    const fullReturn: ISubmission = {
      submissionNumber: submission.submissionNumber,
      drmNumber: submission.drmNumber,
      status: submission.status,
      progressStatus: submission.progressStatus,
      statusHistory: statusHistoryItemDTOs,
      progressHistory: progressHistoryItemsDTOs,
      programBookId: submission.programBookId,
      projectIds: submission.projectIds,
      requirements: requirementDTOs,
      documents: documentsDTO,
      audit: auditDTO
    };

    if (!isEmpty(options?.fields)) {
      return pick(fullReturn, ['submissionNumber', ...options.fields]) as ISubmission;
    }
    return fullReturn;
  }
}

export const submissionMapperDTO = new SubmissionMapperDTO();
