import { Pipe, PipeTransform } from '@angular/core';
import { IRestrictionItem, RestrictionType, UserRestrictionsService } from '../user/user-restrictions.service';

@Pipe({ name: 'appRestrictions', pure: false })
export class UserRestrictionsPipe implements PipeTransform {
  constructor(private readonly userRestrictionsService: UserRestrictionsService) {}
  // it could be IEnrichedIntervention, IEnrichedProject ...
  public transform(items: IRestrictionItem[], typesToValidate?: RestrictionType[]): boolean {
    return this.userRestrictionsService.validate(items, typesToValidate);
  }
}
