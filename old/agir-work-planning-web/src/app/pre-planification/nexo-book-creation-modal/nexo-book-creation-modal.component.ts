import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';

import { markAllAsTouched } from '../../shared/forms/forms.utils';
import { TaxonomiesService } from '../../shared/services/taxonomies.service';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { BaseNexoBookModalComponent } from '../base-nexo-book-modal.component';

@Component({
  selector: 'app-nexo-book-creation-modal',
  templateUrl: './nexo-book-creation-modal.component.html',
  styleUrls: ['./nexo-book-creation-modal.component.scss']
})
export class NexoBookCreationModalComponent extends BaseNexoBookModalComponent implements OnInit {
  public form: FormGroup;

  constructor(
    public readonly taxonomyService: TaxonomiesService,
    activeModal: NgbActiveModal,
    private readonly formBuilder: FormBuilder
  ) {
    super(taxonomyService, activeModal, formBuilder);
  }

  public async ngOnInit(): Promise<void> {
    await super.ngOnInit();
    this.initForm();
  }

  public initForm(): void {
    this.form = this.formBuilder.group({
      code: [null, [Validators.required, CustomValidators.codeDuplicate(this.nexoBooks)]],
      labelFr: [null, Validators.required],
      labelEn: [null, Validators.required],
      correspondances: this.formBuilder.array([])
    });
    this.initYearSubject();
    this.rows = this.form.get('correspondances') as FormArray;
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    const formValue = this.form.value;
    const newTaxonomy: ITaxonomy = {
      code: formValue.code,
      group: TaxonomyGroup.nexoBook,
      label: {
        fr: formValue.labelFr,
        en: formValue.labelEn
      },
      properties: {
        programs: [...formValue.correspondances]
      }
    };
    await this.taxonomyService.create(newTaxonomy);
    this.isLoading = false;
    this.closeModal(true);
  }

  public reset(): void {
    this.isLoading = true;
    this.form.reset();
    this.clearFormArray(this.rows);
    this.isLoading = false;
  }
}
