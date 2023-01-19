import { Injectable } from '@angular/core';
import { AnnualProgramExpand, IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, flatten, isEqual } from 'lodash';
import { combineLatest, merge } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

import { defaultAnnualProgramFields } from '../../../program-book/program-book-fields';
import { IGlobalFilter } from '../../models/filters/global-filter';
import { UserService } from '../../user/user.service';
import { AnnualProgramService } from '../annual-program.service';
import { ProgramBookService } from '../program-book.service';
import { GlobalFilterService } from './global-filter.service';

@Injectable({ providedIn: 'root' })
export class GlobalFilterCleanerService {
  constructor(
    private readonly globalFilterService: GlobalFilterService,
    private readonly annualProgramService: AnnualProgramService,
    private readonly programBookService: ProgramBookService,
    private readonly userService: UserService
  ) {}

  public init(): void {
    const annualPrograms$ = combineLatest(
      this.userService.getCurrentUser(),
      merge(
        this.annualProgramService.annualProgramChanged$,
        this.programBookService.programBookChanged$,
        this.programBookService.programBookDeleted$
      ).pipe(startWith(null))
    ).pipe(
      switchMap(() => this.annualProgramService.getAll(defaultAnnualProgramFields, [AnnualProgramExpand.programBooks]))
    );

    combineLatest(this.globalFilterService.filter$, annualPrograms$).subscribe(([originalFilter, annualPrograms]) =>
      this.cleanGlobalFilter(originalFilter, annualPrograms.items)
    );
  }

  private cleanGlobalFilter(originalFilter: IGlobalFilter, annualPrograms: IEnrichedAnnualProgram[]): void {
    if (!originalFilter.programBooks) {
      return;
    }
    const filterClone = cloneDeep(originalFilter);

    const annualProgramsWithProgramBooks = annualPrograms.filter(ap => ap.programBooks);
    const programBookIds = flatten(annualProgramsWithProgramBooks.map(ap => ap.programBooks)).map(pb => pb.id);

    filterClone.programBooks = filterClone.programBooks.filter(programBookId => programBookIds.includes(programBookId));

    if (!isEqual(filterClone, originalFilter)) {
      this.globalFilterService.filter = filterClone;
    }
  }
}
