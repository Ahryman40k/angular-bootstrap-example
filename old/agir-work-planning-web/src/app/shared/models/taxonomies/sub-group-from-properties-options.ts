import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';

export interface ISubGroupFromPropertiesOptions {
  dependencyObservable: Observable<string>;
  destroyEvent: Observable<unknown>;
  dependencyGroup: TaxonomyGroup;
  relationGroup: TaxonomyGroup;
  relationSelector: (properties: any) => string[];
}
