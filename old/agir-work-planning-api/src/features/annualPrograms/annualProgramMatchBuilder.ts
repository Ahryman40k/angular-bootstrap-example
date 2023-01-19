import { Permission } from '@villemontreal/agir-work-planning-lib';
import { isEmpty, isNil } from 'lodash';

import { userService } from '../../services/userService';
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { appUtils } from '../../utils/utils';
import { programBookRepository } from '../programBooks/mongo/programBookRepository';
import { IAnnualProgramCriterias } from './models/annualProgramFindOptions';

class AnnualProgramMatchBuilder extends BaseMatchBuilder<IAnnualProgramCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    year: 'year',
    fromYear: 'year',
    toYear: 'year',
    executorId: 'executorId',
    status: 'status'
  };

  protected async getOtherFilterConstraints(criterias: IAnnualProgramCriterias): Promise<any[]> {
    return [await this.getSharedRolesFilter(criterias.id)];
  }

  // tslint:disable:cyclomatic-complexity
  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case '_id':
      case 'id':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      case 'year':
        return { [this.queryCorrespondence[criteriaKey]]: appUtils.parseInt(criteriaValue) };
      case 'fromYear':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $gte: appUtils.parseInt(criteriaValue)
          }
        };
      case 'toYear':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $lte: appUtils.parseInt(criteriaValue)
          }
        };
      case 'executorId':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
      default:
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }

  private async getSharedRolesFilter(annualProgramId: string): Promise<any> {
    const user = userService.currentUser;
    if (user.hasPermission(Permission.ANNUAL_PROGRAM_READ_ALL)) {
      return undefined;
    }
    let annualProgramIdsByAuthorizedProgramBooks = await programBookRepository.distinct('annualProgramId', {
      sharedRoles: { $in: user.roles }
    });
    if (!isEmpty(annualProgramId)) {
      const notAlreadyExists = convertStringOrStringArray(annualProgramId)
        .map(id => {
          if (!annualProgramIdsByAuthorizedProgramBooks.includes(id)) {
            return id;
          }
          return null;
        })
        .filter(value => !isNil(value));
      annualProgramIdsByAuthorizedProgramBooks = [...annualProgramIdsByAuthorizedProgramBooks, ...notAlreadyExists];
    }
    const orConstraints: any[] = [
      {
        sharedRoles: { $in: user.roles }
      }
    ];
    if (!isEmpty(annualProgramIdsByAuthorizedProgramBooks)) {
      orConstraints.push({
        _id: {
          $in: annualProgramIdsByAuthorizedProgramBooks
        }
      });
    }

    return {
      $or: orConstraints
    };
  }
}

export const annualProgramMatchBuilder = new AnnualProgramMatchBuilder();
