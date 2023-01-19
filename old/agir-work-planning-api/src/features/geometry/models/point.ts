import { ErrorCodes, IPoint } from '@villemontreal/agir-work-planning-lib/dist/src';
import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';

// tslint:disable:no-empty-interface
export interface IPointProps extends IPoint {}

export class Point extends GenericEntity<IPointProps> {
  public static guard(props: IPointProps, argumentName: string): IGuardResult {
    let guardLength = { succeeded: true };
    // actually IPointProps is an array of number
    const pointProps: number[] = props;
    if (pointProps.length !== 2) {
      guardLength = Guard.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} must have two positions`);
    }
    let guardValues = [{ succeeded: true }];
    if (guardLength.succeeded) {
      guardValues = pointProps.map((prop, index) =>
        Guard.guard({
          argument: prop[index],
          argumentName: `position[${index}]`,
          guardType: [GuardType.VALID_NUMBER]
        })
      );
    }
    return Guard.combine([guardLength, ...guardValues]);
  }
}
