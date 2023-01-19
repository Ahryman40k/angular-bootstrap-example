import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';

export class BboxString extends GenericEntity<string> {
  public static guard(props: string, argumentName: string): IGuardResult {
    let guardLength = { succeeded: true };
    // conver bboxString in an array of numbers
    const bboxProps: number[] = props.split(',').map((x: string) => +x);
    if (bboxProps.length !== 4) {
      guardLength = Guard.error(argumentName, ErrorCodes.InvalidInput, `${argumentName} must have four positions`);
    }
    let guardValues = [{ succeeded: true }];
    if (guardLength.succeeded) {
      guardValues = bboxProps.map((prop, index) =>
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
