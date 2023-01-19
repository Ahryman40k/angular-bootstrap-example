import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { IEnrichedProject, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, merge, Observable, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';

import { ReturnCategory } from '../models/projects/return-category';
import { ProjectService } from '../services/project.service';
import { TaxonomiesService } from '../services/taxonomies.service';

@Pipe({ name: 'vdmProjectCategories', pure: false })
export class ProjectCategoriesPipe implements PipeTransform, OnDestroy {
  // Cached value
  public value: string;

  // Unsub triggers
  private readonly transform$ = new Subject();
  private readonly destroy$ = new Subject();

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly projectService: ProjectService,
    private readonly _ref: ChangeDetectorRef
  ) {}
  public transform(project: IEnrichedProject, returnCategory: ReturnCategory, annualPeriodYear: number): string {
    if (!project) {
      return null;
    }
    this.transform$.next();
    const categories$ = this.getCategoriesObservable(returnCategory);
    combineLatest(
      categories$,
      this.projectService.fromYearChanged$.pipe(startWith(this.projectService.fromYear))
    ).subscribe(c => this.updateValue(c[0], project, returnCategory, annualPeriodYear));
    return this.value;
  }

  private getCategoriesObservable(category: ReturnCategory): Observable<any> {
    let baseObservable: Observable<any>;
    if (category === ReturnCategory.category) {
      baseObservable = this.taxonomiesService.group(TaxonomyGroup.projectCategory);
    } else if (category === ReturnCategory.subCategory) {
      baseObservable = this.taxonomiesService.group(TaxonomyGroup.projectSubCategory);
    } else {
      baseObservable = this.taxonomiesService.groups(TaxonomyGroup.projectCategory, TaxonomyGroup.projectSubCategory);
    }
    return baseObservable.pipe(takeUntil(merge(this.transform$, this.destroy$)));
  }

  private updateValue(
    categories: any,
    project: IEnrichedProject,
    returnCategory: ReturnCategory,
    annualPeriodYear: number
  ): void {
    const fromYear = this.projectService.fromYear;
    const year = annualPeriodYear || fromYear;
    if (!year || !categories) {
      return;
    }
    if (returnCategory === ReturnCategory.category) {
      this.value = categories.find(
        c => c.code === project.annualDistribution.annualPeriods?.find(x => x.year === year)?.categoryId
      )?.label.fr;
    } else if (returnCategory === ReturnCategory.subCategory) {
      this.value = categories.filter(s => project.subCategoryIds.find(sc => s.code === sc))?.map(x => x.label.fr);
    } else {
      const category = categories[0].find(
        c => c.code === project.annualDistribution.annualPeriods?.find(x => x.year === year)?.categoryId
      );
      const subCategories = categories[1].filter(s => project.subCategoryIds?.find(sc => s.code === sc));
      this.value = [category?.label.fr]
        .concat(subCategories?.map(x => x.label.fr))
        .filter(x => x)
        .join(', ');
    }
    this._ref.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
