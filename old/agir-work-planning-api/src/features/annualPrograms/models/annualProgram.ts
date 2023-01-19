import { AnnualProgramStatus, Role } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { ProgramBook } from '../../programBooks/models/programBook';
import { annualProgramStateMachine } from '../annualProgramStateMachine';
import { IPlainAnnualProgramProps, PlainAnnualProgram } from './plainAnnualProgram';

// tslint:disable:no-empty-interface
export interface IAnnualProgramProps extends IPlainAnnualProgramProps, IAuditableProps {
  programBooks?: ProgramBook[];
  limitedAccess?: boolean;
}

export class AnnualProgram extends Auditable(PlainAnnualProgram)<IAnnualProgramProps> {
  public static create(props: IAnnualProgramProps, id?: string): Result<AnnualProgram> {
    const guardPlain = PlainAnnualProgram.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardAccess = Guard.guard({
      argument: props.limitedAccess,
      argumentName: 'limitedAccess',
      guardType: [GuardType.IS_BOOLEAN]
    });
    const guardResult = Guard.combine([guardPlain, guardAudit, guardAccess]);
    if (!guardResult.succeeded) {
      return Result.fail<AnnualProgram>(guardResult);
    }
    const annualProgram = new AnnualProgram(props, id);
    return Result.ok<AnnualProgram>(annualProgram);
  }

  public get programBooks(): ProgramBook[] {
    return this.props.programBooks;
  }

  public get limitedAccess(): boolean {
    return this.props.limitedAccess;
  }

  public isProgrammable(): boolean {
    const programmableStatuses = [AnnualProgramStatus.programming, AnnualProgramStatus.submittedFinal];
    return (
      programmableStatuses.includes(this.status) ||
      annualProgramStateMachine.isStateTransitionPossible(this.status, AnnualProgramStatus.programming)
    );
  }

  public setStatus(status: AnnualProgramStatus): void {
    this.props.status = status;
  }
  public setSharedRoles(sharedRoles: Role[]): void {
    this.props.sharedRoles = sharedRoles;
  }

  public setProgramBooks(programBooks: ProgramBook[]): void {
    this.props.programBooks = programBooks;
  }
}
