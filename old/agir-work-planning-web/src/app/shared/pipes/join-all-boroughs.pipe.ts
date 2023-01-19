import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { BoroughCode, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TaxonomiesService } from '../services/taxonomies.service';

const allBoroughsLabel = 'Tous les arrondissements';

@Pipe({ name: 'vdmJoinAllBoroughs', pure: false })
export class JoinAllBoroughsPipe implements PipeTransform, OnDestroy {
  // Cached value
  public value: string;

  // Unsub triggers
  private readonly transform$ = new Subject();
  private readonly destroy$ = new Subject();

  constructor(private readonly taxonomyService: TaxonomiesService, private readonly _ref: ChangeDetectorRef) {}

  public transform(boroughIds: string[], separator: string = ', '): string {
    if (!boroughIds?.length) {
      return allBoroughsLabel;
    }
    this.transform$.next();
    const boroughs$ = this.taxonomyService
      .group(TaxonomyGroup.borough)
      .pipe(takeUntil(merge(this.transform$, this.destroy$)));

    boroughs$.subscribe(boroughs => this.updateValue(boroughs, boroughIds, separator));
    return this.value;
  }

  private updateValue(boroughTaxonomies: ITaxonomy[], boroughIds: string[], separator: string): void {
    const allBoroughs = boroughTaxonomies.filter(b => b.code !== BoroughCode.MTL).map(b => b?.code);
    if (allBoroughs.every(a => boroughIds.includes(a))) {
      this.value = allBoroughsLabel;
    } else {
      const boroughLabels = boroughIds.map(e => boroughTaxonomies.find(b => b.code === e).label.fr);
      this.value = boroughLabels.join(separator);
    }
    this._ref.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
