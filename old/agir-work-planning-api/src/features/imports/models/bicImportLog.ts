import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { Auditable } from '../../audit/auditable';

export interface IBicImportLogProps {
  audit: Audit;
}

export class BicImportLog extends Auditable(AggregateRoot)<IBicImportLogProps> {
  public static create(props: IBicImportLogProps, id?: string): Result<BicImportLog> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<BicImportLog>(guard);
    }
    const bicImportLogs = new BicImportLog(props, id);
    return Result.ok<BicImportLog>(bicImportLogs);
  }

  public static guard(props: IBicImportLogProps): IGuardResult {
    return Audit.guard(props.audit);
  }

  public equals(bicImportLogs: BicImportLog): boolean {
    return super.equals(bicImportLogs);
  }
}
