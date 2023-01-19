import { IEnrichedUserPreference } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IBaseRepository } from '../../repositories/core/baseRepository';
import { UserPreferenceFindOptions } from './models/userPreferenceFindOptions';

// tslint:disable:no-empty-interface
export interface IUserPreferenceRepository
  extends IBaseRepository<IEnrichedUserPreference, UserPreferenceFindOptions> {}
