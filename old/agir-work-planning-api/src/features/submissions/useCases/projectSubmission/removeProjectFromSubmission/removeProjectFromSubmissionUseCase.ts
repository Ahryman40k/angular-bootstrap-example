import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

import { IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { ProjectSubmissionCommand } from '../../../models/projectSubmissionCommand';
import { Submission } from '../../../models/submission';
import { SubmissionFindOptions } from '../../../models/submissionFindOptions';
import { submissionRepository } from '../../../mongo/submissionRepository';
import { SubmissionValidator } from '../../../validators/submissionValidator';
import { ProjectSubmissionUseCase } from '../projectSubmissionUseCase';

export class RemoveProjectFromSubmissionUseCase extends ProjectSubmissionUseCase {
  protected validateProjectIdsRestrictions(
    currentProjectIds: string[],
    inputProjectId: string
  ): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateProjectIdsRestrictions(currentProjectIds);
  }
  // In case of remove, result is always valid even if project not exists
  protected async checkProjectExists(cmd: ProjectSubmissionCommand): Promise<Result<IEnrichedProject>> {
    const project = await this.getProject(cmd.projectId);
    return Result.ok(project);
  }

  protected updateProjectsIds(currentProjectIds: string[], inputProjectId: string): string[] {
    return currentProjectIds.filter(id => id !== inputProjectId);
  }

  protected async validateBusinessRules(
    submission: Submission,
    projectSubmissionCmd: ProjectSubmissionCommand
  ): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateRemoveProjectFromSubmissionBusinessRules(
      submission,
      projectSubmissionCmd,
      projectSubmissionCmd.projectId
    );
  }

  protected updateRequirements(inputProjectId: string, submission: Submission) {
    return Promise.resolve(submission.requirements);
  }

  protected async updateProject(submission: Submission, project: IEnrichedProject): Promise<IEnrichedProject> {
    // find most recent submission for given project
    const projectSubmissions = await submissionRepository.findAll(
      SubmissionFindOptions.create({
        criterias: {
          projectIds: [project.id]
        },
        orderBy: '-createdAt'
      }).getValue()
    );
    const lastSubmission = projectSubmissions.find(s => s.submissionNumber !== submission.submissionNumber);
    let updatedSubmissionNumber: string = null;
    if (lastSubmission) {
      updatedSubmissionNumber = lastSubmission.submissionNumber;
    }
    project.submissionNumber = updatedSubmissionNumber;
    return project;
  }
}

export const removeProjectFromSubmissionUseCase = new RemoveProjectFromSubmissionUseCase();
