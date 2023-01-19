import { NexoFileType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { NexoImportFile } from './nexoImportFile';

export interface INexoImportLogProps extends IAuditableProps {
  status: NexoImportStatus;
  files: NexoImportFile[];
}

export class NexoImportLog extends Auditable(AggregateRoot)<INexoImportLogProps> {
  public static create(props: INexoImportLogProps, id?: string): Result<NexoImportLog> {
    const guard = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guard, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<NexoImportLog>(guardResult);
    }
    const nexoImportLog = new NexoImportLog(props, id);
    return Result.ok<NexoImportLog>(nexoImportLog);
  }

  public static guard(props: INexoImportLogProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(NexoImportStatus)
      },
      {
        argument: props.files,
        argumentName: 'files',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([...guardBulkResult]);
  }

  public get status(): NexoImportStatus {
    return this.props.status;
  }

  public get files(): NexoImportFile[] {
    return this.props.files;
  }

  public get interventionSEFile(): NexoImportFile {
    return this.files.find(file => file.type === NexoFileType.INTERVENTIONS_SE);
  }

  public get interventionsBudgetSEFile(): NexoImportFile {
    return this.files.find(file => file.type === NexoFileType.INTERVENTIONS_BUDGET_SE);
  }

  public setStatus(status: NexoImportStatus) {
    this.props.status = status;
  }

  public addFile(file: NexoImportFile) {
    this.props.files.push(file);
    this.props.audit = Audit.fromUpdateContext(this.audit);
  }
}
