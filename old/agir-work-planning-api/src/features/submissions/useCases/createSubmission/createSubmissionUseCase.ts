import {
  ISubmission,
  RequirementTargetType,
  SubmissionProgressStatus,
  SubmissionRequirementMention,
  SubmissionStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { appUtils } from '../../../../utils/utils';
import { Audit } from '../../../audit/audit';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { requirementMapperDTO } from '../../../requirements/mappers/requirementMapperDTO';
import { RequirementFindOptions } from '../../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../../requirements/mongo/requirementRepository';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { SubmissionRequirement } from '../../models/requirements/submissionRequirement';
import { Submission } from '../../models/submission';
import { ISubmissionCreateRequestProps, SubmissionCreateRequest } from '../../models/submissionCreateRequest';
import { SubmissionFindOptions } from '../../models/submissionFindOptions';
import { submissionRepository } from '../../mongo/submissionRepository';
import { SubmissionValidator } from '../../validators/submissionValidator';
import { SubmissionRequirementCreateRequest } from '../requirements/addSubmissionRequirement/submissionRequirementCreateRequest';

const MAXIMUM_SUBMISSION_NUMBER = 99;

export class CreateSubmissionUseCase extends UseCase<ISubmissionCreateRequestProps, ISubmission> {
  // tslint:disable-next-line: max-func-body-length
  public async execute(req: ISubmissionCreateRequestProps): Promise<Response<ISubmission>> {
    const submissionCreateRequestResult = SubmissionCreateRequest.create(req);
    if (submissionCreateRequestResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(submissionCreateRequestResult)));
    }
    const submissionCreateRequest = submissionCreateRequestResult.getValue();

    const programBook: ProgramBook = await programBookRepository.findById(submissionCreateRequest.programBookId);
    if (!programBook) {
      return left(new NotFoundError(`Program book with id ${submissionCreateRequest.programBookId} was not found`));
    }
    const projectExistsResult = await SubmissionValidator.validateProjectsExists(submissionCreateRequest);
    if (projectExistsResult.isFailure) {
      return left(new NotFoundError(projectExistsResult.errorValue()));
    }
    const restrictionResult = await SubmissionValidator.validateProjectsRestrictions(submissionCreateRequest.projects);
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }
    const businessRulesResult = await SubmissionValidator.validateCreateBusinessRules(submissionCreateRequest);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    // get last soumission for given drmNumber
    const drmNumber = submissionCreateRequest.projects.map(p => p.drmNumber).find(d => d);
    const submissionFindOptions = SubmissionFindOptions.create({
      criterias: {
        drmNumber
      }
    }).getValue();
    const submission = await submissionRepository.findOne(submissionFindOptions);
    const submissionNumberSuffix = this.generateSubmissionNumberSuffix(submission);
    if (submissionNumberSuffix > MAXIMUM_SUBMISSION_NUMBER) {
      return left(
        new UnprocessableEntityError(
          Result.combineForError(
            Result.fail({
              code: ErrorCode.FORBIDDEN,
              message: `Reached Maximum number of submissions for ${drmNumber}`,
              succeeded: false,
              target: 'drmNumber'
            })
          )
        )
      );
    }
    const audit: Audit = Audit.fromCreateContext();

    const requirementFindOptions = RequirementFindOptions.create({
      criterias: {
        itemId: submissionCreateRequest.projectIds,
        itemType: RequirementTargetType.project
      }
    }).getValue();

    const requirements = await requirementMapperDTO.getFromModels(
      await requirementRepository.findAll(requirementFindOptions)
    );

    const submissionRequirements: SubmissionRequirement[] = [];

    for (const r of requirements) {
      const planningRequirementIndex = submissionRequirements.findIndex(
        requirement => requirement.planningRequirementId === r.id
      );
      const requirementProjectIds = r.items.map(requirementItem => requirementItem.id);
      const submissionProjectIds = requirementProjectIds.filter(id => submissionCreateRequest.projectIds.includes(id));

      if (planningRequirementIndex < 0) {
        const subTypeObject = await taxonomyService.getTaxonomy(TaxonomyGroup.requirementSubtype, r.subtypeId);
        const typeId = await SubmissionRequirementCreateRequest.getType(
          subTypeObject?.properties?.relatedDesignRequirement
        );

        if (typeId) {
          const submissionRequirement = SubmissionRequirement.create({
            projectIds: submissionProjectIds,
            mentionId: SubmissionRequirementMention.BEFORE_TENDER,
            typeId,
            subtypeId: subTypeObject.properties.relatedDesignRequirement,
            text: r.text,
            isDeprecated: false,
            planningRequirementId: r.id,
            audit
          }).getValue();
          submissionRequirements.push(submissionRequirement);
        }
      } else {
        submissionProjectIds.forEach(projectId => {
          if (
            submissionRequirements[planningRequirementIndex]?.projectIds.length >= 0 &&
            !submissionRequirements[planningRequirementIndex].projectIds.includes(projectId)
          ) {
            submissionRequirements[planningRequirementIndex].projectIds.push(projectId);
          }
        });
      }
    }

    const submissionSuffix = `${submissionNumberSuffix}`.padStart(`${MAXIMUM_SUBMISSION_NUMBER}`.length, '0');
    const submissionResult = Submission.create({
      submissionNumber: `${drmNumber}${submissionSuffix}`,
      drmNumber,
      projectIds: submissionCreateRequest.projectIds,
      programBookId: submissionCreateRequest.programBookId,
      status: SubmissionStatus.VALID,
      progressStatus: SubmissionProgressStatus.PRELIMINARY_DRAFT,
      progressHistory: [],
      requirements: submissionRequirements,
      audit
    });
    if (submissionResult.isFailure) {
      return left(new UnexpectedError(submissionResult.errorValue()));
    }

    const savedResult = await submissionRepository.save(submissionResult.getValue());
    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }

    // update projects with submissionNumber
    submissionCreateRequest.projects.forEach(p => {
      p.submissionNumber = savedResult.getValue().submissionNumber;
    });
    const updatedProjectsResult = await projectRepository.saveBulk(submissionCreateRequest.projects);
    if (updatedProjectsResult.isFailure) {
      return left(new UnexpectedError(updatedProjectsResult.errorValue()));
    }

    return right(Result.ok<ISubmission>(await submissionMapperDTO.getFromModel(savedResult.getValue())));
  }

  private generateSubmissionNumberSuffix(submission: Submission): number {
    if (!submission) {
      return 1;
    }
    const currentSuffix = submission.submissionNumber.slice(-`${MAXIMUM_SUBMISSION_NUMBER}`.length);
    return appUtils.parseInt(currentSuffix) + 1;
  }
}

export const createSubmissionUseCase = new CreateSubmissionUseCase();
