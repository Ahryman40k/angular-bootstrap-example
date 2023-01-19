import { IBaseRepository } from '../../repositories/core/baseRepository';
import { ImportRelationFindOptions } from './models/importRelationFindOptions';
import { IImportRelation } from './mongo/projectImportRelationSchema';

// tslint:disable:no-empty-interface
export interface IImportRelationRepository extends IBaseRepository<IImportRelation, ImportRelationFindOptions> {}
