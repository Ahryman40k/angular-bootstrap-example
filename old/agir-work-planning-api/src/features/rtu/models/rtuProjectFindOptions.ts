import { IGeometry, IStringOrStringArray } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { BboxString } from '../../geometry/models/bboxString';

export interface IRtuProjectCriterias extends ICriterias {
  areaId?: IStringOrStringArray;
  partnerId?: IStringOrStringArray;
  rtuStatus?: IStringOrStringArray;
  phase?: IStringOrStringArray;
  fromDateStart?: string;
  fromDateEnd?: string;
  toDateStart?: string;
  toDateEnd?: string;
  bbox?: string;
  intersectGeometry?: IGeometry;
}

export interface IRtuProjectFindOptionsProps extends IFindOptionsProps {
  criterias: IRtuProjectCriterias;
}

export class RtuProjectFindOptions extends FindOptions<IRtuProjectFindOptionsProps> {
  public static create(props: IRtuProjectFindOptionsProps): Result<RtuProjectFindOptions> {
    const guard = RtuProjectFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RtuProjectFindOptions>(guard);
    }
    const constraintFindOptions = new RtuProjectFindOptions(props);
    return Result.ok<RtuProjectFindOptions>(constraintFindOptions);
  }

  public static guard(props: IRtuProjectFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = RtuProjectFindOptions.guardCriterias(props.criterias);
    if (props.criterias.bbox) {
      const guardBboxString = BboxString.guard(props.criterias.bbox, 'bbox');
      return Guard.combine([guardBasicCriteria, guardCriterias, guardBboxString]);
    }
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IRtuProjectCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.fromDateStart,
        argumentName: 'fromDateStart',
        guardType: [GuardType.VALID_DATE]
      },
      {
        argument: criterias.fromDateEnd,
        argumentName: 'fromDateEnd',
        guardType: [GuardType.VALID_DATE]
      },
      {
        argument: criterias.toDateStart,
        argumentName: 'toDateStart',
        guardType: [GuardType.VALID_DATE]
      },
      {
        argument: criterias.toDateEnd,
        argumentName: 'toDateEnd',
        guardType: [GuardType.VALID_DATE]
      },
      {
        argument: criterias.intersectGeometry,
        argumentName: `intersectGeometry`,
        guardType: [GuardType.VALID_GEOMETRY]
      }
    ];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}
