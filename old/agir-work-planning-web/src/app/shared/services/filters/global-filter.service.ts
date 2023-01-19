import { Injectable } from '@angular/core';
import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, get, isEmpty, isEqual, isNil, omitBy, pick } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, take } from 'rxjs/operators';

import { IDistanceFilter } from '../../models/filters/distance-filter';
import { IGlobalFilter } from '../../models/filters/global-filter';
import { GlobalFilterShownElement } from '../../models/filters/global-filter-shown-element';
import { enumValues } from '../../utils/utils';
import { TaxonomiesService } from '../taxonomies.service';
import { UserLocalStorageService } from '../user-local-storage.service';

const DEFAULT_GLOBAL_FILTER_DISTANCE = 200;
const MIN_GLOBAL_FILTER_DISTANCE = 50;
const MAX_GLOBAL_FILTER_DISTANCE = 500;
export const GLOBAL_FILTER_DEBOUNCE = 200;

export interface IGlobalFilterConfig {
  distance: { min: number; max: number };
}

const distanceFilterStorageKey = 'distance-filter-storage-key';
const globalFilterStorageKey = 'global-filter-service-key';

@Injectable({
  providedIn: 'root'
})
export class GlobalFilterService {
  public get defaultFilter(): IGlobalFilter {
    return this.defaultFilterSubject.getValue();
  }

  public get filter(): IGlobalFilter {
    return this.filterSubject.value;
  }

  public set filter(value: IGlobalFilter) {
    if (isEqual(this.filter, value)) {
      return;
    }

    this.filterSubject.next(value);
  }

  public get distanceFilter(): IDistanceFilter {
    return this.distanceFilterSubject.value;
  }

  public set distanceFilter(value: IDistanceFilter) {
    if (isEqual(this.distanceFilter, value)) {
      return;
    }
    this.distanceFilterSubject.next(value);
  }
  // use defaultFilter to set a filter value when the filter is not activated
  // example when no status is selected we want to filter by all status except cancled
  // to set default value from an observable you can use patchDefaultFilter
  private defaultFilterSubject = new BehaviorSubject<IGlobalFilter>({});
  private readonly filterSubject = new BehaviorSubject<IGlobalFilter>({});
  public readonly filter$: Observable<IGlobalFilter>;

  private readonly distanceFilterSubject = new BehaviorSubject<IDistanceFilter>(this.getDefaultDistanceFilter());
  public readonly distanceFilter$: Observable<IDistanceFilter>;

  public readonly config: IGlobalFilterConfig = {
    distance: {
      min: MIN_GLOBAL_FILTER_DISTANCE,
      max: MAX_GLOBAL_FILTER_DISTANCE
    }
  };

