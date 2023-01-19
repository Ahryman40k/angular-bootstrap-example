import { IInterventionPaginatedSearchRequest, InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { get, isEmpty } from 'lodash';

import { IExternalReferenceIdProps } from '../../../shared/domain/externalReferenceId/externalReferenceId';
import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IInterventionCriterias extends IInterventionPaginatedSearchRequest, ICriterias {
  id?: any; // TODO in lib id should be a string or a string[]
  assetId?: string | string[];
  assetExternalReferenceIds?: IExternalReferenceIdProps[];
  documentId?: string;
  nexoReferenceNumber?: string[];
  excludeIds?: string[];
  projectId?: string | string[];
}

export interface IInterventionFindOptionsProps extends IFindOptionsProps {
  criterias: IInterventionCriterias;
}

export class InterventionFindOptions extends FindOptions<IInterventionFindOptionsProps> {
  public static create(props: IInterventionFindOptionsProps): Result<InterventionFindOptions> {
    const guard = InterventionFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<InterventionFindOptions>(guard);
    }
    this.setDefaultValues(props);
    const interventionFindOptions = new InterventionFindOptions(props);
    return Result.ok<InterventionFindOptions>(interventionFindOptions);
  }

  public static guard(props: IInterventionFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    let guardIds = [{ succeeded: true }];
    if (get(props, 'criterias.id')) {
      const ids = Array.isArray(props.criterias.id) ? props.criterias.id : [props.criterias.id];
      guardIds = this.guardIds(ids);
    }
    const guardCriterias = InterventionFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, ...guardIds, guardCriterias]);
  }

  private static guardCriterias(criterias: IInterventionCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    let guardIntersectGeometry = { succeeded: true };
    if (!isEmpty(criterias.intersectGeometry)) {
      guardIntersectGeometry = Guard.guard({
        argument: criterias.intersectGeometry,
        argumentName: `intersectGeometry`,
        guardType: [GuardType.VALID_GEOMETRY]
      });
    }
    const guardBulk: IGuardArgument[] = [];
    return Guard.combine([...Guard.guardBulk(guardBulk), guardIntersectGeometry]);
  }

  public static setDefaultValues(props: IInterventionFindOptionsProps) {
    this.setDefaultCriterias(props);
  }

  private static setDefaultCriterias(props: IInterventionFindOptionsProps) {
    if (!props.criterias) {
      props.criterias = {};
    }
    if (!props.criterias.status) {
      props.criterias.status = this.getDefaultStatuses();
    }
  }

  public static getDefaultStatuses(): InterventionStatus[] {
    const defaultExcludedStatuses = [InterventionStatus.canceled, InterventionStatus.refused];
    return (enumValues(InterventionStatus) as InterventionStatus[]).filter(
      (value: InterventionStatus) => !defaultExcludedStatuses.includes(value)
    );
  }

  protected static guardIds(ids: string[]): IGuardResult[] {
    return ids.map((id, index) =>
      Guard.guard({
        argument: id,
        argumentName: `id[${index}]`,
        guardType: [GuardType.VALID_INTERVENTION_ID]
      })
    );
  }
}
