import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';

import { DialogsService } from '../../shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../../shared/forms/confirmation-modal/confirmation-modal.component';
import { markAllAsTouched } from '../../shared/forms/forms.utils';
import { TaxonomiesService } from '../../shared/services/taxonomies.service';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { BaseNexoBookModalComponent, INexoProgram } from '../base-nexo-book-modal.component';

@Component({
  selector: 'app-nexo-book-update-modal',
  templateUrl: './nexo-book-update-modal.component.html',
  styleUrls: ['./nexo-book-update-modal.component.scss']
})
export class NexoBookUpdateModalComponent extends BaseNexoBookModalComponent implements OnInit {
  public nexoBook: ITaxonomy;

  constructor(
    private readonly dialogsService: DialogsService,
    taxonomyService: TaxonomiesService,
    activeModal: NgbActiveModal,
    private readonly formBuilder: FormBuilder
  ) {
    super(taxonomyService, activeModal, formBuilder);
  }

  public async ngOnInit(): Promise<void> {
    await super.ngOnInit();
    this.initForm();
  }

  public reset(): void {
    this.isLoading = true;
    this.clearFormArray(this.rows);
    this.form.reset({
      code: this.nexoBook.code,
      labelFr: this.nexoBook.label.fr,
      labelEn: this.nexoBook.label.en
    });
    setTimeout(() => {
      this.nexoBook.properties.programs.forEach(program => {
        this.addRow(program);
      });
    });
    this.setRows();
    this.isLoading = false;
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    const modal = this.dialogsService.showConfirmationModal(
      `Modifier l'élément`,
      `La modification de cette correspondance impactera l'importation NEXO. Êtes-vous certain de vouloir continuer?`
    );
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      this.isLoading = true;
      const formValue = this.form.value;
      const updatedTaxonomy: ITaxonomy = {
        code: this.nexoBook.code,
        group: this.nexoBook.group,
        label: {
          fr: formValue.labelFr,
          en: formValue.labelEn
        },
        properties: {
          programs: [...formValue.correspondances]
        }
      };
      await this.taxonomyService.update(updatedTaxonomy);
      this.isLoading = false;
      this.closeModal(true);
    }
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      code: [this.nexoBook.code, [Validators.required, CustomValidators.codeDuplicate(this.nexoBooks)]],
      labelFr: [this.nexoBook.label.fr, Validators.required],
      labelEn: [this.nexoBook.label.en, Validators.required],
      correspondances: this.formBuilder.array(this.getNexoBookCorrespondances())
    });
    this.initYearSubject();
    this.setRows();
    this.form.controls.code.disable();
  }

  private getNexoBookCorrespondances(): INexoProgram[] {
    const correspondances = [];
    this.nexoBook.properties.programs?.forEach(p => {
      correspondances.push(this.createItem(p));
    });
    return correspondances;
  }

  private setRows(): void {
    this.rows = this.form.get('correspondances') as FormArray;
    this.updateYearSubject(this.rows.value);
  }
}
