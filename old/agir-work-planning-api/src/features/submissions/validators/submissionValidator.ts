import {
  IApiError,
  IEnrichedProject,
  nextAuthorizedSubmissionProgressStatuses,
  Permission,
  ProjectStatus,
  SubmissionProgressStatus,
  SubmissionRequirementMention,
  SubmissionStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { flatten, isEmpty, isNil, uniq } from 'lodash';

import { userService } from '../../../services/userService';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { getProgramBookIds } from '../../projects/models/project';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { projectValidator } from '../../projects/validators/projectValidator';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { ProjectSubmissionCommand } from '../models/projectSubmissionCommand';
import { SubmissionRequirement } from '../models/requirements/submissionRequirement';
import { INVALID_SUBMISSION_PROGRESS_STATUS, isSubmission, Submission } from '../models/submission';
import { ISubmissionCreateRequestProps, SubmissionCreateRequest } from '../models/submissionCreateRequest';
import { submissionRepository } from '../mongo/submissionRepository';
import {
  ISubmissionPatchRequestProps,
  SubmissionPatchRequest
} from '../useCases/patchSubmission/submissionPatchRequest';
import {
  ISubmissionRequirementCreateRequestProps,
  SubmissionRequirementCreateRequest
} from '../useCases/requirements/addSubmissionRequirement/submissionRequirementCreateRequest';
import { SubmissionRequirementUpdateRequest } from '../useCases/requirements/updateSubmissionRequirement/submissionRequirementUpdateRequest';

export const PROJECT_STATUS_TO_CREATE_SUBMISSION = [ProjectStatus.preliminaryOrdered, ProjectStatus.finalOrdered];

export class SubmissionValidator {
  public static async validatePatchAgainstTaxonomies(patch: ISubmissionPatchRequestProps): Promise<Result<void>> {
    const errorDetails: IApiError[] = [];
    if (patch.status) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.submissionStatus, patch.status);
    }
    if (patch.progressStatus) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.submissionProgressStatus, patch.progressStatus);
    }
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }

  public static async validateProjectsExists(
    submissionCreateRequest: SubmissionCreateRequest<ISubmissionCreateRequestProps>
  ): Promise<Result<IGuardResult | void>> {
    if (isNil(submissionCreateRequest.projects)) {
      await submissionCreateRequest.fetchProjects();
    }
    const notFoundProjectsIds = submissionCreateRequest.projectIds.filter(
      id => !submissionCreateRequest.projects.map(p => p.id).includes(id)
    );
    if (!isEmpty(notFoundProjectsIds)) {
      return Result.fail(
        Guard.combine(
          notFoundProjectsIds.map(id =>
            Guard.errorNotFound({
              argument: id,
              argumentName: `Project id ${id} was not found`
            })
          )
        )
      );
    }
    return Result.ok();
  }

  public static async validateCreateBusinessRules(
    submissionCreateRequest: SubmissionCreateRequest<ISubmissionCreateRequestProps>
  ): Promise<Result<IGuardResult>> {
    if (isNil(submissionCreateRequest.projects)) {
      await submissionCreateRequest.fetchProjects();
    }
    const results = Result.combine([
      this.validateProjectsStatus(submissionCreateRequest.projects),
      this.validateProjectsDRM(submissionCreateRequest.projects),
      this.validateProjectsBelongToProgramBook(submissionCreateRequest.projects, submissionCreateRequest.programBookId)
    ]);
    // do not go further if first validations were not completed
    if (results.isFailure) {
      return results;
    }
    return Result.combine([await this.validateProjectsCompatibility(submissionCreateRequest)]);
  }

  public static async validatePatchBusinessRules(
    submission: Submission,
    submissionPatchRequest: SubmissionPatchRequest
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validatePatchSubmissionStatus(submission, submissionPatchRequest),
      await this.validateSubmissionStatusComment(submissionPatchRequest),
      await this.validateSubmissionProgressStatus(submission, submissionPatchRequest),
      await this.validateSubmissionProgressStatusChangeDate(submission, submissionPatchRequest)
    ]);
  }

  public static async validateSubmissionStatusComment(
    submissionPatchRequest: SubmissionPatchRequest
  ): Promise<Result<void>> {
    if (
      !isNil(submissionPatchRequest.status) &&
      (isNil(submissionPatchRequest.comment) || submissionPatchRequest.comment === '')
    ) {
      return Result.fail(Guard.error('comment', ErrorCode.INVALID, 'is required'));
    }
    return Result.ok();
  }

  public static async validateRequirementCreateBusinessRules(
    submission: Submission,
    submissionRequirementCreateCmd: SubmissionRequirementCreateRequest<ISubmissionRequirementCreateRequestProps>
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validateSubmissionStatus(submission, [SubmissionStatus.INVALID]),
      await this.validateRequirementProgressStatus(submission),
      await this.validateRequirementProjectIds(submission, submissionRequirementCreateCmd)
    ]);
  }

  public static async validateRequirementUpdateBusinessRules(
    submission: Submission,
    submissionRequirement: SubmissionRequirement,
    submissionRequirementUpdateCmd: SubmissionRequirementUpdateRequest
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validateRequirementCreateBusinessRules(submission, submissionRequirementUpdateCmd),
      this.validateSubmissionRequirementNotDeprecated(submissionRequirement),
      this.validateSubmissionRequirementMention(submissionRequirement, submission)
    ]);
  }

  public static async validateDeleteRequirementBusinessRules(
    submission: Submission,
    submissionRequirement: SubmissionRequirement
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validateSubmissionStatus(submission, [SubmissionStatus.INVALID]),
      await this.validateRequirementProgressStatus(submission),
      this.validateSubmissionRequirementNotDeprecated(submissionRequirement),
      this.validateSubmissionRequirementMention(submissionRequirement, submission)
    ]);
  }

  public static async validatePatchRequirementBusinessRules(submission: Submission): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validateSubmissionStatus(submission, [SubmissionStatus.INVALID]),
      await this.validateRequirementProgressStatus(submission)
    ]);
  }

  private static async validateRequirementProgressStatus(submission: Submission): Promise<Result<IGuardResult>> {
    if (INVALID_SUBMISSION_PROGRESS_STATUS.includes(submission.progressStatus)) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCode.INVALID,
          `Submission ${submission.submissionNumber} Progress status is in invalid state: ${submission.progressStatus}`
        )
      );
    }
    return Result.ok();
  }

  public static async validateRequirementAgainstTaxonomies(
    requirement: ISubmissionRequirementCreateRequestProps
  ): Promise<Result<void>> {
    const errorDetails: IApiError[] = [];
    if (requirement.subtypeId) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.submissionRequirementSubtype, requirement.subtypeId);
    }
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }

  public static async validateDocumentsBusinessRules(submission: Submission): Promise<Result<IGuardResult>> {
    return Result.combine([await this.validateSubmissionStatus(submission, [SubmissionStatus.INVALID])]);
  }

  public static validatePatchPermissions(submissionPatchCmd: SubmissionPatchRequest): Result<IGuardResult> {
    let forbidden: IGuardArgument;
    let message = 'Missing permission: ';
    if (
      !isNil(submissionPatchCmd.status) &&
      !userService.currentUser.hasPermission(Permission.SUBMISSION_STATUS_WRITE)
    ) {
      forbidden = {
        argument: submissionPatchCmd.status,
        argumentName: 'status'
      };
      message += Permission.SUBMISSION_STATUS_WRITE;
    }
    if (
      !isNil(submissionPatchCmd.progressStatus) &&
      !userService.currentUser.hasPermission(Permission.SUBMISSION_PROGRESS_STATUS_WRITE)
    ) {
      forbidden = {
        argument: submissionPatchCmd.progressStatus,
        argumentName: 'progressStatus'
      };
      message += Permission.SUBMISSION_STATUS_WRITE;
    }
    if (forbidden) {
      return Result.fail(Guard.errorForbidden(forbidden, message));
    }
    return Result.ok();
  }

  public static async validateAddProjectToSubmissionBusinessRules(
    submission: Submission,
    addProjectToSubmissionCommand: ProjectSubmissionCommand,
    project: IEnrichedProject
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validateProjectSubmissionBusinessRules(submission),
      this.validateProjectNotAlreadyExist(submission, addProjectToSubmissionCommand.projectId),
      this.validateProjectsStatus([project]),
      this.validateProjectsDRM([project]),
      this.validateProjectsBelongToProgramBook([project], submission.programBookId),
      await this.validateProjectPreviousSubmission(project),
      this.validateSubmissionProgressStatusValue(submission.progressStatus)
    ]);
  }

  public static async validateRemoveProjectFromSubmissionBusinessRules(
    submission: Submission,
    addProjectToSubmissionCommand: ProjectSubmissionCommand,
    projectId: string
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      await this.validateProjectSubmissionBusinessRules(submission),
      this.validateProjectInSubmissionExist(submission, addProjectToSubmissionCommand.projectId),
      this.validateProjectNotLastInSubmission(submission, projectId),
      this.validateProjectHasNotSubmitionRequirement(submission, projectId)
    ]);
  }

  private static async validateProjectSubmissionBusinessRules(submission: Submission): Promise<Result<IGuardResult>> {
    return Result.combine([await this.validateSubmissionStatus(submission, [SubmissionStatus.INVALID])]);
  }

  private static validateProjectsStatus(projects: IEnrichedProject[]): Result<IGuardResult> {
    const invalidProjects = projects.filter(
      p => !PROJECT_STATUS_TO_CREATE_SUBMISSION.includes(p.status as ProjectStatus)
    );
    if (!isEmpty(invalidProjects)) {
      return Result.fail(
        Guard.combine(
          invalidProjects.map(p =>
            Guard.error(
              'project.status',
              ErrorCode.INVALID,
              `Project ${p.id} is ${p.status}. Must be one of: ${PROJECT_STATUS_TO_CREATE_SUBMISSION}`
            )
          )
        )
      );
    }
    return Result.ok();
  }

  private static validateSubmissionProgressStatusValue(progressStatus: string): Result<IGuardResult> {
    const submissionProgressStatusValid = [SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN];
    if (!submissionProgressStatusValid.includes(progressStatus as SubmissionProgressStatus)) {
      return Result.fail(
        Guard.error(
          'submission.progressStatus',
          ErrorCode.INVALID,
          `Submission Progress Status. Must be one of: ${submissionProgressStatusValid}`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectsDRM(projects: IEnrichedProject[]): Result<IGuardResult> {
    const invalidProjects = projects.filter(p => isNil(p.drmNumber));
    if (!isEmpty(invalidProjects)) {
      return Result.fail(
        Guard.combine(
          invalidProjects.map(p =>
            Guard.error('project.drmNumber', ErrorCode.MISSING, `Project ${p.id} has no drmNumber`)
          )
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectsBelongToProgramBook(
    projects: IEnrichedProject[],
    programBookId: string
  ): Result<IGuardResult> {
    const invalidProjects = projects.filter(p => {
      const projectProgramBookIds = getProgramBookIds(p);
      return !projectProgramBookIds.includes(programBookId);
    });
    if (!isEmpty(invalidProjects)) {
      return Result.fail(
        Guard.combine(
          invalidProjects.map(p =>
            Guard.error(
              'programBookId',
              ErrorCode.INVALID,
              `Project ${p.id} do not belong to programBook ${programBookId}`
            )
          )
        )
      );
    }
    return Result.ok();
  }

  private static async validateProjectsCompatibility(
    submissionCreateRequest: SubmissionCreateRequest<ISubmissionCreateRequestProps>
  ): Promise<Result<IGuardResult>> {
    // check for previous submissions
    // none of the project have a previous submission => must all have a same drm number
    const projectsWithoutSubmission = submissionCreateRequest.projects.filter(p => isNil(p.submissionNumber));
    if (projectsWithoutSubmission.length === submissionCreateRequest.projects.length) {
      const drmNumbers = uniq(submissionCreateRequest.projects.map(p => p.drmNumber));
      if (drmNumbers.length > 1) {
        return Result.fail(
          Guard.error(
            'drmNumber',
            ErrorCode.INVALID,
            `All projects must have the same drmNumber when no previous submission. Got ${drmNumbers.join(',')}`
          )
        );
      }
      // if none of the projects have a previous submission but valid drm, accept wiyhout going further
      return Result.ok();
    }
    // some projects do not have a previous submission number
    if (
      !isEmpty(projectsWithoutSubmission) &&
      projectsWithoutSubmission.length !== submissionCreateRequest.projectIds.length
    ) {
      return Result.fail(
        Guard.error(
          'submissionNumber',
          ErrorCode.MISSING,
          `Some projects do not have a previous submissionNumber: ${projectsWithoutSubmission.map(p => p.id).join(',')}`
        )
      );
    }
    // All projects do not have the same previous submissionNumber
    const submissionNumbers = uniq(submissionCreateRequest.projects.map(p => p.submissionNumber));
    if (submissionNumbers.length > 1) {
      return Result.fail(
        Guard.error(
          'submissionNumber',
          ErrorCode.INVALID,
          `All projects must have the same previous submissionNumber. Got ${submissionNumbers.join(',')}`
        )
      );
    }
    // if only one and same submission, validate status
    return this.validateSubmissionStatus(
      submissionNumbers.find(s => s),
      [SubmissionStatus.VALID]
    );
  }

  private static async validatePatchSubmissionStatus(
    submission: string | Submission,
    submissionPatchRequest: SubmissionPatchRequest
  ): Promise<Result<IGuardResult>> {
    let submissionToValidate = submission;
    if (!isSubmission(submissionToValidate)) {
      submissionToValidate = await submissionRepository.findById(submissionToValidate);
    }
    if (!submissionToValidate) {
      return Result.fail(Guard.error('submission', ErrorCode.NOT_FOUND, `Previous submission was not found`));
    }

    const unprocessableProgressStatus = [
      SubmissionProgressStatus.CALL_FOR_TENDER,
      SubmissionProgressStatus.GRANTED,
      SubmissionProgressStatus.REALIZATION,
      SubmissionProgressStatus.CLOSING
    ];
    if (
      submissionPatchRequest.status === SubmissionStatus.VALID &&
      unprocessableProgressStatus.includes(submissionToValidate.progressStatus)
    ) {
      Guard.error(
        'progressStatus',
        ErrorCode.UNPROCESSABLE_ENTITY,
        `progressStatus should not be on: ${unprocessableProgressStatus.join(',')}`
      );
    }
    return Result.ok();
  }

  private static async validateSubmissionStatus(
    submission: string | Submission,
    invalidStatuses: string[]
  ): Promise<Result<IGuardResult>> {
    let submissionToValidate = submission;
    if (!isSubmission(submissionToValidate)) {
      submissionToValidate = await submissionRepository.findById(submissionToValidate);
    }
    if (!submissionToValidate) {
      return Result.fail(Guard.error('submission', ErrorCode.NOT_FOUND, `Previous submission was not found`));
    }

    if (invalidStatuses.includes(submissionToValidate.status)) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCode.INVALID,
          `Submission ${submissionToValidate.submissionNumber} status is in invalid state: ${invalidStatuses.join(',')}`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectNotAlreadyExist(submission: Submission, projectId: string): Result<IGuardResult> {
    if (submission.projectIds.includes(projectId)) {
      return Result.fail(
        Guard.error(
          'id',
          ErrorCode.DUPLICATE,
          `Project ${projectId} already exists in submission ${submission.submissionNumber}`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectInSubmissionExist(submission: Submission, projectId: string): Result<IGuardResult> {
    if (!submission.projectIds.includes(projectId)) {
      return Result.fail(
        Guard.error(
          'id',
          ErrorCode.MISSING,
          `Project ${projectId} do not belongs to submission ${submission.submissionNumber}`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectNotLastInSubmission(submission: Submission, projectId: string): Result<IGuardResult> {
    if (submission.projectIds.includes(projectId) && submission.projectIds.length === 1) {
      return Result.fail(
        Guard.error(
          'id',
          ErrorCode.FORBIDDEN,
          `Cannot remove project ${projectId} as it is the last in submission ${submission.submissionNumber}`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectHasNotSubmitionRequirement(submission: Submission, projectId: string): Result<void> {
    const submissionRequirementsProjectIds = uniq(flatten(submission.requirements.map(req => req.projectIds)));
    if (submissionRequirementsProjectIds.length) {
      const hasRequirement = submissionRequirementsProjectIds?.includes(projectId);
      if (hasRequirement) {
        return Result.fail(
          Guard.error('requirements', ErrorCode.UNPROCESSABLE_ENTITY, 'The project have an a submission requirement')
        );
      }
      return Result.ok();
    }
    return Result.ok();
  }

  private static async validateProjectPreviousSubmission(project: IEnrichedProject): Promise<Result<IGuardResult>> {
    if (isNil(project.submissionNumber)) {
      return Result.ok();
    }
    const previousSubmission = await submissionRepository.findById(project.submissionNumber);
    if (!previousSubmission) {
      return Result.fail(
        Guard.errorNotFound(
          {
            argument: project.submissionNumber,
            argumentName: `project.submissionNumber`
          },
          `Previous submission ${project.submissionNumber} for project ${project.id} was not found`
        )
      );
    }
    const previousSubmissionStatusResult = await this.validateSubmissionStatus(previousSubmission, [
      SubmissionStatus.VALID
    ]);
    if (previousSubmissionStatusResult.isFailure) {
      return previousSubmissionStatusResult;
    }
    return Result.ok();
  }

  private static async validateSubmissionProgressStatus(
    submission: Submission,
    submissionPatchRequest: SubmissionPatchRequest
  ): Promise<Result<IGuardResult>> {
    if (isNil(submissionPatchRequest.progressStatus)) {
      return Result.ok();
    }
    const nextAuthorizedProgressStatuses = nextAuthorizedSubmissionProgressStatuses(submission.progressStatus);
    if (!nextAuthorizedProgressStatuses.includes(submissionPatchRequest.progressStatus)) {
      return Result.fail(
        Guard.error(
          'progressStatus',
          ErrorCode.FORBIDDEN,
          `Transition to ${
            submissionPatchRequest.progressStatus
          } is not authorized. Authorized progressStatus: ${nextAuthorizedProgressStatuses.join(',')}`
        )
      );
    }
    if (submission.status !== SubmissionStatus.VALID) {
      return Result.fail(
        Guard.error('progressStatus', ErrorCode.UNPROCESSABLE_ENTITY, 'submission status should be valid')
      );
    }
    return Result.ok();
  }

  private static async validateSubmissionProgressStatusChangeDate(
    submission: Submission,
    submissionPatchRequest: SubmissionPatchRequest
  ): Promise<Result<IGuardResult>> {
    if (isNil(submissionPatchRequest.progressStatusChangeDate)) {
      return Result.ok();
    }
    const minimalDate: string = !isEmpty(submission.progressHistory)
      ? submission.progressHistory[submission.progressHistory.length - 1].audit.createdAt
      : submission.audit.createdAt;

    if (submissionPatchRequest.progressStatusChangeDate < new Date(minimalDate)) {
      return Result.fail(
        Guard.error(
          'progressStatusChangeDate',
          ErrorCode.FORBIDDEN,
          `progressStatusChangeDate must be after ${minimalDate}`
        )
      );
    }
    return Result.ok();
  }

  private static async validateRequirementProjectIds(
    submission: Submission,
    submissionRequirementCmd: SubmissionRequirementCreateRequest<ISubmissionRequirementCreateRequestProps>
  ): Promise<Result<IGuardResult>> {
    if (isNil(submissionRequirementCmd.projectIds)) {
      return Result.ok();
    }
    const notFoundProjectsIds = submissionRequirementCmd.projectIds.filter(id => !submission.projectIds.includes(id));
    if (!isEmpty(notFoundProjectsIds)) {
      return Result.fail(
        Guard.combine(
          notFoundProjectsIds.map(id =>
            Guard.errorNotFound({
              argument: id,
              argumentName: `Project id ${id} was not found`
            })
          )
        )
      );
    }
    return Result.ok();
  }

  private static validateSubmissionRequirementNotDeprecated(
    submissionRequirement: SubmissionRequirement
  ): Result<IGuardResult> {
    if (submissionRequirement.isDeprecated) {
      return Result.fail(
        Guard.error(
          'isDeprecated',
          ErrorCode.FORBIDDEN,
          `Submission requirement with id ${submissionRequirement.id} is deprecated`
        )
      );
    }
    return Result.ok();
  }

  private static validateSubmissionRequirementMention(
    submissionRequirement: SubmissionRequirement,
    submission: Submission
  ): Result<IGuardResult> {
    if (
      submissionRequirement.mentionId === SubmissionRequirementMention.BEFORE_TENDER &&
      ![SubmissionProgressStatus.PRELIMINARY_DRAFT, SubmissionProgressStatus.DESIGN].includes(submission.progressStatus)
    ) {
      return Result.fail(
        Guard.error(
          'mentionId',
          ErrorCode.FORBIDDEN,
          `Submission requirement mention is ${SubmissionRequirementMention.BEFORE_TENDER}`
        )
      );
    }
    return Result.ok();
  }
  public static async validateProjectsRestrictions(projects: IEnrichedProject[]): Promise<Result<IGuardResult>> {
    return Result.combine(
      projects.map(pr => {
        return projectValidator.validateRestrictions(pr);
      })
    );
  }
  public static async validateProjectIdsRestrictions(projectIds: string[]): Promise<Result<IGuardResult>> {
    const projects = (await Promise.all(projectIds.map(el => projectRepository.findById(el)))).filter(x => x);
    return Result.combine(
      projects.map(pr => {
        return projectValidator.validateRestrictions(pr);
      })
    );
  }
}
