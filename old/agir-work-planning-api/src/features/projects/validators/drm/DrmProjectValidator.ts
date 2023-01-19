import { ErrorCodes, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isNil } from 'lodash';

import { Guard } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { openApiInputValidator } from '../../../../utils/openApiInputValidator';
import { IInputDrmProjectProps } from '../../models/drm/inputDrmNumber';

export class DrmProjectValidator {
  public static async validateAgainstOpenApi(drmProjectInput: IInputDrmProjectProps): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('InputDrmProject', drmProjectInput);
  }

  public static async validateCreateBusinessRules(projects: IEnrichedProject[]): Promise<Result<any>> {
    const projectsWithDrmNumber: string[] = projects
      .map(project => {
        if (!isNil(project.drmNumber)) {
          return project.id;
        }
        return null;
      })
      .filter(x => x);
    if (!isEmpty(projectsWithDrmNumber)) {
      return Result.fail(
        Guard.error(
          'project.drmNumber',
          ErrorCodes.BusinessRule,
          `Drm numbers are already assign to these projects : ${projectsWithDrmNumber.join(', ')}`
        )
      );
    }
    return Result.ok();
  }

  public static validateDeleteBusinessRules(projects: IEnrichedProject[]): Result<any> {
    const results: Result<any>[] = [Result.ok()];

    if (!projects.every(p => isEmpty(p.submissionNumber))) {
      results.push(
        Result.fail(
          Guard.error(
            'submissionNumber',
            ErrorCodes.BusinessRule,
            `Drm number can only be remove when project has no submission number`
          )
        )
      );
    }
    return Result.combine(results);
  }
}
