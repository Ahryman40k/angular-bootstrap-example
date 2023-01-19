import { IDrmProject, IInputDrmProject } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';

import { Response, UseCase } from '../../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../../shared/logic/left';
import { Result } from '../../../../../shared/logic/result';
import { right } from '../../../../../shared/logic/right';
import { drmProjectMapperDTO } from '../../../mappers/drm/drmProjectMapperDTO';
import { DrmProject } from '../../../models/drm/drmProject';
import { IInputDrmProjectProps, InputDrmProject } from '../../../models/drm/inputDrmNumber';
import { ProjectFindOptions } from '../../../models/projectFindOptions';
import { drmCounterRepository } from '../../../mongo/drmCounterRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { DrmProjectValidator } from '../../../validators/drm/DrmProjectValidator';
import { projectValidator } from '../../../validators/projectValidator';

export class GenerateDrmNumberUseCase extends UseCase<IInputDrmProject, IDrmProject[]> {
  public async execute(req: IInputDrmProjectProps): Promise<Response<IDrmProject[]>> {
    // Validate inputs
    const [drmProjectInput, openApiResult] = await Promise.all([
      InputDrmProject.create(req),
      DrmProjectValidator.validateAgainstOpenApi(req)
    ]);

    const inputValidationResult = Result.combine([drmProjectInput, openApiResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const drmInput: InputDrmProject<IInputDrmProjectProps> = drmProjectInput.getValue();

    const projects = await projectRepository.findAll(
      ProjectFindOptions.create({ criterias: { id: drmInput.projectIds }, orderBy: 'id' }).getValue()
    );
    if (
      isEmpty(projects) ||
      !(projects.length === drmInput.projectIds.length && projects.every(p => drmInput.projectIds.includes(p.id)))
    ) {
      return left(new NotFoundError(`Some projects was found`));
    }
    const restrictionResult = Result.combine(projects.map(pr => projectValidator.validateRestrictions(pr)));
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }
    const businessRulesResult = await DrmProjectValidator.validateCreateBusinessRules(projects);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    // increase sequence according to params
    const sequence = drmInput.isCommonDrmNumber ? 1 : drmInput.projectIds.length;
    const drmNumbers = await drmCounterRepository.getDrmNumbers('drm', sequence);

    if (isEmpty(drmNumbers)) {
      return left(new UnexpectedError(`System failed to generate drm numbers`));
    }

    for (const project of projects) {
      if (drmInput.isCommonDrmNumber) {
        project.drmNumber = drmNumbers[0].toString();
      } else {
        project.drmNumber = drmNumbers.shift().toString();
      }
    }

    const saveBulkResult = await projectRepository.saveBulk(projects);
    if (saveBulkResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(saveBulkResult)));
    }
    const projectList = saveBulkResult.getValue().savedObjects;
    const drmNumberResults = projectList.map(p => {
      return DrmProject.create({
        projectId: p.id,
        drmNumber: p.drmNumber
      });
    });

    const drmNumbersCombine = Result.combine(drmNumberResults);
    if (drmNumbersCombine.isFailure) {
      return left(new UnexpectedError(Result.combineForError(drmNumbersCombine)));
    }

    return right(
      Result.ok<IDrmProject[]>(
        await Promise.all(
          drmNumberResults.map(drmNumberEntity => drmProjectMapperDTO.getFromModel(drmNumberEntity.getValue()))
        )
      )
    );
  }
}

export const generateDrmNumberUseCase = new GenerateDrmNumberUseCase();
