import {
  IEnrichedProject,
  RequirementTargetType,
  SubmissionRequirementMention,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';

import { IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { Audit } from '../../../../audit/audit';
import { requirementMapperDTO } from '../../../../requirements/mappers/requirementMapperDTO';
import { RequirementFindOptions } from '../../../../requirements/models/requirementFindOptions';
import { requirementRepository } from '../../../../requirements/mongo/requirementRepository';
import { taxonomyService } from '../../../../taxonomies/taxonomyService';
import { ProjectSubmissionCommand } from '../../../models/projectSubmissionCommand';
import { SubmissionRequirement } from '../../../models/requirements/submissionRequirement';
import { Submission } from '../../../models/submission';
import { SubmissionValidator } from '../../../validators/submissionValidator';
import { SubmissionRequirementCreateRequest } from '../../requirements/addSubmissionRequirement/submissionRequirementCreateRequest';
import { ProjectSubmissionUseCase } from '../projectSubmissionUseCase';

export class AddProjectToSubmissionUseCase extends ProjectSubmissionUseCase {
  protected validateProjectIdsRestrictions(
    currentProjectIds: string[],
    inputProjectId: string
  ): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateProjectIdsRestrictions(
      this.updateProjectsIds(currentProjectIds, inputProjectId)
    );
  }
  protected async checkProjectExists(cmd: ProjectSubmissionCommand): Promise<Result<IEnrichedProject>> {
    const project = await this.getProject(cmd.projectId);
    if (!project) {
      return Result.fail(`Project ${cmd.projectId} not found`);
    }
    return Result.ok(project);
  }

  protected updateProjectsIds(currentProjectIds: string[], inputProjectId: string): string[] {
    return [...currentProjectIds, inputProjectId];
  }

  protected async updateRequirements(projectId: string, submission: Submission): Promise<SubmissionRequirement[]> {
    const audit: Audit = Audit.fromCreateContext();

    const requirementFindOptions = RequirementFindOptions.create({
      criterias: {
        itemId: projectId,
        itemType: RequirementTargetType.project
      }
    }).getValue();

    const requirements = await requirementMapperDTO.getFromModels(
      await requirementRepository.findAll(requirementFindOptions)
    );

    const submissionRequirements: SubmissionRequirement[] = submission.requirements;

    for (const r of requirements) {
      const planningRequirementIndex = submission.requirements.findIndex(req => req.planningRequirementId === r.id);
      if (planningRequirementIndex < 0) {
        const subTypeObject = await taxonomyService.getTaxonomy(TaxonomyGroup.requirementSubtype, r.subtypeId);
        if (subTypeObject.properties.relatedDesignRequirement) {
          const typeId = await SubmissionRequirementCreateRequest.getType(
            subTypeObject.properties.relatedDesignRequirement
          );

          const submissionRequirement = SubmissionRequirement.create({
            projectIds: [projectId],
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
      } else if (
        submissionRequirements[planningRequirementIndex]?.projectIds.length >= 0 &&
        !submissionRequirements[planningRequirementIndex].projectIds.includes(projectId)
      ) {
        submissionRequirements[planningRequirementIndex].projectIds.push(projectId);
      }
    }
    return submissionRequirements;
  }

  protected async validateBusinessRules(
    submission: Submission,
    projectSubmissionCmd: ProjectSubmissionCommand,
    project?: IEnrichedProject
  ): Promise<Result<IGuardResult>> {
    return SubmissionValidator.validateAddProjectToSubmissionBusinessRules(submission, projectSubmissionCmd, project);
  }

  protected async updateProject(submission: Submission, project: IEnrichedProject): Promise<IEnrichedProject> {
    project.submissionNumber = submission.submissionNumber;
    return project;
  }
}

export const addProjectToSubmissionUseCase = new AddProjectToSubmissionUseCase();
