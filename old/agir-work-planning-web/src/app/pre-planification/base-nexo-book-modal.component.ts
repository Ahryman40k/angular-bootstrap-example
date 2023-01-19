import { OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AnnualProgramConstant, ITaxonomyList, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { arrayOfNumbers } from '../shared/arrays/number-arrays';
import { TaxonomiesService } from '../shared/services/taxonomies.service';

export interface INexoProgram {
  year: number;
  programId: string;
}
export abstract class BaseNexoBookModalComponent implements OnInit {
  public programTypes: ITaxonomyList;
  public nexoBooks: ITaxonomyList;
  public form: FormGroup;
  public yearList: number[];
  public rows: FormArray;
  public isLoading = false;
  public isRemovingProgram = false;

  public yearsSubject = new BehaviorSubject<number[]>([]);
  public years$ = this.yearsSubject.asObservable();

  public get canAddRow(): boolean {
    return !(!this.rows?.valid || this.rows?.length >= this.yearList.length || this.isLoading);
  }

  public get rowLength(): any[] {
    return Array(this.rows?.length);
  }

  constructor(
    public readonly taxonomyService: TaxonomiesService,
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder
  ) {}

  public async ngOnInit(): Promise<void> {
    this.yearList = arrayOfNumbers(AnnualProgramConstant.minimumYear, AnnualProgramConstant.maximumYear);
    await this.initTaxonomies();
    this.yearsSubject.next(cloneDeep(this.yearList));
  }

  public closeModal(result = false): void {
    this.activeModal.close(result);
  }

  public addRow(correspondance?: INexoProgram): void {
    this.rows = this.form.get('correspondances') as FormArray;
    if (this.rows?.length >= this.yearList.length) {
      return;
    }
    if (this.rows?.invalid) {
      return;
    }
    this.rows.push(this.createItem(correspondance));
  }

  public createItem(correspondance?: INexoProgram): FormGroup {
    return this.fb.group({
      year: [correspondance ? correspondance.year : null, [Validators.required]],
      programId: [correspondance ? correspondance.programId : null, [Validators.required]]
    });
  }

  public isYearInvalid(i: number): boolean {
    const formGroup = this.rows?.controls[i] as FormGroup;
    return formGroup?.controls.year.invalid;
  }

  public isProgramInvalid(i: number): boolean {
    const formGroup = this.rows?.controls[i] as FormGroup;
    return formGroup?.controls.programId.invalid;
  }

  public removeProgram(i: number): void {
    this.isRemovingProgram = true;
    this.rows.removeAt(i);
    // Make sure the row is properly removed so the html's index doesn't cause problems
    setTimeout(() => {
      this.isRemovingProgram = false;
    });
  }

  public initYearSubject(): void {
    this.form.controls.correspondances.valueChanges.subscribe(forms => {
      this.updateYearSubject(forms);
    });
  }

  public updateYearSubject(forms: any): void {
    const years = cloneDeep(this.yearList);
    forms.forEach(form => {
      const yearIndex = years.findIndex(y => y === form.year);
      if (yearIndex >= 0) {
        years.splice(yearIndex, 1);
      }
    });
    this.yearsSubject.next(years);
  }

  public clearFormArray(formArray: FormArray): void {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  private async initTaxonomies(): Promise<void> {
    [this.programTypes, this.nexoBooks] = await this.taxonomyService
      .groups(TaxonomyGroup.programType, TaxonomyGroup.nexoBook)
      .pipe(take(1))
      .toPromise();
  }
}
