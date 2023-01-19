import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  INexoImportFile,
  INexoImportLog,
  ITaxonomy,
  NexoFileType,
  NexoImportStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import {
  IImportResults,
  ImportNexoService,
  IOptionalImportResults,
  startImportResponse
} from 'src/app/shared/services/import-nexo.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

const ALLOWED_FILE_EXTENSIONS = ['csv', 'xlsx'];
const UPDATE_STATUS_BAR_INTERVAL_MS = 6000;
const IMPORT_STEPS: IImportStep[] = [
  {
    label: `Démarrage de l'importation`,
    percentage: 0
  },
  {
    label: `Validation des fichiers d'importation`,
    percentage: 15
  },
  {
    label: `Validation des entrées d'importation`,
    percentage: 30
  },
  {
    label: `Importation des données`,
    percentage: 100
  }
];
interface IImportStep {
  label: string;
  percentage: number;
}
@Component({
  selector: 'app-import-nexo',
  templateUrl: './import-nexo.component.html',
  styleUrls: ['./import-nexo.component.scss']
})
export class ImportNexoComponent implements OnInit, OnDestroy {
  public readonly DIVISOR_MO = 1000000;
  public form: FormGroup;
  public firstNexoImportLog: INexoImportLog;
  public budgetNexoImportLog: INexoImportLog;
  public lastNexoImportLog: INexoImportLog;
  public nexoFileTypeTaxonomies: ITaxonomy[] = [];
  public nexoImportStatusTaxonomies: ITaxonomy[] = [];
  public importResults: IImportResults = {
    interventionsToImport: 0,
    createdInterventions: 0,
    updatedInterventions: 0,
    canceledInterventions: 0,
    errorInterventions: 0
  };

  public importBudgetResults: IOptionalImportResults = {
    interventionsToImport: 0,
    updatedInterventions: 0,
    errorInterventions: 0
  };
  public importRehabAqueductResults: IOptionalImportResults = {
    interventionsToImport: 0,
    updatedInterventions: 0,
    errorInterventions: 0
  };
  public importRehabEgoutResults: IOptionalImportResults = {
    interventionsToImport: 0,
    updatedInterventions: 0,
    errorInterventions: 0
  };
  public title: string;

  public isImportInProgress = false;
  public isImportFailed = false;
  public isImportSuccess = false;
  public canEditFileAndLaunchImport = true;

  private nexoImportLogLoaded = true;

  public currentStep: IImportStep = IMPORT_STEPS[0];
  public loadingPercentage: number = 0;

  constructor(
    public importNexoService: ImportNexoService,
    public notificationsService: NotificationsService,
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder
  ) {}

  public ngOnInit(): void {
    this.createForm();
  }

  public async launchImport(): Promise<void> {
    if (this.form.controls.waterServiceFile.invalid) {
      return;
    }
    this.isImportInProgress = false;
    this.isImportFailed = false;
    this.canEditFileAndLaunchImport = false;
    await this.updateFirstFile();
    if (this.form.controls.budgetFile.value && this.form.controls.budgetFile.valid && this.firstNexoImportLog.id) {
      await this.updateSecondaryFile(this.form.controls.budgetFile.value, NexoFileType.INTERVENTIONS_BUDGET_SE);
    } else {
      this.importBudgetResults = null;
    }
    if (
      this.form.controls.rehabAqueductFile.value &&
      this.form.controls.rehabAqueductFile.valid &&
      this.firstNexoImportLog.id
    ) {
      await this.updateSecondaryFile(this.form.controls.rehabAqueductFile.value, NexoFileType.REHAB_AQ_CONCEPTION);
    } else {
      this.importRehabAqueductResults = null;
    }
    if (
      this.form.controls.rehabEgoutFile.value &&
      this.form.controls.rehabEgoutFile.valid &&
      this.firstNexoImportLog.id
    ) {
      await this.updateSecondaryFile(this.form.controls.rehabEgoutFile.value, NexoFileType.REHAB_EG_CONCEPTION);
    } else {
      this.importRehabEgoutResults = null;
    }
    await this.startImport();
  }

  public removeFile(control: AbstractControl): void {
    control.reset();
    this.form.updateValueAndValidity();
  }

  public finishImport(): void {
    if (this.isImportInProgress || this.isImportFailed || this.isImportSuccess) {
      this.importNexoService.refreshNexoImportHistorySubject.next();
    }
    this.activeModal.close();
  }

  private async updateFirstFile(): Promise<void> {
    try {
      this.firstNexoImportLog = await this.importNexoService.uploadNexoFile(this.form.controls.waterServiceFile.value);
    } catch (e) {
      if (e.error.error.code === 'DuplicateError') {
        this.notificationsService.showError('Importation impossible, une importation est déjà en attente ou en cours');
      } else {
        throw e;
      }
    }
  }

