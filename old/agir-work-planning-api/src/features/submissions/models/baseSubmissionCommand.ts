import { Command } from '../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument } from '../../../shared/logic/guard';

export interface IBaseSubmissionCommandProps {
  submissionNumber: string;
}

export abstract class BaseSubmissionCommand<P extends IBaseSubmissionCommandProps> extends Command<P> {
  public static guard(props: IBaseSubmissionCommandProps) {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.submissionNumber,
        argumentName: 'submissionNumber',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_SUBMISSION_NUMBER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get submissionNumber(): string {
    return this.props.submissionNumber;
  }
}
