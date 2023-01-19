import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IImportProjectRequest } from '@villemontreal/agir-work-planning-lib';
import { get } from 'lodash';
import { downloadText } from 'src/app/shared/files/utils';
import { IMappingResult } from 'src/app/shared/models/import/mapping-result';
import { SaveResult } from 'src/app/shared/models/import/save-result';
import { ImportInternalService } from 'src/app/shared/services/import-internal.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

enum LoadStatus {
  map = 'map',
  saving = 'saving',
  done = 'done'
}

@Component({
  selector: 'app-import-internal',
  templateUrl: './import-internal.component.html',
  styleUrls: ['./import-internal.component.scss'],
  host: {
    class: 'container'
  }
})
export class ImportInternalComponent implements OnInit {
  public form: FormGroup;
  public loadingPercentage = 0;
  public showProgress: boolean = false;
  public mappingResult: IMappingResult;
  public currentTotal = 0;
  public currentTotalGen = 0;
  public saveResult: SaveResult;
  public loadStatus: LoadStatus;

  public get isImportDone(): boolean {
    return this.loadStatus === LoadStatus.done;
  }

  constructor(private readonly fb: FormBuilder, private readonly importInternalService: ImportInternalService) {}

  public ngOnInit(): void {
    this.form = this.createForm();
  }

  public createForm(): FormGroup {
    const form = this.fb.group({
      excel: [null, [Validators.required, CustomValidators.fileType('.xls', '.xlsx')]],
      intersectionsdbf: [null, [Validators.required, CustomValidators.fileType('.dbf')]],
      intersectionsshp: [null, [Validators.required, CustomValidators.fileType('.shp')]],
      intervallesdbf: [null, [Validators.required, CustomValidators.fileType('.dbf')]],
      intervallesshp: [null, [Validators.required, CustomValidators.fileType('.shp')]],
      logosdbf: [null, [Validators.required, CustomValidators.fileType('.dbf')]],
      logosshp: [null, [Validators.required, CustomValidators.fileType('.shp')]]
    });
    return form;
  }

  /**
   * 1. Map the files to retrieve the BIC projects
   * 2. Save the BIC projects
   */
  public async launchImport(): Promise<void> {
    this.reset();
    try {
      this.form.disable({ emitEvent: false });

      this.loadStatus = LoadStatus.map;
      const form = this.form.value;
      this.mappingResult = await this.importInternalService.mapFiles(
        form.excel,
        { shp: form.intervallesshp, dbf: form.intervallesdbf },
        { shp: form.intersectionsshp, dbf: form.intersectionsdbf },
        { shp: form.logosshp, dbf: form.logosdbf }
      );

      this.showProgress = true;
      this.loadStatus = LoadStatus.saving;
      await this.importInternalService.postBicImportLog();
      await this.saveProjects(this.mappingResult.projectsWithFeatures);

      this.loadingPercentage = 100;
      this.loadStatus = LoadStatus.done;
    } catch (error) {
      this.reset();
      throw error;
    } finally {
      this.form.enable({ emitEvent: false });
    }
  }

  private async saveProjects(bicProjectsWithFeatures: IImportProjectRequest[]): Promise<void> {
    this.saveResult = new SaveResult();
    for (let i = 0; i < bicProjectsWithFeatures.length; i++) {
      const bicProjectGroup = bicProjectsWithFeatures[i];
      try {
        const project = await this.importInternalService.saveProject(bicProjectGroup);
        this.saveResult.successes.push(project);
      } catch (error) {
        this.catchSaveError(bicProjectGroup.bicProjects[0].ID_PROJET as string, error);
      }
      this.loadingPercentage = Math.ceil(((i + 1) / bicProjectsWithFeatures.length) * 100);
    }
  }

  public ceil(n: number): number {
    return Math.ceil(n);
  }

  public reportFailedMappings(): void {
    this.downloadJson('Projets sans lien.json', get(this.mappingResult, 'projectsWithoutFeatures'));
  }

  public reportSaveFailures(): void {
    this.downloadJson('Projets non-sauvegardes.json', get(this.saveResult, 'failures'));
  }

  private downloadJson(title: string, obj: any): void {
    if (!obj) {
      return;
    }
    const json = JSON.stringify(obj, undefined, 2);
    downloadText(title, json);
  }

  private reset(): void {
    this.loadingPercentage = 0;
    this.showProgress = false;
    this.mappingResult = null;
    this.currentTotal = 0;
    this.currentTotalGen = 0;
    this.saveResult = null;
    this.loadStatus = null;
  }

  private catchSaveError(bicProjectId: string, error: any): any {
    if (!(error instanceof HttpErrorResponse)) {
      throw error;
    }
    if (error.status === 400 || (error.status === 500 && error.error.error.message.indexOf('TopologyException'))) {
      this.saveResult.failures.push({
        bicProjectId,
        error: error.error.error
      });
    } else {
      throw error;
    }
  }
}
