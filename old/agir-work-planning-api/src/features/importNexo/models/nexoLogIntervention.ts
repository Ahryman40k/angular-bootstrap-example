import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { INexoLogInterventionAttributes } from '../mongo/nexoImportLogModel';
import { NexoFileError } from './nexoFileError';
import { INexoLogElementProps, NexoLogElement } from './nexoLogElement';

export interface INexoLogInterventionProps extends INexoLogElementProps {
  lineNumber: number;
}

export class NexoLogIntervention extends NexoLogElement<INexoLogInterventionProps> {
  public static create(props: INexoLogInterventionProps, id: string): Result<NexoLogIntervention> {
    const guardPlain = NexoLogElement.guard(props);
    const guardResult = Guard.combine([guardPlain]);
    if (!guardResult.succeeded) {
      return Result.fail<NexoLogIntervention>(guardResult);
    }
    const nexoLogIntervention = new NexoLogIntervention(props, id);
    return Result.ok<NexoLogIntervention>(nexoLogIntervention);
  }

  public static guard(props: INexoLogInterventionProps): IGuardResult {
    const guardLogElement = NexoLogElement.guard(props);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.lineNumber,
        argumentName: 'lineNumber',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_POSITIVE_INTEGER]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([guardLogElement, ...guardBulkResult]);
  }

  public static async toDomainModel(raw: INexoLogInterventionAttributes): Promise<NexoLogIntervention> {
    const errors = await Promise.all(raw.elementErrors.map(async error => NexoFileError.toDomainModel(error)));
    return NexoLogIntervention.create(
      {
        lineNumber: raw.lineNumber,
        importStatus: raw.importStatus,
        modificationType: raw.modificationType,
        errors
      },
      raw.id
    ).getValue();
  }

  public static toPersistance(nexoLogIntervention: NexoLogIntervention): INexoLogInterventionAttributes {
    return {
      id: nexoLogIntervention.id,
      importStatus: nexoLogIntervention.importStatus,
      modificationType: nexoLogIntervention.modificationType,
      lineNumber: nexoLogIntervention.lineNumber,
      elementErrors: nexoLogIntervention.errors.map(error => NexoFileError.toPersistance(error))
    };
  }

  public get lineNumber(): number {
    return this.props.lineNumber;
  }
}
