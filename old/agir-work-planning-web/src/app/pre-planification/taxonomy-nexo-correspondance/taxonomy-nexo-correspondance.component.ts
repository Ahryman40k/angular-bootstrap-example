import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITaxonomyList, Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, flatten, orderBy } from 'lodash';
import { Observable, Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';

import { AlertType } from '../../shared/alerts/alert/alert.component';
import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogsService } from '../../shared/dialogs/dialogs.service';
import { AlertModalComponent } from '../../shared/forms/alert-modal/alert-modal.component';
import {
  ConfirmationModalCloseType,
  ConfirmationModalComponent
} from '../../shared/forms/confirmation-modal/confirmation-modal.component';
import { markAllAsTouched } from '../../shared/forms/forms.utils';
import { IMoreOptionsMenuItem } from '../../shared/models/more-options-menu/more-options-menu-item';
import { RouteService } from '../../shared/services/route.service';
import { TaxonomiesService } from '../../shared/services/taxonomies.service';
import { CustomValidators } from '../../shared/validators/custom-validators';

const NEXO_DELETE_CONFIRMATION_MESSAGE =
  'La suppression de cette correspondance impactera l’importation NEXO. Êtes-vous certain de vouloir continuer? ';
const NEXO_UPDATE_CONFIRMATION_MESSAGE =
  'La modification de cette correspondance impactera l’importation NEXO. Êtes-vous certain de vouloir continuer? ';
interface INexoCorrespondance {
  code: string;
  description: string;
}

interface ITaxonomyCorrespondance {
  match: INexoCorrespondance;
  agirCode: string;
  agirLabel: string;
}
@Component({
  selector: 'app-taxonomy-nexo-correspondance',
  templateUrl: './taxonomy-nexo-correspondance.component.html',
  styleUrls: ['./taxonomy-nexo-correspondance.component.scss']
})
export class TaxonomyNexoCorrespondanceComponent extends BaseComponent implements OnInit {
  public taxonomyGroup: string;
  public nexoCorrespondances: ITaxonomyCorrespondance[];
  public taxonomies: ITaxonomyList;
  public menuItems$: Observable<IMoreOptionsMenuItem[]>;
  public creationForm: FormGroup;
  public updateForm: FormGroup;
  public taxonomyDescription: string;
  public updatingTaxonomyDescription: string;

  public editingCorrespondanceCode: string;
  public isLoading = false;
  public isCreating = false;

  private readonly taxonomiesChanged$ = new Subject();

  constructor(
    private readonly routeService: RouteService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly dialogsService: DialogsService,
    private readonly fb: FormBuilder
  ) {
    super();
  }

  public ngOnInit(): void {
    this.taxonomyGroup = this.routeService.currentRouteLastSegment;
    this.initTaxonomy();
    this.initForms();
  }

  private initTaxonomy(): void {
    this.taxonomiesChanged$.pipe(takeUntil(this.destroy$), startWith(null)).subscribe(async () => {
      this.isLoading = true;
      const paginatedTaxonomies = await this.taxonomiesService.getTaxonomyByGroup(TaxonomyGroup[this.taxonomyGroup]);
      this.taxonomies = paginatedTaxonomies.items;
      this.creationForm.controls.nexoCode.setValidators(CustomValidators.nexoCodeDuplicate(this.taxonomies));
      const filteredTaxonomies = paginatedTaxonomies.items.filter(taxo => !!taxo.properties?.nexoMatches);
      const nexoCorrespondances: ITaxonomyCorrespondance[] = [];
      filteredTaxonomies.forEach(taxo => {
        taxo.properties.nexoMatches.forEach(match => {
          nexoCorrespondances.push({
            agirCode: taxo.code,
            match,
            agirLabel: taxo.label.fr
          });
        });
      });
      this.nexoCorrespondances = orderBy(nexoCorrespondances, f => f.match.code);
      this.isLoading = false;
    });
  }

