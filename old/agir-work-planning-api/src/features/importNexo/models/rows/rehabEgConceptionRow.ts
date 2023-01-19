import { AssetType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';
import { AuthorizedDateFormats } from '../../../../utils/moment/moment.enum';
import { ISheet2JSONOpts } from '../../../../utils/spreadsheets/spreadsheetsUtils';
import { ContractRange } from '../../../designData/models/designData';
import { NexoLogIntervention } from '../nexoLogIntervention';
import { INexoHeaders, minimalNexoRow, NexoRow, NO_ID_PROVIDED } from './nexoRow';

export const NO_PROJET = '16-IBG-PTI-003 ÉG';

export enum Presence {
  oui = 'Oui',
  non = 'Non'
}

export interface IRehabEgConceptionHeaders extends INexoHeaders {
  noProjet: string;
  noConduite: string;
  typeActifAmont: string;
  iDActifAmont: string;
  profondeurAmont: string;
  typeActifAval: string;
  iDActifAval: string;
  profondeurAval: string;
  nbrRacc: number;
  deformation: number;
  infiltration: string;
  infiltrationChainage: string;
  infiltrationIDDepart: string;
  obstruction: string;
  obstructionChainage: string;
  obstructionIDDepart: string;
  commentaire: string;
  plageContrat: string;
  dateMAJ: Date;
}

export class RehabEgConceptionRow extends NexoRow<IRehabEgConceptionHeaders> {
  public static create(props: IRehabEgConceptionHeaders): Result<RehabEgConceptionRow> {
    const guardResult = Guard.combine([NexoRow.guard(props), RehabEgConceptionRow.guard(props)]);
    if (!guardResult.succeeded) {
      const id = props.noProjet ? props.noProjet : NO_ID_PROVIDED;
      return Result.fail<RehabEgConceptionRow>(NexoRow.guardResultToNexoFileErrors(guardResult, props, id));
    }
    return Result.ok<RehabEgConceptionRow>(new RehabEgConceptionRow(props));
  }

  public static guard(props: IRehabEgConceptionHeaders): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.noProjet,
        argumentName: `noProjet`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.PREVENT_EMPTY_STRING]
      },
      {
        argument: props.noConduite,
        argumentName: `noConduite`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.PREVENT_EMPTY_STRING]
      },
      {
        argument: props.obstruction,
        argumentName: `obstruction`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(Presence)
      },
      {
        argument: props.infiltration,
        argumentName: `infiltration`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(Presence)
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

  public get noConduite(): string {
    return this.stringOrNull(this.props.noConduite);
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

  public get profondeurAmont(): string {
    return this.stringOrNull(this.props.profondeurAmont);
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

  public get profondeurAval(): string {
    return this.stringOrNull(this.props.profondeurAval);
  }

  public get nbrRacc(): number {
    return this.props.nbrRacc ? Number(this.props.nbrRacc) : null;
  }

  public get deformation(): number {
    return this.props.deformation ? Number(this.props.deformation) : null;
  }

  public get infiltration(): boolean {
    const infiltrationValue = this.stringOrNull(this.props.infiltration);
    return infiltrationValue ? infiltrationValue === Presence.oui : null;
  }

  public get infiltrationChainage(): string {
    return this.stringOrNull(this.props.infiltrationChainage);
  }

  public get infiltrationIDDepart(): string {
    return this.stringOrNull(this.props.infiltrationIDDepart);
  }

  public get obstruction(): boolean {
    const obstructionValue = this.stringOrNull(this.props.obstruction);
    return obstructionValue ? obstructionValue === Presence.oui : null;
  }

  public get obstructionChainage(): string {
    return this.stringOrNull(this.props.obstructionChainage);
  }

  public get obstructionIDDepart(): string {
    return this.stringOrNull(this.props.obstructionIDDepart);
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

export function getRehabEgConceptionToJSONOptions(opts?: ISheet2JSONOpts): ISheet2JSONOpts {
  return {
    dateNF: AuthorizedDateFormats.MILLISECONDS_WITH_SPACE,
    ...opts
  };
}

export const minimalRehabEgConceptionRow: IRehabEgConceptionHeaders = {
  ...minimalNexoRow,
  noProjet: NO_PROJET,
  noConduite: '5335238',
  dateMAJ: new Date('2012-12-17 00:00:00.000'),
  typeActifAmont: AssetType.chuteEgout,
  iDActifAmont: 'actifAmontId',
  profondeurAmont: '3,5',
  typeActifAval: AssetType.chuteEgout,
  iDActifAval: 'actifAvalId',
  profondeurAval: '2,8',
  commentaire: 'Un commentaire.',
  plageContrat: ContractRange.debut,
  nbrRacc: 4,
  deformation: 25,
  infiltration: Presence.oui,
  infiltrationChainage: "Possibilité d'infiltration à 32",
  infiltrationIDDepart: '5093027',
  obstruction: Presence.oui,
  obstructionChainage: 'Racines',
  obstructionIDDepart: '5040432'
};
