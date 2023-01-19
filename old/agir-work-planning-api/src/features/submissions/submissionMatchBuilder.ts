import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { ISubmissionCriterias } from './models/submissionFindOptions';

class SubmissionMatchBuilder extends BaseMatchBuilder<ISubmissionCriterias> {
  protected readonly queryCorrespondence = {
    submissionNumber: '_id',
    id: '_id',
    drmNumber: 'drmNumber',
    programBookId: 'programBookId',
    projectIds: 'projectIds',
    status: 'status',
    progressStatus: 'progressStatus'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'projectIds':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $elemMatch: {
              $in: convertStringOrStringArray(criteriaValue)
            }
          }
        };
      case 'programBookId':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      case 'submissionNumber':
      case 'drmNumber':
      case 'status':
      default:
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }
}

export const submissionMatchBuilder = new SubmissionMatchBuilder();
