import { IProjectPaginatedSearchRequest, IUuidOrUuidArray, ProjectStatus } from '@villemontreal/agir-work-planning-lib';
import { get, isEmpty } from 'lodash';

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';
import { enumValues } from '../../../utils/enumUtils';
import { RtuExportLog } from '../../rtu/models/rtuExportLog';

// tslint:disable:no-empty-interface
export interface IProjectCriterias extends IProjectPaginatedSearchRequest, ICriterias {
  cancelAtInfoRtu?: boolean;
  documentId?: string;
  drmNumbers?: string[];
  excludeIds?: string | string[];
  excludeProgramBookIds?: IUuidOrUuidArray;
  excludeImportBic?: boolean;
  exportRtu?: RtuExportLog;
  interventionIds?: string | string[];
  nexoReferenceNumber?: string[];
  isGeolocated?: boolean;
}

export interface IProjectFindOptionsProps extends IFindOptionsProps {
  criterias: IProjectCriterias;
}

export class ProjectFindOptions extends FindOptions<IProjectFindOptionsProps> {
  public static create(props: IProjectFindOptionsProps): Result<ProjectFindOptions> {
    const guard = ProjectFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProjectFindOptions>(guard);
    }
    this.setDefaultCriterias(props);
    const projectFindOptions = new ProjectFindOptions(props);
    return Result.ok<ProjectFindOptions>(projectFindOptions);
  }

  public static guard(props: IProjectFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    let guardIds = [{ succeeded: true }];
    if (get(props, 'criterias.id')) {
      guardIds = this.guardIds(convertStringOrStringArray(props.criterias.id));
    }

    const guardCriterias = ProjectFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, ...guardIds, guardCriterias]);
  }

  private static setDefaultCriterias(props: IProjectFindOptionsProps) {
    if (!props.criterias) {
      props.criterias = {};
    }
    if (!props.criterias.status) {
      props.criterias.status = this.getDefaultStatuses();
    }
  }

  public static getDefaultStatuses(): ProjectStatus[] {
    return enumValues(ProjectStatus);
  }

  private static guardCriterias(criterias: IProjectCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [];
    let guardInterventionIds = [{ succeeded: true }];
    if (!isEmpty(criterias.interventionIds)) {
      guardInterventionIds = convertStringOrStringArray(criterias.interventionIds).map((interventionId, index) =>
        Guard.guard({
          argument: interventionId,
          argumentName: `interventionIds[${index}]`,
          guardType: [GuardType.VALID_INTERVENTION_ID]
        })
      );
    }
    let guardIntersectGeometry = { succeeded: true };
    if (!isEmpty(criterias.intersectGeometry)) {
      guardIntersectGeometry = Guard.guard({
        argument: criterias.intersectGeometry,
        argumentName: `intersectGeometry`,
        guardType: [GuardType.VALID_GEOMETRY]
      });
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardInterventionIds, guardIntersectGeometry]);
  }

  protected static guardIds(ids: string[]): IGuardResult[] {
    return ids.map((id, index) =>
      Guard.guard({
        argument: id,
        argumentName: `id[${index}]`,
        guardType: [GuardType.VALID_PROJECT_ID]
      })
    );
  }
}
