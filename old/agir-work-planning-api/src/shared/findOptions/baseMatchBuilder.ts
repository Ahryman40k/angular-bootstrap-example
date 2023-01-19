import { isEmpty, isNil } from 'lodash';
import { Types } from 'mongoose';

import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { escapeRegex } from '../../utils/regexUtils';
import { appUtils } from '../../utils/utils';
import { ICriterias } from './findOptions';

export abstract class BaseMatchBuilder<C extends ICriterias> {
  protected readonly queryCorrespondence: any;
  protected abstract getMatch(criteriaKey: string, criteriaValue: any): Promise<any>;

  protected idsToObjectIds(ids: string[]) {
    let arrayIds: string[];
    if (ids instanceof Array) {
      arrayIds = ids;
    } else {
      arrayIds = convertStringOrStringArray(ids);
    }
    return arrayIds.map(id => {
      if (typeof id === 'string') {
        return Types.ObjectId(id);
      }
      return id;
    });
  }

  protected cleanUpCriterias(criterias: C): C {
    return criterias;
  }

  protected cleanUpDatesCriterias(criterias: C, dateCriteriaKeys: string[] = []): void {
    const keys = Object.keys(criterias);
    // remove from to if precise Year exists
    dateCriteriaKeys.forEach(year => {
      if (keys.includes(year)) {
        delete criterias[`from${appUtils.capitalizeFirstLetter(year)}`];
        delete criterias[`to${appUtils.capitalizeFirstLetter(year)}`];
      }
    });
  }

  protected getFreeQueryMatch(criteriaValue: string) {
    const regex = `.*${escapeRegex(criteriaValue)}.*`;
    return { $regex: regex, $options: 'i' };
  }

  protected getExternalIdsConstraint(criteriaValue: string): any[] {
    const searchValue = this.getFreeQueryMatch(criteriaValue);
    return [
      {
        externalReferenceIds: {
          $elemMatch: { value: searchValue }
        }
      }
    ];
  }

  protected async getOtherFilterConstraints(c: C): Promise<any[]> {
    return [];
  }
  /**
   * Received query have to exist in correspondence or else they're ignored
   * It builds a filter object with correct parameters according to queries
   * It accepts To or From for some queries but they're ignored
   * if a strict equal is specified.
   * return an object style query mongo to use in match or find
   * https://docs.mongodb.com/manual/reference/operator/aggregation/match/
   * @param query object coming from request.query
   */
  public async getMatchFromQueryParams(c: C): Promise<any> {
    let criterias = c;
    // Array of matches conditions
    let matches: any[] = [];
    if (!isEmpty(criterias)) {
      criterias = this.cleanUpCriterias(criterias);
      for (const criteriaKey of Object.keys(criterias)) {
        if (this.queryCorrespondence[criteriaKey]) {
          const match = await this.getMatch(criteriaKey, criterias[criteriaKey]);
          if (match) {
            matches.push(match);
          }
        }
      }
    }
    matches = [...matches, ...(await this.getOtherFilterConstraints(c)).filter(constraint => !isNil(constraint))];
    return !isEmpty(matches)
      ? {
          $and: matches
        }
      : {};
  }
}
