import { IEnrichedProject, ISubmission } from '@villemontreal/agir-work-planning-lib';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { Audit } from '../../../audit/audit';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { IProjectSubmissionProps, ProjectSubmissionCommand } from '../../models/projectSubmissionCommand';
import { SubmissionRequirement } from '../../models/requirements/submissionRequirement';
import { Submission } from '../../models/submission';
import { submissionRepository } from '../../mongo/submissionRepository';

export abstract class ProjectSubmissionUseCase extends UseCase<IProjectSubmissionProps, ISubmission> {
  protected abstract checkProjectExists(cmd: ProjectSubmissionCommand): Promise<Result<IEnrichedProject>>;

  protected abstract updateProjectsIds(currentProjectIds: string[], inputProjectId: string): string[];

  protected abstract updateRequirements(
    inputProjectId: string,
    submission: Submission
  ): Promise<SubmissionRequirement[]>;

  protected abstract validateBusinessRules(
    submission: Submission,
    projectSubmissionCmd: ProjectSubmissionCommand,
    project?: IEnrichedProject
  ): Promise<Result<IGuardResult>>;

  protected abstract validateProjectIdsRestrictions(
    currentProjectIds: string[],
    inputProjectId: string
  ): Promise<Result<IGuardResult>>;

  protected abstract updateProject(submission: Submission, project: IEnrichedProject): Promise<IEnrichedProject>;

  public async execute(req: IProjectSubmissionProps): Promise<Response<ISubmission>> {
    const projectSubmissionCommandResult = ProjectSubmissionCommand.create(req);
    if (projectSubmissionCommandResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(projectSubmissionCommandResult)));
    }
    const projectSubmissionCommand = projectSubmissionCommandResult.getValue();

    const currentSubmission = await submissionRepository.findById(projectSubmissionCommand.submissionNumber);
    if (!currentSubmission) {
      return left(new NotFoundError(`Submission with id ${projectSubmissionCommand.submissionNumber} was not found`));
    }
    const projectResult = await this.checkProjectExists(projectSubmissionCommand);
    if (projectResult.isFailure) {
      return left(new NotFoundError(`Project with id ${projectSubmissionCommand.projectId} was not found`));
    }
    let project = projectResult.getValue();
    const restrictionResult = await this.validateProjectIdsRestrictions(
      currentSubmission.projectIds,
      projectSubmissionCommand.projectId
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }
    const businessRulesResult = await this.validateBusinessRules(currentSubmission, projectSubmissionCommand, project);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }
    const projectIds = this.updateProjectsIds(currentSubmission.projectIds, projectSubmissionCommand.projectId);

    const requirementsToAdd = await this.updateRequirements(projectSubmissionCommand.projectId, currentSubmission);

    const submissionResult = Submission.create({
      submissionNumber: currentSubmission.submissionNumber,
      drmNumber: currentSubmission.drmNumber,
      projectIds,
      programBookId: currentSubmission.programBookId,
      status: currentSubmission.status,
      documents: currentSubmission.documents,
      progressStatus: currentSubmission.progressStatus,
      progressHistory: currentSubmission.progressHistory,
      statusHistory: currentSubmission.statusHistory,
      requirements: requirementsToAdd,
      audit: Audit.fromUpdateContext(currentSubmission.audit)
    });
    if (submissionResult.isFailure) {
      return left(new UnexpectedError(submissionResult.errorValue()));
    }

    const savedResult = await submissionRepository.save(submissionResult.getValue());
    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }

    // Update project
    if (project) {
      project = await this.updateProject(currentSubmission, project);
      project.audit = Audit.fromUpdateContext(Audit.generateAuditFromIAudit(project.audit));
      const savedProjectResult = await projectRepository.save(project);
      if (savedProjectResult.isFailure) {
        return left(new UnexpectedError(savedProjectResult.errorValue()));
      }
    }
    return right(Result.ok<ISubmission>(await submissionMapperDTO.getFromModel(savedResult.getValue())));
  }

  protected async getProject(projectId: string): Promise<IEnrichedProject> {
    return projectRepository.findById(projectId);
  }
}
