import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ITaxonomy, ITaxonomyList, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { isEmpty, isNil, orderBy } from 'lodash';
import { BehaviorSubject, Observable, timer, zip } from 'rxjs';
import { filter, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { buildHttpParams } from '../http/params-builder';
import { IPaginatedResults } from '../models/paginated-results';
import { ISubGroupFromPropertiesOptions } from '../models/taxonomies/sub-group-from-properties-options';
import { UserLocalStorageService } from './user-local-storage.service';

const TAXONOMIES_LOCAL_STORAGE_KEY = 'taxonomies-storage-key';
interface ITaxonomyLocalStorage {
  expiresOn: Date;
  taxonomies: ITaxonomyList;
}
@Injectable({
  providedIn: 'root'
})
export class TaxonomiesService {
  private readonly REFRESH_INTERVAL = environment.services.taxonomies.refreshInterval;
  private readonly url = environment.apis.planning.taxonomies;
  private readonly taxonomiesSubject = new BehaviorSubject<ITaxonomyList>([]);
  public taxonomies = this.taxonomiesSubject.asObservable().pipe(filter(taxonomies => !isEmpty(taxonomies)));

  constructor(private readonly http: HttpClient, private readonly userLocalStorageService: UserLocalStorageService) {
    this.initTaxonomies();
  }

  /* setup automatic check */
  private initTaxonomies() {
    timer(0, 5 * 60 * 1000) // 5 minutes
      .pipe(
        switchMap(() => this.userLocalStorageService.get<ITaxonomyLocalStorage>(TAXONOMIES_LOCAL_STORAGE_KEY)),
        filter((taxoLocalStorage: ITaxonomyLocalStorage) => {
          if (isNil(taxoLocalStorage) || new Date() > new Date(taxoLocalStorage.expiresOn)) {
            return true;
          }
          this.taxonomiesSubject.next(taxoLocalStorage.taxonomies);
          return false;
        }),
        switchMap(() => this.requestTaxonomies())
      )
      .subscribe(async taxonomies => {
        await this.refreshLocalStorage(taxonomies);
      });
  }

  private buildTaxonomiesLocalStorage(taxonomyList: ITaxonomyList): ITaxonomyLocalStorage {
    const expiresOnMs = Date.now() + this.REFRESH_INTERVAL;
    return {
      expiresOn: new Date(expiresOnMs),
      taxonomies: taxonomyList
    };
  }

  private async refreshLocalStorage(taxonomyList: ITaxonomyList) {
    this.taxonomiesSubject.next(taxonomyList);
    await this.userLocalStorageService.set(
      TAXONOMIES_LOCAL_STORAGE_KEY,
      this.buildTaxonomiesLocalStorage(taxonomyList)
    );
  }

  private forceReload(): void {
    this.requestTaxonomies().subscribe(async taxonomyList => {
      await this.refreshLocalStorage(taxonomyList);
    });
  }

  private requestTaxonomies(): Observable<ITaxonomyList> {
    const params = buildHttpParams({ limit: environment.services.pagination.limitMax });
    return this.http
      .get<IPaginatedResults<ITaxonomy>>(this.url, { params })
      .pipe(map(response => orderBy(response.items, [t => t.group, t => t.displayOrder, t => t.label?.fr])));
  }

  public group(...group: string[]): Observable<ITaxonomyList> {
    const groupKey = group.join('.');
    return this.groups(groupKey).pipe(map(taxonomies => taxonomies[0]));
  }

  public groups(...groups: string[]): Observable<ITaxonomyList[]> {
    return this.taxonomies.pipe(map(taxonomies => groups.map(g => taxonomies.filter(t => t.group === g))));
  }

  public code(group: TaxonomyGroup | TaxonomyGroup[], code: string): Observable<ITaxonomy> {
    return this.codes(group, [code]).pipe(map(p => p[0]));
  }

  public codes(group: TaxonomyGroup | TaxonomyGroup[], codes: string[]): Observable<ITaxonomy[]> {
    let groupKeys: TaxonomyGroup[];
    if (group instanceof Array) {
      groupKeys = group;
    } else {
      groupKeys = [group];
    }
    return this.group(...groupKeys).pipe(map(taxonomies => taxonomies.filter(x => codes.includes(x.code))));
  }

  public subGroup(group: TaxonomyGroup, subGroup: TaxonomyGroup, code: string): Observable<ITaxonomyList> {
    return zip(this.group(group), this.code(subGroup, code)).pipe(
      map(([groupT, codeT]) => {
        if (!groupT || !codeT || !codeT.valueString1) {
          return [];
        }
        const codes = codeT.valueString1.split(',');
        return groupT.filter(x => codes.includes(x.code));
      })
    );
  }

  public subGroupFromProperties(opts: ISubGroupFromPropertiesOptions): Observable<ITaxonomyList> {
    return opts.dependencyObservable.pipe(
      takeUntil(opts.destroyEvent),
      switchMap(dependencyCode => this.code(opts.dependencyGroup, dependencyCode).pipe(takeUntil(opts.destroyEvent))),
      switchMap(dependencyTaxonomy =>
        this.group(opts.relationGroup).pipe(
          takeUntil(opts.destroyEvent),
          map(relationTaxonomies => {
            const relationCodes = opts.relationSelector(dependencyTaxonomy?.properties) || [];
            return relationTaxonomies.filter(x => relationCodes.includes(x.code));
          })
        )
      )
    );
  }

  public translateAsync(group: TaxonomyGroup, code: string): Promise<string> {
    return this.code(group, code)
      .pipe(
        take(1),
        map(t => t?.label.fr)
      )
      .toPromise();
  }

  public async create(taxonomy: ITaxonomy): Promise<void> {
    await this.http.post<ITaxonomy>(`${environment.apis.planning.taxonomies}`, taxonomy).toPromise();
    this.forceReload();
  }

  public async update(taxonomy: ITaxonomy): Promise<void> {
    await this.http
      .put<ITaxonomy>(`${environment.apis.planning.taxonomies}/${taxonomy.group}/${taxonomy.code}`, taxonomy)
      .toPromise();
    this.forceReload();
  }

  public async delete(taxonomy: ITaxonomy): Promise<void> {
    await this.http
      .delete<ITaxonomy>(`${environment.apis.planning.taxonomies}/${taxonomy.group}/${taxonomy.code}`)
      .toPromise();
    this.forceReload();
  }

  public getTaxonomyByGroup(group: TaxonomyGroup): Promise<IPaginatedResults<ITaxonomy>> {
    return this.http.get<IPaginatedResults<ITaxonomy>>(`${environment.apis.planning.taxonomies}/${group}`).toPromise();
  }
}
