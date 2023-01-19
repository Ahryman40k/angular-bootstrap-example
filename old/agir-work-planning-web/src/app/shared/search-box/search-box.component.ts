import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { IInterventionSearchRequest, IProjectSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable, of } from 'rxjs';
import { debounceTime, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { arrayUtils } from '../arrays/array.utils';
import { BaseComponent } from '../components/base/base.component';
import { IAddressFull } from '../models/location/address-full';
import { ObjectType } from '../models/object-type/object-type';
import { DrmSubmissionNumberFormatPipe } from '../pipes/drm-submission-number-format.pipe';
import { SearchObjectsService } from '../services/search-objects.service';

const TRIGGER_SEARCH_DEBOUNCE = 500;
const SEARCH_RESULTS_MAX_LENGTH = 5;
@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html'
})
export class SearchBoxComponent extends BaseComponent implements OnInit {
  public ObjectType = ObjectType;

  @Input() public autocompleteDisabledObjectTypes: ObjectType[] = [ObjectType.asset];
  @Input() public autocompleteFilter: (results: any[]) => any[];
  @Input() public autocompleteDisabled: boolean = false;
  @Input() public defaultInterventionSearchRequest: IInterventionSearchRequest = {};
  @Input() public defaultProjectSearchRequest: IProjectSearchRequest = {};

  @Output() public search = new EventEmitter();
  @Output() public itemSelected = new EventEmitter<object>();
  @Output() public clear = new EventEmitter();

  public searchBarControl: FormControl;
  public searchBarTerm: string;
  private stopAutoComplete = false;
  private lastSelectedItem: object;

  @ViewChild('searchInput')
  public searchInput: ElementRef<HTMLDivElement>;

  constructor(
    private readonly searchObjectsService: SearchObjectsService,
    private readonly drmSubmissionNumberFormatPipe: DrmSubmissionNumberFormatPipe
  ) {
    super();
    this.itemSelected.subscribe(obj => (this.lastSelectedItem = obj));
  }

  public ngOnInit(): void {
    this.initSearchBar();
  }

  public initSearchBar(): void {
    this.searchBarControl = new FormControl(undefined, Validators.maxLength(100));
    this.searchBarControl.valueChanges.subscribe(value => {
      if (this.searchBarControl.invalid) {
        return;
      }
      if (typeof value === 'string') {
        this.searchBarTerm = value;
      }
      if (value?.id) {
        this.onEnterPress();
      }
    });
    this.searchObjectsService.term$.pipe(takeUntil(this.destroy$)).subscribe(term => {
      if (this.searchBarTerm !== term) {
        setTimeout(() => (this.searchBarTerm = term));
      }
    });
  }

  public clearInput(): void {
    this.searchBarControl.reset(null);
    this.clear.emit();
  }

  public formatter = (value: any) => {
    switch (this.getResultType(value)) {
      case ObjectType.project:
        return `${value.id} - ${value.projectName}`;
      case ObjectType.address:
        return this.getAddressLine1(value);
      case ObjectType.intervention:
        return `${value.id} - ${value.interventionName}`;
      case ObjectType.submissionNumber:
        return this.drmSubmissionNumberFormatPipe.transform(value);
      default:
        break;
    }
  };

  public getResultType(result: any): ObjectType {
    return this.searchObjectsService.getResultType(result, this.searchBarTerm);
  }

  public getAddressLine1(address: IAddressFull): string {
    return [address.houseNumber, address.street.fullStreetName.nameFr].joinStrings(' ');
  }

  public getAddressLine2(address: IAddressFull): string {
    return [address.borough.name, address.postalCode].joinStrings(', ');
  }

  public searchTerm = (text$: Observable<string>): Observable<{}[]> => {
    return text$.pipe(
      tap(() => (this.autocompleteDisabled ? (this.stopAutoComplete = true) : (this.stopAutoComplete = false))),
      debounceTime(TRIGGER_SEARCH_DEBOUNCE),
      filter(() => !this.stopAutoComplete),
      switchMap(term => this.searchObjects(term)),
      filter(() => !this.stopAutoComplete)
    );
  };

  public searchObjects(term: string): Observable<{}[]> {
    if (!term.replace(/\s/g, '').length) {
      return of([]);
    }
    return this.searchObjectsService
      .searchObjects({
        limit: SEARCH_RESULTS_MAX_LENGTH,
        term,
        defaultInterventionSearchRequest: this.defaultInterventionSearchRequest,
        defaultProjectSearchRequest: this.defaultProjectSearchRequest,
        options: { disabledObjectTypes: this.autocompleteDisabledObjectTypes, filter: this.autocompleteFilter }
      })
      .pipe(
        takeUntil(this.destroy$),
        map((results: any[][]) => {
          return arrayUtils.firstNOfArrays(results, SEARCH_RESULTS_MAX_LENGTH) as {}[];
        })
      );
  }

  public openSearch(): void {
    this.searchInput.nativeElement.focus();
  }

  public onEnterPress(): void {
    this.stopAutoComplete = true;
    const searchObject = this.searchBarControl.value;
    if (searchObject?.id) {
      if (this.lastSelectedItem !== searchObject) {
        this.itemSelected.emit(searchObject);
      }
    } else {
      this.search.emit(this.searchBarTerm);
    }
  }
}
