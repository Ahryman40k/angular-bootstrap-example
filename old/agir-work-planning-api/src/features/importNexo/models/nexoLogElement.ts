import { ModificationType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { enumValues } from '../../../utils/enumUtils';
import { NexoFileError } from './nexoFileError';

export interface INexoLogElementProps {
  importStatus: NexoImportStatus;
  modificationType: ModificationType;
  errors?: NexoFileError[];
}

export abstract class NexoLogElement<P extends INexoLogElementProps> extends AggregateRoot<P> {
  public static guard(props: INexoLogElementProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.importStatus,
        argumentName: 'importStatus',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(NexoImportStatus)
      },
      {
        argument: props.modificationType,
        argumentName: 'modificationType',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ModificationType)
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([...guardBulkResult]);
  }

  constructor(props: P, id: string) {
    super(props, id);
    if (isEmpty(props.errors)) {
      props.errors = [];
    }
  }

  public get importStatus(): NexoImportStatus {
    return this.props.importStatus;
  }

  public get modificationType(): ModificationType {
    return this.props.modificationType;
  }

  public get errors(): NexoFileError[] {
    return this.props.errors;
  }
}
