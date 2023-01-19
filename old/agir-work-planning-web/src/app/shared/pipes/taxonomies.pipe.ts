import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TaxonomiesService } from '../services/taxonomies.service';

const LANG = 'fr';

@Pipe({ name: 'appTaxonomy', pure: false })
export class TaxonomyPipe implements PipeTransform, OnDestroy {
  // Cached value
  public value: string | string[];

  // Mem cache of last params.
  private group: TaxonomyGroup;
  private code: string | string[];

  // Unsub triggers
  private readonly transform$ = new Subject();
  private readonly destroy$ = new Subject();

  constructor(private readonly taxonomiesService: TaxonomiesService, private readonly _ref: ChangeDetectorRef) {}

  public transform(code: string | string[], group: TaxonomyGroup, returnedProperty?: string): string | string[] {
    if (!(group in TaxonomyGroup)) {
      throw new Error(`Invalid taxonomy group: ${group}.`);
    }
    if (this.code === code && this.group === group) {
      return this.value;
    }

    // Set the new params
    this.code = code;
    this.group = group;

    this.transform$.next();
    this.taxonomiesService
      .codes(group, code instanceof Array ? code : [code])
      .pipe(takeUntil(merge(this.transform$, this.destroy$)))
      .subscribe(x => {
        this.updateValue(x, returnedProperty);
      });

    return this.value;
  }

  private updateValue(taxonomies: ITaxonomy[], returnedProperty?: string): void {
    if (returnedProperty) {
      const properties = taxonomies.map(t => t.properties[returnedProperty]);
      this.value = this.code instanceof Array ? properties : properties[0];
    } else {
      const labels = taxonomies.map(t => t.label[LANG]);
      this.value = this.code instanceof Array ? labels : labels[0];
    }
    this._ref.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