  private initForms(): void {
    const baseForm = {
      nexoCode: [null, Validators.required],
      nexoDescription: [null, Validators.required],
      taxonomyCode: [null, Validators.required]
    };

    this.creationForm = this.fb.group(baseForm);
    this.updateForm = this.fb.group(baseForm);

    this.creationForm.controls.taxonomyCode.valueChanges.subscribe(
      v => (this.taxonomyDescription = this.taxonomies.find(t => t.code === v)?.label.fr)
    );
    this.updateForm.controls.taxonomyCode.valueChanges.subscribe(
      v => (this.updatingTaxonomyDescription = this.taxonomies.find(t => t.code === v)?.label.fr)
    );

    this.updateForm.controls.nexoCode.valueChanges.subscribe(v => {
      if (this.isNexoCodeDuplicate(v)) {
        this.updateForm.controls.nexoCode.setErrors({ isNexoCodeDuplicate: true });
      }
    });
  }

  private addValidatorToForms(): void {
    this.creationForm.controls.nexoCode.setValidators(CustomValidators.nexoCodeDuplicate(this.taxonomies));
    // this.updateForm.controls.nexoCode.setValidators(CustomValidators.nexoCodeDuplicate(this.taxonomies));
  }

  public async createCorrespondance(): Promise<void> {
    markAllAsTouched(this.creationForm);
    if (this.creationForm.invalid) {
      return;
    }
    const code = this.creationForm.controls.taxonomyCode.value;
    const newNexoMatch: INexoCorrespondance = {
      code: this.creationForm.controls.nexoCode.value,
      description: this.creationForm.controls.nexoDescription.value
    };
    await this.addCorrespondanceToTaxonomy(code, newNexoMatch);
    this.isCreating = false;
    this.taxonomiesChanged$.next();
  }

  public async updateCorrespondance(correspondance: ITaxonomyCorrespondance): Promise<void> {
    if (!this.isModified(correspondance)) {
      this.editingCorrespondanceCode = null;
      return;
    }
    markAllAsTouched(this.updateForm);
    if (this.updateForm.invalid) {
      return;
    }
    if (this.updateForm.controls.taxonomyCode.value !== correspondance.agirCode) {
      const result = await this.showUpdateConfirmationModal();
      if (result !== ConfirmationModalCloseType.confirmed) {
        return;
      }

      await this.handleTaxonomyCodeUpdate(correspondance);
    } else {
      await this.handleRegularTaxonomyUpdate(correspondance);
    }

    this.taxonomiesChanged$.next();
    this.editingCorrespondanceCode = null;
  }

  public getMenuItems(correspondance: ITaxonomyCorrespondance): IMoreOptionsMenuItem[] {
    return [
      this.createEditTaxonomyCorrespondanceMenuItem(correspondance),
      this.createDeleteTaxonomyCorrespondanceMenuItem(correspondance)
    ];
  }

  public addCorrespondance(): void {
    this.creationForm.reset();
    this.editingCorrespondanceCode = null;
    this.isCreating = true;
  }

  public closeModification(): void {
    this.isCreating = false;
    this.editingCorrespondanceCode = null;
  }

  private isNexoCodeDuplicate(nexoCode: string): boolean {
    if (nexoCode === this.editingCorrespondanceCode) {
      return false;
    }

    const arrays = this.taxonomies.map(t => t.properties?.nexoMatches?.map(m => m.code.toUpperCase()));
    const codes = flatten(arrays);
    if (codes?.includes(nexoCode?.toUpperCase())) {
      return true;
    }
    return false;
  }

  private isModified(correspondance: ITaxonomyCorrespondance): boolean {
    const formValue = this.updateForm.value;
    return (
      correspondance.match.code !== formValue.nexoCode ||
      correspondance.match.description !== formValue.nexoDescription ||
      correspondance.agirCode !== formValue.taxonomyCode
    );
  }

  private createEditTaxonomyCorrespondanceMenuItem(correspondance: ITaxonomyCorrespondance): IMoreOptionsMenuItem {
    return {
      label: "Modifier l'élément",
      action: () => {
        this.updateForm.reset({
          nexoCode: correspondance.match.code,
          nexoDescription: correspondance.match.description,
          taxonomyCode: correspondance.agirCode
        });
        this.isCreating = false;
        this.editingCorrespondanceCode = correspondance.match.code;
      },
      permission: Permission.TAXONOMY_WRITE
    };
  }