  private async updateSecondaryFile(fileValue: any, nexoFileType: NexoFileType): Promise<void> {
    try {
      await this.importNexoService.uploadSecondaryFile(fileValue, this.firstNexoImportLog.id, nexoFileType);
    } catch (e) {
      if (e.error.error.code === 'DuplicateError') {
        this.notificationsService.showError('Importation impossible, une importation est déjà en attente ou en cours');
      } else {
        throw e;
      }
    }
  }
  private async startImport(): Promise<void> {
    try {
      const response = await this.importNexoService.startImport(this.firstNexoImportLog.id);
      if (response === startImportResponse.ACCEPTED) {
        this.isImportInProgress = true;
        this.getNexoImportLogs(this.firstNexoImportLog);
      } else {
        this.isImportFailed = true;
      }
    } catch (e) {
      /* tslint:disable:no-empty */
    }
  }

  private createForm(): void {
    this.form = this.fb.group({
      waterServiceFile: [null, [Validators.required, CustomValidators.fileType(...ALLOWED_FILE_EXTENSIONS)]],
      budgetFile: [null, [CustomValidators.fileType(...ALLOWED_FILE_EXTENSIONS)]],
      rehabAqueductFile: [null, [CustomValidators.fileType(...ALLOWED_FILE_EXTENSIONS)]],
      rehabEgoutFile: [null, [CustomValidators.fileType(...ALLOWED_FILE_EXTENSIONS)]]
    });
  }

  private getNexoImportLogs(nexoImportLog: INexoImportLog): void {
    const interval = setInterval(async () => {
      if (this.nexoImportLogLoaded) {
        await this.getNexoImport(interval, nexoImportLog);
      }
    }, UPDATE_STATUS_BAR_INTERVAL_MS);
  }

  private async getNexoImport(interval: NodeJS.Timeout, nexoImportLog: INexoImportLog): Promise<void> {
    this.nexoImportLogLoaded = false;
    this.lastNexoImportLog = await this.importNexoService.getNexoImport(nexoImportLog.id);
    this.nexoImportLogLoaded = true;

    this.lastNexoImportLog.files.forEach(file => {
      if (file.type === NexoFileType.INTERVENTIONS_SE) {
        this.updateImportResults(file);
      }
      if (file.type === NexoFileType.INTERVENTIONS_BUDGET_SE) {
        this.updateImportBudgetResults(file);
      }
      if (file.type === NexoFileType.REHAB_AQ_CONCEPTION) {
        this.updateImportRehabAqueductResults(file);
      }
      if (file.type === NexoFileType.REHAB_EG_CONCEPTION) {
        this.updateImportRehabEgoutResults(file);
      }
    });

    if (this.lastNexoImportLog.status !== NexoImportStatus.IN_PROGRESS) {
      clearInterval(interval);
      this.updateImportResults(this.lastNexoImportLog.files[0]);
      this.updateImportStatuses(this.lastNexoImportLog);
    }
  }

  private updateImportStatuses(nexoImportLog: INexoImportLog): void {
    this.isImportInProgress = nexoImportLog.status === NexoImportStatus.IN_PROGRESS;
    this.isImportFailed = nexoImportLog.status === NexoImportStatus.FAILURE;
    this.isImportSuccess = nexoImportLog.status === NexoImportStatus.SUCCESS;
  }

  private updateImportResults(nexoImportFile: INexoImportFile): void {
    this.computeCurrentStep(nexoImportFile);
    this.importResults = this.importNexoService.getImportResults(nexoImportFile);
  }

  private updateImportBudgetResults(nexoImportFile: INexoImportFile): void {
    this.computeCurrentStep(nexoImportFile);
    this.importBudgetResults = this.importNexoService.getOptionalFileImportResults(nexoImportFile);
  }
  private updateImportRehabAqueductResults(nexoImportFile: INexoImportFile): void {
    this.computeCurrentStep(nexoImportFile);
    this.importRehabAqueductResults = this.importNexoService.getOptionalFileImportResults(nexoImportFile);
  }
  private updateImportRehabEgoutResults(nexoImportFile: INexoImportFile): void {
    this.computeCurrentStep(nexoImportFile);
    this.importRehabEgoutResults = this.importNexoService.getOptionalFileImportResults(nexoImportFile);
  }
  private computeCurrentStep(nexoImportFile: INexoImportFile): void {
    let stepIndex = 0;
    if (!nexoImportFile.numberOfItems) {
      stepIndex = 1;
    }
    if (nexoImportFile.numberOfItems && isEmpty(nexoImportFile.interventions)) {
      stepIndex = 2;
    }
    this.currentStep = IMPORT_STEPS[stepIndex];
    if (this.loadingPercentage < this.currentStep.percentage) {
      this.loadingPercentage++;
      return;
    }
    if (nexoImportFile.numberOfItems && !isEmpty(nexoImportFile.interventions)) {
      this.currentStep = IMPORT_STEPS[3];
      const calc = (nexoImportFile.interventions.length / nexoImportFile.numberOfItems) * 100;
      if (calc > IMPORT_STEPS[2].percentage) {
        this.loadingPercentage = calc;
        return;
      }
      if (this.loadingPercentage > IMPORT_STEPS[2].percentage) {
        this.loadingPercentage++;
        return;
      }
      this.loadingPercentage = IMPORT_STEPS[2].percentage++;
      return;
    }
  }

  public ngOnDestroy(): void {
    this.importNexoService.importResultsSubject.next(null);
  }
}
