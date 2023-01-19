import { isEmpty } from 'lodash';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { IImportRelationRepository } from '../iImportRelationRepository';
import { IImportRelationCriterias, ImportRelationFindOptions } from '../models/importRelationFindOptions';
import { IImportRelationMongoDocument, ImportRelationModel } from './importRelationModel';
import { IImportRelation } from './projectImportRelationSchema';

class ImportRelationRepository
  extends BaseRepository<IImportRelation, IImportRelationMongoDocument, ImportRelationFindOptions>
  implements IImportRelationRepository {
  public get model(): ImportRelationModel {
    return this.db.models.ImportRelation;
  }

  // This case is specific as we use a $or instead of a $and for searching
  public async getMatchFromQueryParams(criterias: IImportRelationCriterias): Promise<any> {
    const queryCorrespondance: any = {
      id: '_id',
      bicProjectId: 'bicProjectId',
      bicProjectNumber: 'bicProjectNumber',
      projectId: 'projectId'
    };

    // Array of matches conditions
    const matches: any[] = [];
    if (!isEmpty(criterias)) {
      for (const criteriaKey of Object.keys(criterias)) {
        if (queryCorrespondance[criteriaKey]) {
          const match = { [queryCorrespondance[criteriaKey]]: criterias[criteriaKey] };
          if (match) {
            matches.push(match);
          }
        }
      }
    }
    return !isEmpty(matches)
      ? {
          $or: matches
        }
      : {};
  }
}
export const importRelationRepository: IImportRelationRepository = new ImportRelationRepository();
