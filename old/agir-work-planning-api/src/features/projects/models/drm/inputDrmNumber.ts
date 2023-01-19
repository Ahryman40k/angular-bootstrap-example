import { IInputDrmProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { GenericEntity } from '../../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IInputDrmProjectProps extends IInputDrmProject {}

export class InputDrmProject<P extends IInputDrmProjectProps> extends GenericEntity<P> {
  public static create(props: IInputDrmProjectProps): Result<InputDrmProject<IInputDrmProjectProps>> {
    if (!props) {
      return Result.fail<InputDrmProject<IInputDrmProjectProps>>(`Empty body`);
    }
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<InputDrmProject<IInputDrmProjectProps>>(guard);
    }
    const inputDrmProject = new InputDrmProject(props);
    return Result.ok<InputDrmProject<IInputDrmProjectProps>>(inputDrmProject);
  }

  public get projectIds(): string[] {
    return this.props.projectIds;
  }

  public get isCommonDrmNumber(): boolean {
    return this.props.isCommonDrmNumber;
  }

  public static guard(props: IInputDrmProjectProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.projectIds,
        argumentName: 'projectIds',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ARRAY]
      },
      {
        argument: props.isCommonDrmNumber,
        argumentName: 'isCommonDrmNumber',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_BOOLEAN]
      }
    ];
    let guardProjectIds: IGuardResult[] = [{ succeeded: true }];
    if (!isEmpty(props.projectIds)) {
      guardProjectIds = props.projectIds.map((projectId, index) =>
        Guard.guard({
          argument: projectId,
          argumentName: `projectIds[${index}]`,
          guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
        })
      );
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardProjectIds]);
  }
}
