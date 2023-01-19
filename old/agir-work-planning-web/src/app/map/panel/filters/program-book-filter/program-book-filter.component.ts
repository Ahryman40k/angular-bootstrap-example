import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { AnnualProgramExpand, IEnrichedAnnualProgram, IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';

import { defaultAnnualProgramFields } from '../../../../program-book/program-book-fields';
import { GlobalFilterService } from '../../../../shared/services/filters/global-filter.service';
import { IFilterItem } from '../filter-item-layout/filter-item-layout.component';

@Component({
  selector: 'app-program-book-filter',
  templateUrl: './program-book-filter.component.html',
  styleUrls: ['./program-book-filter.component.scss']
})
export class ProgramBookFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public annualPrograms: IEnrichedAnnualProgram[];
  public isLoading = false;
  public items: FormArray;
  public selectAllItem: IFilterItem = {
    label: 'Tout afficher',
    selected: this.globalFilterService.filter.programBooks ? false : true
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly annualProgramService: AnnualProgramService,
    private readonly programBookService: ProgramBookService,
    private readonly globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    if (this.selectAllItem.selected) {
      this.setFilters([]);
    }
    this.isLoading = true;
    this.form = this.fb.group({
      annualProgramForms: this.fb.array([])
    });
    this.annualPrograms = await this.getAnnualPrograms();
    this.annualPrograms = orderBy(this.annualPrograms, a => a.year, 'desc');
    for (const annualProgram of this.annualPrograms) {
      this.addItem(annualProgram);
    }
    this.isLoading = false;
    this.form.controls.annualProgramForms.valueChanges.subscribe(x => {
      this.selectAllItem.selected = false;
      this.setFilters([].concat(...x.map(p => p.programBooks)));
    });
  }

  public selectAllItems(): void {
    if (!this.items) {
      return;
    }
    this.items.reset();
    this.selectAllItem.selected = true;
  }
  public addItem(annualProgram: IEnrichedAnnualProgram): void {
    this.items = this.form.get('annualProgramForms') as FormArray;
    this.items.push(this.createItem(annualProgram));
  }
  public setFilters(programBookIds: string[]): void {
    const ids = programBookIds.filter(x => x);
    this.globalFilterService.patch({ programBooks: ids.length ? ids : undefined });
  }

  private async getAnnualPrograms(): Promise<IEnrichedAnnualProgram[]> {
    const paginatedAnnualPrograms = await this.annualProgramService.getCachedAnnualPrograms(
      defaultAnnualProgramFields,
      [AnnualProgramExpand.programBooks],
      true
    );
    paginatedAnnualPrograms.items.forEach(
      x => (x.programBooks = this.programBookService.filterByStatusNotNew(x.programBooks))
    );
    return paginatedAnnualPrograms.items.filter(x => x.programBooks?.length);
  }

  private createItem(annualProgram: IEnrichedAnnualProgram): FormGroup {
    return this.fb.group({
      programBooks: [this.getCurrentAnnualProgramFilters(annualProgram)]
    });
  }

  private getCurrentAnnualProgramFilters(annualProgram: IEnrichedAnnualProgram): IUuid[] {
    const activeFilter = this.globalFilterService.filter.programBooks || [];
    return activeFilter.filter(x => annualProgram.programBooks.map(p => p.id).includes(x));
  }
}
