import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { flatten, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { IPaginatedResults } from 'src/app/shared/models/paginated-results';
import { IVdmColumn } from '../vdm-table/vdm-table.component';
export interface IVdmPagination {
  pageIndex: number;
  pageSize: number;
}
const DEFAULT_PAGE_INDEX = 1;
const DEFAULT_PAGE_SIZE = 50;
export abstract class VdmDataSource<T, S extends {}> implements DataSource<any> {
  private get fields(): string[] {
    return uniq(flatten(this.columns.filter(el => this.displayedColumns.includes(el.property)).map(el => el.fields)));
  }
  // pagination
  public paginationSubject = new BehaviorSubject<IVdmPagination>({
    pageIndex: DEFAULT_PAGE_INDEX,
    pageSize: DEFAULT_PAGE_SIZE
  });
  public pagination$ = this.paginationSubject.asObservable();
  public get pagination(): IVdmPagination {
    return this.paginationSubject.getValue();
  }
  // sortedColumn
  public sortedColumnSubject = new BehaviorSubject<IVdmColumn<T>>(null);
  public sortedColumn$ = this.sortedColumnSubject.asObservable();
  public get sortedColumn(): IVdmColumn<T> {
    return this.sortedColumnSubject.getValue();
  }
  // data
  private list = new BehaviorSubject<T[]>([]);
  // loading
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  public get loading(): boolean {
    return this.loadingSubject.getValue();
  }
  // count
  public countSubject = new BehaviorSubject<number>(0);
  public count$ = this.countSubject.asObservable();
  public get count(): number {
    return this.countSubject.getValue();
  }
  // columns
  public abstract columns: IVdmColumn<T>[];
  // search request
  public searchRequestSubject = new BehaviorSubject<S>(null);
  public searchRequest$ = this.searchRequestSubject.asObservable();
  public get searchRequest(): S {
    return {
      ...this.searchRequestSubject.getValue(),
      // pages are not 0 indexed
      // pageIndex starts with 1
      offset: (this.pagination.pageIndex - 1) * this.pagination.pageSize,
      limit: this.pagination.pageSize,
      orderBy: this.sortedColumn
        ? this.sortedColumn.sortAsc
          ? `+${this.sortedColumn.property}`
          : `-${this.sortedColumn.property}`
        : undefined,
      fields: this.fields
    };
  }
  // diplayed columns
  public displayedColumnsSubject = new BehaviorSubject<string[]>([]);
  public displayedColumns$ = this.displayedColumnsSubject.asObservable();
  public get displayedColumns(): string[] {
    return this.displayedColumnsSubject.getValue();
  }

  // prevent http calls triggered when setting subject values while initializing component
  public isLoadEnabled = false;

  public disconnect(collectionViewer: CollectionViewer): void {
    this.list.complete();
    this.loadingSubject.complete();
    this.countSubject.complete();
    this.displayedColumnsSubject.complete();
    this.searchRequestSubject.complete();
    this.sortedColumnSubject.complete();
  }

  public patchSearchRequest(request: S) {
    this.searchRequestSubject.next({ ...this.searchRequest, ...(request || {}) });
  }

  public connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return this.list.asObservable();
  }

  public abstract requestData(): Observable<IPaginatedResults<T>>;
  public abstract augmentedResult(items: T[]): Promise<T[]>;

  protected get datasourceDependencies$(): Observable<any> {
    return combineLatest(this.displayedColumns$, this.sortedColumn$, this.searchRequest$, this.pagination$);
  }

  public load() {
    if (this.isLoadEnabled) {
      this.loadingSubject.next(true);
      this.requestData().subscribe(async (res: IPaginatedResults<T>) => {
        this.countSubject.next(res.paging?.totalCount);
        await this.augmentedResult(res.items);
        this.list.next(res.items);
        this.loadingSubject.next(false);
      });
    }
  }
}
