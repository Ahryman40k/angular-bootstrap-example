import { AggregateRoot } from '../../shared/domain/aggregateRoot';
import { Constructor } from '../../shared/domain/genericEntity';
import { Audit } from './audit';

export interface IAuditableProps {
  audit: Audit;
}

interface IAuditable {
  audit: Audit;
  setAudit(audit: Audit): void;
}

// tslint:disable:function-name
export function Auditable<T extends Constructor<AggregateRoot<IAuditableProps>>>(base: T): T & Constructor<IAuditable> {
  return class extends base {
    public get audit(): Audit {
      return this.props.audit;
    }

    public setAudit(audit: Audit): void {
      this.props.audit = audit;
    }
  };
}