  private createDeleteTaxonomyCorrespondanceMenuItem(correspondance: ITaxonomyCorrespondance): IMoreOptionsMenuItem {
    return {
      label: "Supprimer l'élément",
      action: async () => {
        const result = await this.showDeleteConfirmationModal();
        if (result === ConfirmationModalCloseType.confirmed) {
          await this.deleteTaxonomyCorrespondance(correspondance);
          this.taxonomiesChanged$.next();
        }
      },
      permission: Permission.TAXONOMY_WRITE
    };
  }

  private async deleteTaxonomyCorrespondance(correspondance: ITaxonomyCorrespondance): Promise<void> {
    const updatedTaxonomy = cloneDeep(this.taxonomies.find(t => t.code === correspondance.agirCode));
    const nexoMatchIndex = updatedTaxonomy.properties.nexoMatches.findIndex(
      match => match.code === correspondance.match.code
    );
    updatedTaxonomy.properties.nexoMatches.splice(nexoMatchIndex, 1);
    await this.taxonomiesService.update(updatedTaxonomy);
  }

  private async addCorrespondanceToTaxonomy(taxonomyCode: string, correspondance: INexoCorrespondance): Promise<void> {
    const taxonomy = this.taxonomies.find(t => t.code === taxonomyCode);
    const updatedTaxonomy = cloneDeep(taxonomy);
    if (updatedTaxonomy.properties?.nexoMatches) {
      updatedTaxonomy.properties.nexoMatches.push(correspondance);
    } else {
      const updatedProperties = Object.assign({}, updatedTaxonomy.properties, { nexoMatches: [correspondance] });
      updatedTaxonomy.properties = updatedProperties;
    }
    await this.taxonomiesService.update(updatedTaxonomy);
  }

  private async handleTaxonomyCodeUpdate(correspondance: ITaxonomyCorrespondance): Promise<void> {
    const updatedTaxonomyCode = this.updateForm.controls.taxonomyCode.value;

    await this.deleteTaxonomyCorrespondance(correspondance);

    const newNexoMatch: INexoCorrespondance = {
      code: this.updateForm.controls.nexoCode.value,
      description: this.updateForm.controls.nexoDescription.value
    };
    await this.addCorrespondanceToTaxonomy(updatedTaxonomyCode, newNexoMatch);
  }

  private async handleRegularTaxonomyUpdate(correspondance: ITaxonomyCorrespondance): Promise<void> {
    const updatedTaxonomy = cloneDeep(this.taxonomies.find(t => t.code === correspondance.agirCode));
    const correspondanceToUpdate = updatedTaxonomy.properties.nexoMatches.find(
      m => m.code === correspondance.match.code
    );

    correspondanceToUpdate.code = this.updateForm.controls.nexoCode.value;
    correspondanceToUpdate.description = this.updateForm.controls.nexoDescription.value;

    await this.taxonomiesService.update(updatedTaxonomy);
  }

  private async showUpdateConfirmationModal(): Promise<ConfirmationModalCloseType> {
    const modal = this.dialogsService.showModal(ConfirmationModalComponent);
    modal.componentInstance.title = "Modifier l'élément";
    modal.componentInstance.confirmLabel = 'Modifier';
    modal.componentInstance.message = NEXO_UPDATE_CONFIRMATION_MESSAGE;
    return modal.result;
  }

  private async showDeleteConfirmationModal(): Promise<any> {
    const modal = this.dialogsService.showModal(AlertModalComponent);
    modal.componentInstance.modalTitle = "Supprimer l'élément";
    modal.componentInstance.type = AlertType.warning;
    modal.componentInstance.buttonLabel = 'Annuler';
    modal.componentInstance.confirmLabel = 'Supprimer';
    modal.componentInstance.confirmButtonClass = 'btn-danger';
    modal.componentInstance.alertMessage = NEXO_DELETE_CONFIRMATION_MESSAGE;
    return modal.result;
  }
}
