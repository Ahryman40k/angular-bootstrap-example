import { get, isEmpty } from 'lodash';

import { userService } from '../../services/userService';
import { includes } from '../../utils/arrayUtils';
import { mapRestrictions } from '../../utils/userRestrictionUtils';
import { IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';
import { IRestriction, RestrictionType } from './userRestriction';

export const INTERVENTION_RESTRICTION_TYPES = [
  RestrictionType.BOROUGH,
  RestrictionType.EXECUTOR,
  RestrictionType.REQUESTOR
];

export const PROJECT_RESTRICTION_TYPES = [RestrictionType.BOROUGH, RestrictionType.EXECUTOR];
export const OPPORTUNITY_NOTICE_RESTRICTION_TYPES = [
  RestrictionType.BOROUGH,
  RestrictionType.EXECUTOR,
  RestrictionType.REQUESTOR
];
export const ANNUAL_PROGRAM_RESTRICTION_TYPES = [RestrictionType.EXECUTOR];
export const PROGRAM_BOOK_RESTRICTION_TYPES = [RestrictionType.BOROUGH, RestrictionType.EXECUTOR];

export class RestrictionsValidator {
  /**
   * @param  {RestrictionType[]} restrictionTypes list of restrictionTypes to check (BOROUGH, REQUESTOR, EXECUTOR)
   * @param  {IRestriction} restrictions restrictions given from data (interventions, projects ...)
   * @returns Result
   */
  public static validate(restrictionTypes: RestrictionType[], restrictions: IRestriction): Result<IGuardResult> {
    const errors = restrictionTypes.find(type => {
      const userRestrictions = userService.restrictions;
      const userRestrictionsByType = mapRestrictions(get(userRestrictions, type));
      const restrictionsByType = mapRestrictions(get(restrictions, type));
      if (
        userRestrictionsByType.length &&
        (isEmpty(restrictionsByType) || !includes(restrictionsByType, userRestrictionsByType))
      ) {
        return true;
      }
      return false;
    });
    if (errors) {
      return Result.fail(`user have restriction on ${errors.toString()}`);
    }
    return Result.ok();
  }
}
