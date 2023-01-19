import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ErrorCodes,
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IEnrichedProject,
  IPlainProgramBook,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { map, take, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

import { isEmpty } from 'lodash';
import { ErrorService } from 'src/app/shared/errors/error.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { RestrictionType, UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { apiErrorsToDictionaryError } from '../../shared/errors/utils';

export enum CloseType {
  accepted = 'accepted',
  rejected = 'rejected'
}

@Component({
  selector: 'app-program-book-modal',
  templateUrl: './program-book-modal.component.html',
  styleUrls: ['./program-book-modal.component.scss']
})
export class ProgramBookModalComponent extends BaseComponent implements OnInit {
  @Input() public title: string;
  @Input() public buttonLabel: string;

  public annualProgram: IEnrichedAnnualProgram;
  public form: FormGroup;
  public submitting = false;
  public programBook: IEnrichedProgramBook;
  public projects: IEnrichedProject[];
  public isPriorityScenarioUnsaved = false;
  public isProgramBookContainProjects = false;
  public boroughs$ = this.taxonomiesService.group(TaxonomyGroup.borough).pipe(
    take(1),
    map(taxonomyList => this.userRestrictionsService.filterTaxonomies(taxonomyList, RestrictionType.BOROUGH))
  );
  public projectTypes$ = this.taxonomiesService.group(TaxonomyGroup.projectType).pipe(take(1));
  public programTypes$ = this.taxonomiesService.group(TaxonomyGroup.programType).pipe(take(1));

  public hasRestrictionsOnBoroughs = this.userRestrictionsService.hasRestrictionOnType(RestrictionType.BOROUGH);

  public get isUpdating(): boolean {
    return !!this.programBook;
  }

  public get showPrograms(): boolean {
    return this.form.controls.projectTypes.value.includes(ProjectType.nonIntegrated);
  }

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly programBookService: ProgramBookService,
    private readonly notificationsService: NotificationsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly priorityScenarioService: PriorityScenarioService,
    private readonly dialogsService: DialogsService,
    private readonly errorsService: ErrorService,
    private readonly userRestrictionsService: UserRestrictionsService,
    private annualProgramService: AnnualProgramService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    if (this.isUpdating) {
      this.projects = await this.programBookService.getProgramBookProjects(this.programBook.id);
    }
    this.initForm();

    this.priorityScenarioService.priorityScenarioUnsaved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isPriorityScenarioUnsaved => {
        this.isPriorityScenarioUnsaved = isPriorityScenarioUnsaved;
      });
  }

  public cancel(): void {
    this.activeModal.close(CloseType.rejected);
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      boroughIds: [
        [],
        (this.hasRestrictionsOnBoroughs ? [Validators.required] : []).concat([CustomValidators.boroughs()])
      ],
      projectTypes: [[], [Validators.required, CustomValidators.programBookProjectTypes()]],
      inCharge: null,
      description: null
    });
    if (this.isUpdating) {
      this.form.reset({
        name: this.programBook.name,
        boroughIds: this.programBook.boroughIds,
        projectTypes: this.programBook.projectTypes,
        inCharge: this.programBook.inCharge,
        description: this.programBook.description
      });
      if (this.form.controls.projectTypes.value.includes(ProjectType.nonIntegrated)) {
        this.addProgramTypesControl(this.programBook.programTypes);
      }
      if (this.programBook.projects?.items?.length) {
        this.isProgramBookContainProjects = true;
        this.form.controls.projectTypes.disable();
        this.form.controls.programTypes?.disable();
        this.form.controls.boroughIds.disable();
      }
    }
    this.form.controls.projectTypes.valueChanges.subscribe((v: string[]) => {
      if (v.includes(ProjectType.nonIntegrated)) {
        this.addProgramTypesControl();
      } else if (this.form.controls.programTypes) {
        this.form.removeControl('programTypes');
      }
    });
  }

  private addProgramTypesControl(value?: string[]): void {
    this.form.addControl('programTypes', new FormControl(value || [], Validators.required));
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    this.submitting = true;
    try {
      if (this.isUpdating) {
        await this.updateProgramBook();
      } else {
        await this.createProgramBook();
      }
      this.activeModal.close(CloseType.accepted);
    } finally {
      this.submitting = false;
    }
  }

  public async createProgramBook(): Promise<void> {
    const formValue = this.form.value;
    const programBook: IPlainProgramBook = {
      name: formValue.name,
      inCharge: formValue.inCharge || null,
      projectTypes: formValue.projectTypes,
      programTypes: formValue.programTypes || null,
      boroughIds: formValue.boroughIds?.length ? formValue.boroughIds : null,
      description: formValue.description
    };
    await this.programBookService.createProgramBook(this.annualProgram.id, programBook);
    this.annualProgramService.updateAnnualprograms();
    this.notificationsService.showSuccess('Carnet de programmation créé');
  }

  public async updateProgramBook(): Promise<void> {
    const formValue = this.form.value;
    const plainProgramBook: Partial<IPlainProgramBook> = {
      name: formValue.name,
      inCharge: formValue.inCharge || null,
      projectTypes: this.isProgramBookContainProjects ? this.programBook.projectTypes : formValue.projectTypes,
      programTypes: this.isProgramBookContainProjects ? this.programBook.programTypes : formValue.programTypes || [],
      boroughIds: this.isProgramBookContainProjects
        ? this.programBook.boroughIds
        : formValue.boroughIds?.length
        ? formValue.boroughIds
        : null,
      description: formValue.description
    };
    try {
      await this.programBookService.patch(this.programBook, plainProgramBook);
      this.notificationsService.showSuccess('Carnet de programmation modifié');
    } catch (e) {
      const matchingErrors = apiErrorsToDictionaryError(e, this.errorsService, [
        ErrorCodes.ProgramBookProjectTypes,
        ErrorCodes.ProgramBookBoroughs,
        ErrorCodes.ProjectNoDrmNumber
      ]);
      if (!isEmpty(matchingErrors)) {
        this.dialogsService.showErrorModal(`Erreur lors de la modification`, matchingErrors);
      } else {
        throw e;
      }
    }
  }
}