  constructor(
    private readonly userLocalStorageService: UserLocalStorageService,
    private taxonomiesService: TaxonomiesService
  ) {
    this.filterSubject.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(x => this.saveFilter(x));
    this.filter$ = this.filterSubject.asObservable();
    this.distanceFilterSubject.pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE)).subscribe(x => this.saveDistanceFilter(x));
    this.distanceFilter$ = this.distanceFilterSubject.asObservable();
    void this.initFilter();
    this.initDefaultFilter();
    void this.initDistanceFilter();
  }

  public patchDefaultFilter(filter: IGlobalFilter) {
    this.defaultFilterSubject.next({ ...this.defaultFilter, ...filter });
  }

  private initDefaultFilter() {
    this.taxonomiesService
      .group(TaxonomyGroup.rtuProjectStatus)
      .pipe(take(1))
      .subscribe(tax => {
        this.patchDefaultFilter({ rtuProjectStatuses: tax.filter(x => x.code !== 'AN').map(x => x.code) });
      });
  }

  private getDefaultFilter(): IGlobalFilter {
    return { shownElements: enumValues(GlobalFilterShownElement) };
  }

  private getDefaultDistanceFilter(): IDistanceFilter {
    return { distanceEnabled: false, distance: DEFAULT_GLOBAL_FILTER_DISTANCE };
  }

  public resetFilter(): void {
    this.filterSubject.next(this.getDefaultFilter());
    this.distanceFilterSubject.next(this.getDefaultDistanceFilter());
  }

  private async initFilter(): Promise<void> {
    let filter = await this.userLocalStorageService.get<IGlobalFilter>(globalFilterStorageKey);
    if (isEmpty(filter)) {
      filter = this.getDefaultFilter();
    }
    this.filterSubject.next(filter);
  }

  private async initDistanceFilter(): Promise<void> {
    let distanceFilter = await this.userLocalStorageService.get<IDistanceFilter>(distanceFilterStorageKey);
    if (isEmpty(distanceFilter)) {
      distanceFilter = this.getDefaultDistanceFilter();
    }
    this.distanceFilterSubject.next(distanceFilter);
  }

  public patch(filterPatch: IGlobalFilter): void {
    const filter = {
      ...this.filterSubject.value,
      ...filterPatch
    };
    this.filterSubject.next(filter);
  }

  public patchDistance(distancePatch: Partial<IDistanceFilter>): void {
    const distanceFilter = Object.assign({}, this.distanceFilterSubject.value, distancePatch);
    this.distanceFilterSubject.next(distanceFilter);
  }

  public clearFilters(): void {
    this.filterSubject.next({
      shownElements: this.filter.shownElements
    });
  }

  public isFilterActiveObs(...filterKeys: (keyof IGlobalFilter)[]): Observable<boolean> {
    return this.filter$.pipe(map(() => this.isFilterActive(this.filter, ...filterKeys)));
  }

  public isFilterActive(filter: IGlobalFilter, ...filterKeys: (keyof IGlobalFilter)[]): boolean {
    return filterKeys.some(key => {
      const value = get(filter, key);
      return value !== undefined && value !== null && (!(value instanceof Array) || value.length !== 0);
    });
  }

  private saveFilter(filter: IGlobalFilter): Promise<void> {
    return this.userLocalStorageService.set(globalFilterStorageKey, filter);
  }

  private saveDistanceFilter(filter: IDistanceFilter): Promise<void> {
    return this.userLocalStorageService.set(distanceFilterStorageKey, filter);
  }

  public pickFilter(filter: IGlobalFilter, keys: string[]): IGlobalFilter {
    if (!keys?.length) {
      return {};
    }
    const filterCopy = cloneDeep(filter);
    const filterKeys = keys.map(x => x.split('.')[0]);
    for (const key of Object.keys(filter)) {
      if (!filterKeys.includes(key)) {
        delete filterCopy[key];
        continue;
      }
      const element = filterCopy[key];
      if (Array.isArray(element)) {
        for (const item of cloneDeep(element)) {
          if (!keys.includes(`${key}.${item}`)) {
            element.splice(element.indexOf(item), 1);
          }
        }
      }
    }
    return filterCopy;
  }

  public isElementShown(element: GlobalFilterShownElement): boolean {
    return this.filter.shownElements && this.filter.shownElements.includes(element);
  }

  public hasFilterChanged(
    previousFilter: IGlobalFilter,
    currentFilter: IGlobalFilter,
    keys: string[],
    shownElementsValues: GlobalFilterShownElement[]
  ): boolean {
    if (!previousFilter) {
      return true;
    }
    const previousShownElements = this.getShownElementsFromFilter(previousFilter, shownElementsValues);
    const currentShownElements = this.getShownElementsFromFilter(currentFilter, shownElementsValues);
    if (!isEqual(previousShownElements, currentShownElements)) {
      return true;
    }

    const previousLight = pick(previousFilter, keys);
    const currentLight = pick(currentFilter, keys);
    if (isEmpty(previousLight) && isEmpty(currentLight)) {
      return false;
    }
    return !isEqual(pick(previousFilter, keys), pick(currentFilter, keys));
  }

  private getShownElementsFromFilter(
    filter: IGlobalFilter,
    shownElementsValues: GlobalFilterShownElement[]
  ): GlobalFilterShownElement[] {
    return filter.shownElements?.filter(e => shownElementsValues.includes(e));
  }
}
