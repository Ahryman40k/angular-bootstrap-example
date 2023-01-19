import { IDrmProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { GenericEntity } from '../../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { DRM_NUMBER_REGEX } from '../../../submissions/models/submission';

// tslint:disable:no-empty-interface
export interface IDrmProjectProps extends IDrmProject {}

export class DrmProject extends GenericEntity<IDrmProjectProps> {
  public static create(props: IDrmProjectProps): Result<DrmProject> {
    const guardResult = DrmProject.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<DrmProject>(guardResult);
    }
    const drmNumber = new DrmProject(props);
    return Result.ok<DrmProject>(drmNumber);
  }

  public static guard(props: IDrmProjectProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.projectId,
        argumentName: 'projectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
      },
      {
        argument: props.drmNumber,
        argumentName: 'drmNumber',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_REGEX],
        values: [DRM_NUMBER_REGEX]
      }
    ];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  constructor(props: IDrmProjectProps) {
    super(props);
  }

  public get projectId(): string {
    return this.props.projectId;
  }

  public get drmNumber(): string {
    return this.props.drmNumber;
  }
}
