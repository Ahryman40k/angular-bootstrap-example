import { IGeometry, IPoint } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants } from '../../../../../config/constants';
import { AggregateRoot } from '../../../../shared/domain/aggregateRoot';
import { ExternalReferenceId } from '../../../../shared/domain/externalReferenceId/externalReferenceId';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IInfoRtuProject } from '../../../../shared/rtuImport/infoRtuProject';
import { Point } from '../../../geometry/models/point';
import { Phase } from './phase';
import { RtuContactProjectExport } from './rtuContactProjectExport';
import { IRtuProjectExportSummaryProps, RtuProjectExportSummary } from './rtuProjectExportSummary';
import { Status } from './status';
import { Type } from './type';

export enum RtuProjectExportStatus {
  SUCCESSFUL = 'successful',
  FAILURE = 'failure'
}

export interface IRtuProjectExportProps {
  exportStatus?: RtuProjectExportStatus;
  name?: string;
  description?: string;
  productionPb?: string;
  conflict?: string;
  duration?: string;
  district?: string;
  idOrganization?: string;
  nomOrganization?: string;
  noReference?: string;
  coordinate?: IPoint;
  status?: Status;
  geometry?: IGeometry;
  type?: Type;
  phase?: Phase;
  dateStart?: string | number;
  dateEnd?: string | number;
  dateEntry?: string | number;
  dateModification?: string | number;
  cancellationReason?: string;
  localization?: string;
  rueSur?: string;
  rueDe?: string;
  rueA?: string;
  infoRtuId?: string;
  externalReferenceIds?: ExternalReferenceId[];
  hasEditPermission?: boolean;
  contact?: RtuContactProjectExport;
}

export class RtuProjectExport extends AggregateRoot<IRtuProjectExportProps> {
  public static create(props: IRtuProjectExportProps, id: string): Result<RtuProjectExport> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<RtuProjectExport>(guardResult);
    }
    const rtuProjectExport = new RtuProjectExport(props, id);
    return Result.ok<RtuProjectExport>(rtuProjectExport);
  }

  public static guard(props: IRtuProjectExportProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.description,
        argumentName: 'description',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.idOrganization,
        argumentName: 'idOrganization',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.noReference,
        argumentName: 'noReference',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.district,
        argumentName: 'district',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.type,
        argumentName: 'type',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.phase,
        argumentName: 'phase',
        guardType: [GuardType.NULL_OR_UNDEFINED]
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
      argument: props.coordinate,
      argumentName: 'coordinate',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
    });
    if (guardGeometryPin.succeeded) {
      guardGeometryPin = Point.guard(props.coordinate, 'coordinate');
    }
    return Guard.combine([...guardBulkResult, guardGeometryPin]);
  }

  public static summaryFromResultError(
    result: Result<any>,
    projectId: string,
    summary: IRtuProjectExportSummaryProps
  ): RtuProjectExportSummary {
    const errorDetails = result.errorValue();
    const errorProject = RtuProjectExportSummary.create(
      {
        status: RtuProjectExportStatus.FAILURE,
        projectName: summary.projectName,
        streetName: summary.streetName,
        streetFrom: summary.streetFrom,
        streetTo: summary.streetTo,
        errorDetails
      },
      projectId
    );
    return errorProject.getValue();
  }

  public static toProjectExportSummary(
    projectId: string,
    summary: IRtuProjectExportSummaryProps
  ): RtuProjectExportSummary {
    const summaryProject = RtuProjectExportSummary.create(
      {
        status: RtuProjectExportStatus.SUCCESSFUL,
        projectName: summary.projectName,
        streetName: summary.streetName,
        streetFrom: summary.streetFrom,
        streetTo: summary.streetTo,
        infoRtuId: summary.infoRtuId,
        externalReferenceIds: summary.externalReferenceIds,
        errorDetails: []
      },
      projectId
    );
    return summaryProject.getValue();
  }

  public mapToInfoRtuApi(): IInfoRtuProject {
    return {
      id: this.infoRtuId,
      name: this.name,
      description: this.description,
      productionPb: this.productionPb,
      conflict: this.conflict,
      duration: this.duration,
      district: this.district,
      idOrganization: this.idOrganization,
      nomOrganization: this.nomOrganization,
      noReference: this.noReference,
      coordinate: {
        x: this.coordinate[0],
        y: this.coordinate[1]
      },
      contact: this.contact.mapToInfoRtuApi(),
      status: {
        name: this.status.name,
        description: this.status.description
      },
      type: {
        value: this.type.value,
        partnerId: this.type.partnerId,
        definition: this.type.definition
      },
      phase: {
        value: this.phase.value,
        definition: this.phase.definition
      },
      dateStart: this.dateStart ? this.dateStart.getTime() : null,
      dateEnd: this.dateEnd ? this.dateEnd.getTime() : null,
      dateEntry: this.dateEntry ? this.dateEntry.getTime() : null,
      dateModification: this.dateModification ? this.dateModification.getTime() : null,
      places: [
        {
          text: this.getPlacesText(),
          type: 'GEOJSON',
          sections: null,
          intersection: null,
          interval: null,
          polygon: null,
          address: null,
          geoJsonGeometry: JSON.stringify(this.geometry) as any
        }
      ],
      cancellationReason: this.cancellationReason,
      localization: this.localization,
      rueSur: this.rueSur,
      rueDe: this.rueDe,
      rueA: this.rueA,
      hasEditPermission: this.hasEditPermission
    };
  }

  public get exportStatus(): RtuProjectExportStatus {
    return this.props.exportStatus;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string {
    return this.props.description;
  }
  public get infoRtuId(): string {
    return this.props.infoRtuId;
  }
  public get district(): string {
    return this.props.district;
  }
  public get idOrganization(): string {
    return this.props.idOrganization;
  }
  public get nomOrganization(): string {
    return this.props.nomOrganization;
  }
  public get noReference(): string {
    return this.props.noReference;
  }
  public get coordinate(): IPoint {
    return this.props.coordinate;
  }
  public get geometry(): IGeometry {
    return this.props.geometry;
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
  public get rueSur(): string {
    return this.props.rueSur;
  }
  public get rueDe(): string {
    return this.props.rueDe;
  }
  public get rueA(): string {
    return this.props.rueA;
  }
  public get contact(): RtuContactProjectExport {
    return this.props.contact;
  }
  public get hasEditPermission(): boolean {
    return this.props.hasEditPermission;
  }
  public get status(): Status {
    return this.props.status;
  }
  public get type(): Type {
    return this.props.type;
  }
  public get phase(): Phase {
    return this.props.phase;
  }
  public get externalReferenceIds(): ExternalReferenceId[] {
    return this.props.externalReferenceIds;
  }

  private getPlacesText(): string {
    if (!this.rueSur) {
      return constants.strings.NA;
    }
    if (this.rueSur && this.rueDe && this.rueA) {
      return `Travaux sur ${this.rueSur}, de ${this.rueDe} à ${this.rueA}`;
    }
    return `Travaux sur ${this.rueSur}`;
  }
}
