import { get } from 'lodash';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IRtuContactProjectMongoAttributes } from '../mongo/rtuProjectModel';
import { RtuImportError } from './rtuImportError';

export interface IRtuContactProjectProps {
  id?: string;
  officeId?: string;
  num?: string;
  prefix?: string;
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  phoneExtensionNumber?: string;
  cell?: string;
  fax?: string;
  typeNotfc?: string;
  paget?: string;
  profile?: string;
  globalRole?: string;
  idInterim?: string;
  inAutoNotification?: string;
  inDiffusion?: string;
  areaName?: string;
  role?: string;
  partnerType?: string;
  partnerId?: string;
}

export class RtuContactProject extends AggregateRoot<IRtuContactProjectProps> {
  public static create(props: IRtuContactProjectProps, id?: string): Result<RtuContactProject> {
    // Guard id
    let guardResult = Guard.guard({
      argument: id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
    });

    const guardProps = this.guard(props);
    guardResult = Guard.combine([guardResult, guardProps]);

    if (!guardResult.succeeded) {
      const convertedGuardResult = guardResult.failures.map(failure =>
        RtuImportError.fromGuardError(failure, { value1: get(props, failure.target) })
      );
      return Result.fail<RtuContactProject>(convertedGuardResult);
    }
    const rtuContactProject = new RtuContactProject(props, id);
    return Result.ok<RtuContactProject>(rtuContactProject);
  }

  public static guard(props: IRtuContactProjectProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.officeId,
        argumentName: 'officeId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.num,
        argumentName: 'num',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.prefix,
        argumentName: 'prefix',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.email,
        argumentName: 'email',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.phone,
        argumentName: 'phone',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([...guardBulkResult]);
  }

  public static async toDomainModel(raw: IRtuContactProjectMongoAttributes): Promise<RtuContactProject> {
    return RtuContactProject.create(
      {
        officeId: raw.officeId,
        num: raw.num,
        prefix: raw.prefix,
        name: raw.name,
        title: raw.title,
        email: raw.email,
        phone: raw.phone,
        phoneExtensionNumber: raw.phoneExtensionNumber,
        cell: raw.cell,
        fax: raw.fax,
        typeNotfc: raw.typeNotfc,
        paget: raw.paget,
        profile: raw.profile,
        globalRole: raw.globalRole,
        idInterim: raw.idInterim,
        inAutoNotification: raw.inAutoNotification,
        inDiffusion: raw.inDiffusion,
        areaName: raw.areaName,
        role: raw.role,
        partnerType: raw.partnerType,
        partnerId: raw.partnerId
      },
      raw._id
    ).getValue();
  }

  public static toPersistance(rtuContactProject: RtuContactProject): IRtuContactProjectMongoAttributes {
    return {
      _id: rtuContactProject.id,
      officeId: rtuContactProject.officeId,
      num: rtuContactProject.num,
      prefix: rtuContactProject.prefix,
      name: rtuContactProject.name,
      title: rtuContactProject.title,
      email: rtuContactProject.email,
      phone: rtuContactProject.phone,
      phoneExtensionNumber: rtuContactProject.phoneExtensionNumber,
      cell: rtuContactProject.cell,
      fax: rtuContactProject.fax,
      typeNotfc: rtuContactProject.typeNotfc,
      paget: rtuContactProject.paget,
      profile: rtuContactProject.profile,
      globalRole: rtuContactProject.globalRole,
      idInterim: rtuContactProject.idInterim,
      inAutoNotification: rtuContactProject.inAutoNotification,
      inDiffusion: rtuContactProject.inDiffusion,
      areaName: rtuContactProject.areaName,
      role: rtuContactProject.role,
      partnerType: rtuContactProject.partnerType,
      partnerId: rtuContactProject.partnerId
    };
  }

  public get officeId(): string {
    return this.props.officeId;
  }
  public get num(): string {
    return this.props.num;
  }
  public get prefix(): string {
    return this.props.prefix;
  }
  public get name(): string {
    return this.props.name;
  }
  public get title(): string {
    return this.props.title;
  }
  public get email(): string {
    return this.props.email;
  }
  public get phone(): string {
    return this.props.phone;
  }
  public get phoneExtensionNumber(): string {
    return this.props.phoneExtensionNumber;
  }
  public get cell(): string {
    return this.props.cell;
  }
  public get fax(): string {
    return this.props.fax;
  }
  public get typeNotfc(): string {
    return this.props.typeNotfc;
  }
  public get paget(): string {
    return this.props.paget;
  }
  public get profile(): string {
    return this.props.profile;
  }
  public get globalRole(): string {
    return this.props.globalRole;
  }
  public get idInterim(): string {
    return this.props.idInterim;
  }
  public get inAutoNotification(): string {
    return this.props.inAutoNotification;
  }
  public get inDiffusion(): string {
    return this.props.inDiffusion;
  }
  public get areaName(): string {
    return this.props.areaName;
  }
  public get role(): string {
    return this.props.role;
  }
  public get partnerType(): string {
    return this.props.partnerType;
  }
  public get partnerId(): string {
    return this.props.partnerId;
  }
}
