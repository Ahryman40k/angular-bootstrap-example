import { Injectable } from '@angular/core';
import {
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  ITaxonomy
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, get, isArray, isEmpty } from 'lodash';
import { UserService } from 'src/app/shared/user/user.service';
import { arrayUtils } from '../arrays/array.utils';
export type EntityType = 'INTERVENTION' | 'PROJECT' | 'PROGRAM_BOOK' | 'ANNUAL_PROGRAM';
export enum RestrictionType {
  EXECUTOR = 'EXECUTOR',
  REQUESTOR = 'REQUESTOR',
  BOROUGH = 'BOROUGH'
}
export type IRestriction = {
  [key in RestrictionType]?: string[];
};
export interface IRestrictionItem {
  entity: any;
  entityType: EntityType;
}
export const INTERVENTION_RESTRICTION_TYPES = [
  RestrictionType.BOROUGH,
  RestrictionType.EXECUTOR,
  RestrictionType.REQUESTOR
];
export const PROJECT_RESTRICTION_TYPES = [RestrictionType.BOROUGH, RestrictionType.EXECUTOR];
export const ANNUAL_PROGRAM_RESTRICTION_TYPES = [RestrictionType.EXECUTOR];
export const PROGRAM_BOOK_RESTRICTION_TYPES = [RestrictionType.BOROUGH];

@Injectable({
  providedIn: 'root'
})
export class UserRestrictionsService {
  constructor(private userService: UserService) {}
  /**
   * @param  {RestrictionType[]} restrictionTypes list of restrictionTypes to check (BOROUGH, REQUESTOR, EXECUTOR)
   * @param  {IRestriction} restrictions restrictions given from data (interventions, projects ...)
   * @returns true when all restritions are ok
   */
  public validate(items: IRestrictionItem[], typesToValidate?: RestrictionType[]): boolean {
    return items
      .filter(el => el.entity && el.entityType)
      .every(item => {
        const { types, restrictions } = this.getRestrictions(item.entity, item.entityType);
        return (typesToValidate ? typesToValidate : types).every(type => {
          return this.validateOneByType(restrictions, type);
        });
      });
  }

  public hasRestrictionOnType(type: RestrictionType): boolean {
    return !isEmpty(this.getUserRestrictionsByType(type));
  }

  // validate one type
  // return true when restrictions are valid for specific type
  public validateOneByType(restrictions: IRestriction, type: RestrictionType): boolean {
    const restrictionsByType = this.getRestrictionsByType(restrictions, type);
    const userRestrictionsByType = this.getUserRestrictionsByType(type);
    return (
      !this.hasRestrictionOnType(type) ||
      (!isEmpty(restrictionsByType) && arrayUtils.includes(userRestrictionsByType, restrictionsByType))
    );
  }

  // return mapped restrictions by type
  /* example ['anj']
   */
  private getRestrictionsByType(restrictions: IRestriction, type: RestrictionType): string[] {
    return this.mapRestrictions(get(restrictions, type, []));
  }

  // return mapped userRestrictions By type
  /* example {BOROUGH: ['anj'], EXECUTOR:['dre']}
   */
  private getUserRestrictionsByType(type: RestrictionType): string[] {
    return this.getRestrictionsByType(this.userService.restrictions, type);
  }

  // return values from entity to be validated
  /* example
   */
  private getRestrictions(
    entity: any,
    entityType: EntityType
  ): { types: RestrictionType[]; restrictions: IRestriction } {
    const entities = isArray(entity) ? entity : [entity];
    switch (entityType) {
      case 'INTERVENTION':
        const interventions = entities as IEnrichedIntervention[];
        return {
          restrictions: {
            BOROUGH: interventions.map(el => el.boroughId),
            EXECUTOR: interventions.map(el => el.executorId),
            REQUESTOR: interventions.map(el => el.requestorId)
          },
          types: INTERVENTION_RESTRICTION_TYPES
        };
      case 'PROJECT':
        const projects = entities as IEnrichedProject[];
        return {
          restrictions: {
            BOROUGH: projects.map(el => el.boroughId),
            EXECUTOR: projects.map(el => el.executorId)
          },
          types: PROJECT_RESTRICTION_TYPES
        };
      case 'PROGRAM_BOOK':
        const programBooks = entities as IEnrichedProgramBook[];
        return {
          restrictions: {
            BOROUGH: flatten(programBooks.map(el => el.boroughIds || []))
          },
          types: PROGRAM_BOOK_RESTRICTION_TYPES
        };
      case 'ANNUAL_PROGRAM':
        const annualPrograms = entities as IEnrichedAnnualProgram[];
        return {
          restrictions: {
            EXECUTOR: annualPrograms.map(el => el.executorId)
          },
          types: ANNUAL_PROGRAM_RESTRICTION_TYPES
        };
      default:
        break;
    }
  }

  // remove special caracters and return list with lowerCase
  // example: MTL => mtl
  private mapRestrictions(restrictions: string[]) {
    return (restrictions || []).map(el => {
      return this.mapRestriction(el);
    });
  }
  // remove special caracters and return list with lowerCase
  // example: MTL => mtl
  // map One value
  private mapRestriction(restriction: string): string {
    return (restriction || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  // return valid list based on user restrictions
  public filterTaxonomies(taxonomies: ITaxonomy[], type: RestrictionType): ITaxonomy[] {
    return taxonomies?.filter(el => {
      const userRestrictionsByType = this.getUserRestrictionsByType(type);
      return (
        !userRestrictionsByType?.length || this.getUserRestrictionsByType(type).includes(this.mapRestriction(el.code))
      );
    });
  }
}
