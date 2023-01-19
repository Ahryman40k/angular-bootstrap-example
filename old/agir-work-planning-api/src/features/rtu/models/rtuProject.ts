import { IGeometry, IPoint } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get } from 'lodash';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { Point } from '../../geometry/models/point';
import { RtuContactProject } from './rtuContactProject';
import { RtuImportError } from './rtuImportError';
import { RtuProjectError } from './rtuProjectError';

export interface IRtuProjectProps extends IAuditableProps {
  name?: string;
  description?: string;
  areaId?: string;
  partnerId?: string;
  noReference?: string;
  geometryPin?: IPoint;
  geometry?: IGeometry;
  status?: string;
  type?: string;
  phase?: string;
  dateStart?: string | number;
  dateEnd?: string | number;
  dateEntry?: string | number;
  dateModification?: string | number;
  cancellationReason?: string;
  productionPb?: string;
  conflict?: string;
  duration?: string;
  localization?: string;
  streetName?: string;
  streetFrom?: string;
  streetTo?: string;
  contact?: RtuContactProject;
}

export class RtuProject extends Auditable(AggregateRoot)<IRtuProjectProps> {
  public static create(props: IRtuProjectProps, id: string): Result<RtuProject> {
    // Guard id
    const guardId = Guard.guard({
      argument: id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
    });
    const guardProps = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardId, guardProps, guardAudit]);
    if (!guardResult.succeeded) {
      const convertedGuardResult = guardResult.failures.map(failure =>
        RtuImportError.fromGuardError(failure, { value1: get(props, failure.target) })
      );
      return Result.fail<RtuProject>(convertedGuardResult);
    }
    const rtuProject = new RtuProject(props, id);
    return Result.ok<RtuProject>(rtuProject);
  }

  public static guard(props: IRtuProjectProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.areaId,
        argumentName: 'areaId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.partnerId,
        argumentName: 'partnerId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.noReference,
        argumentName: 'noReference',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.type,
        argumentName: 'type',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.phase,
        argumentName: 'phase',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.dateStart,
        argumentName: 'dateStart',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      },
      {
        argument: props.dateEnd,
        argumentName: 'dateEnd',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      },
      {
        argument: props.dateEntry,
        argumentName: 'dateEntry',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    let guardGeometryPin = Guard.guard({
      argument: props.geometryPin,
      argumentName: 'geometryPin',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
    });
    if (guardGeometryPin.succeeded) {
      guardGeometryPin = Point.guard(props.geometryPin, 'geometryPin');
    }
    return Guard.combine([...guardBulkResult, guardGeometryPin]);
  }

  public static fromResultError(
    result: Result<any>,
    projectId: string,
    projectNoReference: string,
    projectName: string,
    streetName: string,
    streetFrom: string,
    streetTo: string
  ): RtuProjectError {
    const errorDetails = result.errorValue();
    const errorProject = RtuProjectError.create({
      projectId,
      projectNoReference,
      projectName,
      streetName,
      streetFrom,
      streetTo,
      errorDetails
    });
    return errorProject.getValue();
  }
  public get name(): string {
    return this.props.name;
  }
  public get description(): string {
    return this.props.description;
  }
  public get areaId(): string {
    return this.props.areaId;
  }
  public get partnerId(): string {
    return this.props.partnerId;
  }
  public get noReference(): string {
    return this.props.noReference;
  }
  public get geometryPin(): IPoint {
    return this.props.geometryPin;
  }
  public get geometry(): IGeometry {
    return this.props.geometry;
  }
  public get status(): string {
    return this.props.status;
  }
  public get type(): string {
    return this.props.type;
  }
  public get phase(): string {
    return this.props.phase;
  }
  public get dateStart(): Date {
    return new Date(this.props.dateStart);
  }
  public get dateEnd(): Date {
    return new Date(this.props.dateEnd);
  }
  public get dateEntry(): Date {
    return new Date(this.props.dateEntry);
  }
  public get dateModification(): Date {
    return this.props.dateModification ? new Date(this.props.dateModification) : undefined;
  }
  public get cancellationReason(): string {
    return this.props.cancellationReason;
  }
  public get productionPb(): string {
    return this.props.productionPb;
  }
  public get conflict(): string {
    return this.props.conflict;
  }
  public get duration(): string {
    return this.props.duration;
  }
  public get localization(): string {
    return this.props.localization;
  }
  public get streetName(): string {
    return this.props.streetName;
  }
  public get streetFrom(): string {
    return this.props.streetFrom;
  }
  public get streetTo(): string {
    return this.props.streetTo;
  }
  public get contact(): RtuContactProject {
    return this.props.contact;
  }
}
