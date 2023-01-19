import { AssetType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';
import { AuthorizedDateFormats } from '../../../../utils/moment/moment.enum';
import { ISheet2JSONOpts } from '../../../../utils/spreadsheets/spreadsheetsUtils';
import { ContractRange } from '../../../designData/models/designData';
import { NexoLogIntervention } from '../nexoLogIntervention';
import { INexoHeaders, minimalNexoRow, NexoRow, NO_ID_PROVIDED } from './nexoRow';

export const NO_PROJET = '17-PMR-PTI-035';

export interface IRehabAqConceptionHeaders extends INexoHeaders {
  noProjet: string;
  typeActifAmont: string;
  iDActifAmont: string;
  typeActifAval: string;
  iDActifAval: string;
  commentaire: string;
  plageContrat: string;
  dateMAJ: Date;
}

export class RehabAqConceptionRow extends NexoRow<IRehabAqConceptionHeaders> {
  public static create(props: IRehabAqConceptionHeaders): Result<RehabAqConceptionRow> {
    const guardResult = Guard.combine([NexoRow.guard(props), RehabAqConceptionRow.guard(props)]);
    if (!guardResult.succeeded) {
      const id = props.noProjet ? props.noProjet : NO_ID_PROVIDED;
      return Result.fail<RehabAqConceptionRow>(NexoRow.guardResultToNexoFileErrors(guardResult, props, id));
    }
    const rehabiliationAqueducsRow = new RehabAqConceptionRow(props);
    return Result.ok<RehabAqConceptionRow>(rehabiliationAqueducsRow);
  }

  public static guard(props: IRehabAqConceptionHeaders): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.noProjet,
        argumentName: `noProjet`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.PREVENT_EMPTY_STRING]
      },
      {
        argument: props.plageContrat,
        argumentName: `plageContrat`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ContractRange)
      },
      {
        argument: props.dateMAJ,
        argumentName: `dateMAJ`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get noProjet(): string {
    return this.stringOrNull(this.props.noProjet);
  }

  public get typeActifAmont(): string {
    return this.stringOrNull(this.props.typeActifAmont);
  }

  public set typeActifAmont(type: string) {
    this.props.typeActifAmont = type;
  }

  public get idActifAmont(): string {
    return this.stringOrNull(this.props.iDActifAmont);
  }

  public get typeActifAval(): string {
    return this.stringOrNull(this.props.typeActifAval);
  }

  public set typeActifAval(type: string) {
    this.props.typeActifAval = type;
  }

  public get idActifAval(): string {
    return this.stringOrNull(this.props.iDActifAval);
  }

  public get commentaire(): string {
    return this.stringOrNull(this.props.commentaire);
  }

  public get plageContrat(): string {
    return this.stringOrNull(this.props.plageContrat);
  }

  public get dateMAJ(): Date {
    return new Date(this.props.dateMAJ);
  }

  public toNexoLogIntervention(): NexoLogIntervention {
    return NexoLogIntervention.create(
      {
        ...this.toNexoLogElementProps(),
        lineNumber: this.lineNumber
      },
      this.noProjet
    ).getValue();
  }
}

export function getRehabAqConceptionToJSONOptions(opts?: ISheet2JSONOpts): ISheet2JSONOpts {
  return {
    dateNF: AuthorizedDateFormats.MILLISECONDS_WITH_SPACE,
    ...opts
  };
}

export const minimalRehabAqConceptionRow: IRehabAqConceptionHeaders = {
  ...minimalNexoRow,
  noProjet: NO_PROJET,
  dateMAJ: new Date('2012-12-17 00:00:00.000'),
  typeActifAmont: AssetType.aqueductValve,
  iDActifAmont: 'actifAmontId',
  typeActifAval: AssetType.aqueductValve,
  iDActifAval: 'actifAvalId',
  commentaire: 'Un commentaire.',
  plageContrat: ContractRange.debut
};
