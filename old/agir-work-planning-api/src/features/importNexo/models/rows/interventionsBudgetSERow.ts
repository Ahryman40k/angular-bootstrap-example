import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { AuthorizedDateFormats } from '../../../../utils/moment/moment.enum';
import { ISheet2JSONOpts } from '../../../../utils/spreadsheets/spreadsheetsUtils';
import { appUtils } from '../../../../utils/utils';
import { NexoLogIntervention } from '../nexoLogIntervention';
import { NO_DOSSIER_SE } from './interventionsSERow';
import { INexoHeaders, minimalNexoRow, NexoRow, NO_ID_PROVIDED } from './nexoRow';

// Keys follows column order from interventionSE import file example
export interface IInterventionBudgetSEHeaders extends INexoHeaders {
  noDossierSE: string;
  annee: number;
  prevServPro: number;
  prevTravaux: number;
}

export class InterventionBudgetSERow extends NexoRow<IInterventionBudgetSEHeaders> {
  public static create(props: IInterventionBudgetSEHeaders): Result<InterventionBudgetSERow> {
    const guardResult = Guard.combine([NexoRow.guard(props), InterventionBudgetSERow.guard(props)]);
    if (!guardResult.succeeded) {
      const id = props.noDossierSE ? props.noDossierSE : NO_ID_PROVIDED;
      return Result.fail<InterventionBudgetSERow>(NexoRow.guardResultToNexoFileErrors(guardResult, props, id));
    }
    const interventionBudgetSERow = new InterventionBudgetSERow(props);
    return Result.ok<InterventionBudgetSERow>(interventionBudgetSERow);
  }

  public static guard(props: IInterventionBudgetSEHeaders): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.noDossierSE,
        argumentName: `noDossierSE`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.annee,
        argumentName: `annee`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_YEAR]
      },
      {
        argument: props.prevServPro,
        argumentName: `prevServPro`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.prevTravaux,
        argumentName: `prevTravaux`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get noDossierSE(): string {
    return this.props.noDossierSE;
  }
  public get annee(): number {
    return this.props.annee;
  }
  public get prevServPro(): number {
    return this.props.prevServPro;
  }
  public get prevTravaux(): number {
    return this.props.prevTravaux;
  }

  public toNexoLogIntervention(): NexoLogIntervention {
    return NexoLogIntervention.create(
      {
        ...this.toNexoLogElementProps(),
        lineNumber: this.lineNumber
      },
      this.noDossierSE
    ).getValue();
  }
}

export function getInterventionBudgetSESheetToJSONOptions(opts?: ISheet2JSONOpts): ISheet2JSONOpts {
  return {
    dateNF: AuthorizedDateFormats.MILLISECONDS_WITH_SPACE,
    ...opts
  };
}

export const minimalInterventionBudgetSE: IInterventionBudgetSEHeaders = {
  ...minimalNexoRow,
  noDossierSE: NO_DOSSIER_SE,
  annee: appUtils.getCurrentYear(),
  prevServPro: 0,
  prevTravaux: 100
};
