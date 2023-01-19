import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ITaxonomy,
  ITaxonomyAssetTypeDataKey,
  ITaxonomyList,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, filter, find, orderBy, set } from 'lodash';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CloseType } from 'src/app/program-book/program-book-modal/program-book-modal.component';
import { AlertType } from 'src/app/shared/alerts/alert/alert.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { AlertModalComponent } from 'src/app/shared/forms/alert-modal/alert-modal.component';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { RtuProjectCategory } from 'src/app/shared/models/rtu-project-category';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { REGEX_NO_WHITE_SPACE } from '../../shared/utils/utils';

interface IRtuProjectCategory {
  code: string;
  label: string;
}
@Component({
  selector: 'app-taxonomy-group-item-modal',
  templateUrl: './taxonomy-group-item-modal.component.html',
  styleUrls: ['./taxonomy-group-item-modal.component.scss']
})
export class TaxonomyGroupItemModalComponent extends BaseComponent implements OnInit {
  public TaxonomyGroup = TaxonomyGroup;

  @Input() public buttonLabel: string;

  public form: FormGroup;
  public title: string;
  public taxonomy: ITaxonomy;
  public group: ITaxonomy;
  public submitting = false;
  public requestors$: Observable<ITaxonomy[]>;
  public owners$: Observable<ITaxonomy[]>;
  public workTypes$: Observable<ITaxonomy[]>;
  public assetDataKeys$: Observable<ITaxonomy[]>;
  public units$: Observable<ITaxonomyList[]>;
  public selectableAssetDataKeys: ITaxonomy[];
  public selectableUnits: ITaxonomy[];
  public infoRtuPartnerCategories: IRtuProjectCategory[];
  public requirementsType: ITaxonomyList;
  public submissionRequirementsSubType: ITaxonomyList;
  public submissionRequirementsType: ITaxonomyList;
  public rtuProjectStatus: ITaxonomyList;
  public rtuProjectPhase: ITaxonomyList;
  private originalConsultationOnly: boolean;
  public assetDataKeySearchModel: string;

  public get isUpdating(): boolean {
    return !!this.taxonomy;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogsService: DialogsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly notificationsService: NotificationsService,
    private readonly activeModal: NgbActiveModal
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    this.loadTaxonomies();
    this.createForm();
    this.infoRtuPartnerCategories = [
      {
        code: RtuProjectCategory.partner,
        label: 'Partenaire'
      },
      {
        code: RtuProjectCategory.borough,
        label: 'Arrondissement'
      },
      {
        code: RtuProjectCategory.city,
        label: 'Ville liée'
      }
    ];
    const rtuProjectStatusTaxonomy = await this.taxonomiesService.getTaxonomyByGroup(
      this.TaxonomyGroup.rtuProjectStatus
    );
    const requirementType = await this.taxonomiesService.getTaxonomyByGroup(this.TaxonomyGroup.requirementType);
    this.requirementsType = requirementType.items;
    const submissionRequirementSubtype = await this.taxonomiesService.getTaxonomyByGroup(
      this.TaxonomyGroup.submissionRequirementSubtype
    );
    this.submissionRequirementsSubType = submissionRequirementSubtype.items;
    const submissionRequirementType = await this.taxonomiesService.getTaxonomyByGroup(
      this.TaxonomyGroup.submissionRequirementType
    );
    this.submissionRequirementsType = submissionRequirementType.items;
    this.rtuProjectStatus = rtuProjectStatusTaxonomy.items;
    const rtuProjectPhaseTaxonomy = await this.taxonomiesService.getTaxonomyByGroup(this.TaxonomyGroup.rtuProjectPhase);
    this.rtuProjectPhase = rtuProjectPhaseTaxonomy.items;
  }

  public loadTaxonomies(): void {
    this.owners$ = this.taxonomiesService.group(TaxonomyGroup.assetOwner).pipe(take(1));
    this.requestors$ = this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(take(1));
    this.workTypes$ = this.taxonomiesService.group(TaxonomyGroup.workType).pipe(take(1));
    this.assetDataKeys$ = this.taxonomiesService.group(TaxonomyGroup.assetDataKey).pipe(take(1));
    this.units$ = this.taxonomiesService.groups(TaxonomyGroup.area, TaxonomyGroup.length).pipe(take(1));
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    try {
      this.submitting = true;
      if (this.isUpdating) {
        await this.updateTaxonomy();
      } else {
        await this.createTaxonomy();
      }
    } catch (e) {
      throw e;
    } finally {
      this.submitting = false;
    }
  }

  private async createTaxonomy(): Promise<void> {
    const plainTaxonomy = this.getPlainTaxonomy();
    await this.taxonomiesService.create(plainTaxonomy);
    this.taxonomy = plainTaxonomy;
    this.notificationsService.showSuccess('Taxonomie ajoutée');
    this.activeModal.close(CloseType.accepted);
  }

  private async updateTaxonomy(): Promise<void> {
    const plainTaxonomy = this.getPlainTaxonomy();

    if (this.canShowConsultationOnlyWarning()) {
      this.activeModal.close();
      const result = await this.showConsultationOnlyWarning();
      if (!result) {
        plainTaxonomy.properties.consultationOnly = this.taxonomy.properties.consultationOnly;
        await this.showModal(plainTaxonomy);
        return null;
      }
    }

    try {
      await this.taxonomiesService.update(plainTaxonomy);
      this.taxonomy = plainTaxonomy;
      this.notificationsService.showSuccess('Taxonomie modifiée');
      this.activeModal.close();
    } catch (e) {
      if (this.canShowConsultationOnlyWarning()) {
        await this.showModal(plainTaxonomy);
      }
      throw e;
    }
  }

  private mapPropertiesToForm(
    taxonomy: ITaxonomy,
    properties: string[],
    controlNames: string[],
    taxonomyGroups?: TaxonomyGroup[]
  ): void {
    if (taxonomyGroups?.includes(TaxonomyGroup.programType) || taxonomyGroups?.includes(TaxonomyGroup.service)) {
      taxonomy.properties = {
        acronym: {}
      };
    }
    if (
      taxonomyGroups?.includes(TaxonomyGroup.borough) ||
      taxonomyGroups?.includes(TaxonomyGroup.city) ||
      taxonomyGroups?.includes(TaxonomyGroup.bridge) ||
      taxonomyGroups?.includes(TaxonomyGroup.projectStatus)
    ) {
      taxonomy.properties = {
        rtuData: {}
      };
    }
    if (taxonomyGroups?.includes(TaxonomyGroup.assetType)) {
      taxonomy.properties = {
        workTypes: []
      };
    }
    if (taxonomyGroups?.includes(TaxonomyGroup.assetDataKey)) {
      taxonomy.properties = {
        unit: {}
      };
    }
    if (taxonomyGroups?.includes(TaxonomyGroup.requirementSubtype)) {
      taxonomy.properties = {
        requirementSubtype: {},
        relatedDesignRequirement: {}
      };
    }
    properties.forEach((element, index) => {
      const formValue = this.form.controls[controlNames[index]].value || null;
      set(taxonomy.properties, element, formValue);
    });
  }

  private getPlainTaxonomy(): ITaxonomy {
    let taxonomy: ITaxonomy;
    if (this.isUpdating) {
      taxonomy = cloneDeep(this.taxonomy);
    } else {
      taxonomy = this.generatePlainTaxonomy();
    }
    taxonomy.label.fr = this.form.controls.labelfr.value;
    taxonomy.label.en = this.form.controls.labelen.value;
    return this.mapFormToTaxonomy(taxonomy);
  }
  private mapFormToTaxonomy(taxonomy: ITaxonomy): ITaxonomy {
    switch (this.group.code) {
      case TaxonomyGroup.externalResource:
        this.mapPropertiesToForm(taxonomy, ['url'], ['url']);
        break;
      case TaxonomyGroup.programType:
        this.mapPropertiesToForm(
          taxonomy,
          ['acronym.fr', 'acronym.en', 'rtuData.value', 'rtuData.definition'],
          ['acronymfr', 'acronymen', 'rtuDataValue', 'rtuDataDefinition'],
          [TaxonomyGroup.programType]
        );
        break;
      case TaxonomyGroup.requestor:
        this.mapPropertiesToForm(taxonomy, ['isInternal'], ['isInternal']);
        break;
      case TaxonomyGroup.service:
        this.mapPropertiesToForm(
          taxonomy,
          ['acronym.fr', 'acronym.en', 'requestors'],
          ['acronymfr', 'acronymen', 'requestors'],
          [TaxonomyGroup.service]
        );
        break;
      case TaxonomyGroup.assetDataKey:
        this.mapPropertiesToForm(
          taxonomy,
          ['geomaticKey', 'assetKey', 'unit'],
          ['geomaticKey', 'assetKey', 'unit'],
          [TaxonomyGroup.assetDataKey]
        );
        break;
      case TaxonomyGroup.infoRtuPartner:
        this.mapPropertiesToForm(taxonomy, ['category'], ['category']);
        break;
      case TaxonomyGroup.requirementSubtype:
        this.mapPropertiesToForm(
          taxonomy,
          ['requirementType', 'relatedDesignRequirement'],
          ['requirementsType', 'submissionRequirementsSubType'],
          [TaxonomyGroup.requirementSubtype]
        );
        break;
      case TaxonomyGroup.submissionRequirementSubtype:
        this.mapPropertiesToForm(
          taxonomy,
          ['requirementType'],
          ['submissionRequirementsType'],
          [TaxonomyGroup.submissionRequirementSubtype]
        );
        break;
      case TaxonomyGroup.borough:
      case TaxonomyGroup.city:
        this.mapPropertiesToForm(
          taxonomy,
          ['rtuData.id', 'rtuData.name', 'rrvaNumArrPti'],
          ['rtuDataId', 'rtuDataName', 'rrva'],
          [TaxonomyGroup.borough, TaxonomyGroup.city]
        );
        break;
      case TaxonomyGroup.bridge:
        this.mapPropertiesToForm(taxonomy, ['rtuData.id', 'rtuData.name'], ['rtuDataId', 'rtuDataName']);
        break;
      case TaxonomyGroup.projectStatus:
        this.mapPropertiesToForm(
          taxonomy,
          ['rtuData.status', 'rtuData.phase'],
          ['rtuDataStatus', 'rtuDataPhase'],
          [TaxonomyGroup.projectStatus]
        );
        break;
      case TaxonomyGroup.assetType:
        this.mapPropertiesToForm(
          taxonomy,
          ['consultationOnly', 'owners', 'dataKeys', 'workTypes'],
          ['isConsultationOnly', 'owners', 'dataKeys', 'workTypes'],
          [TaxonomyGroup.assetType]
        );

        break;
      default:
    }
    return taxonomy;
  }

  private generatePlainTaxonomy(): ITaxonomy {
    const taxonomy: ITaxonomy = {
      group: this.group.code,
      code: this.form.controls.code.value,
      label: {}
    };

    if (
      [
        TaxonomyGroup.externalResource,
        TaxonomyGroup.infoRtuPartner,
        TaxonomyGroup.projectStatus,
        TaxonomyGroup.programType,
        TaxonomyGroup.requestor,
        TaxonomyGroup.service,
        TaxonomyGroup.assetDataKey,
        TaxonomyGroup.assetType,
        TaxonomyGroup.requirementSubtype,
        TaxonomyGroup.submissionRequirementSubtype
      ].includes(this.group.code as TaxonomyGroup)
    ) {
      taxonomy.properties = {};
    }

    if (this.group.code === TaxonomyGroup.programType || this.group.code === TaxonomyGroup.service) {
      taxonomy.properties.acronym = {};
    }
    if (this.group.code === TaxonomyGroup.programType) {
      taxonomy.properties.rtuData = {};
    }
    if (this.group.code === TaxonomyGroup.requirementSubtype) {
      taxonomy.properties.relatedDesignRequirement = {};
    }
    return taxonomy;
  }

  private addProgramTypeFormControl(taxonomy): void {
    this.form.addControl('acronymfr', new FormControl(this.isUpdating ? taxonomy.properties?.acronym?.fr : null));
    this.form.addControl('acronymen', new FormControl(this.isUpdating ? taxonomy.properties?.acronym?.en : null));
    this.form.addControl(
      'rtuDataValue',
      new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.value : null, Validators.required)
    );
    this.form.addControl(
      'rtuDataDefinition',
      new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.definition : null, Validators.required)
    );
  }
  private addServiceFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'acronymfr',
      new FormControl(this.isUpdating ? taxonomy.properties?.acronym?.fr : null, Validators.required)
    );
    this.form.addControl(
      'acronymen',
      new FormControl(this.isUpdating ? taxonomy.properties?.acronym?.en : null, Validators.required)
    );
    this.form.addControl(
      'requestors',
      new FormControl(this.isUpdating ? taxonomy.properties?.requestors : null, Validators.required)
    );
  }
  private addProjectStatuFormControls(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'rtuDataStatus',
      new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.status : null, Validators.required)
    );
    this.form.addControl(
      'rtuDataPhase',
      new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.phase : null, Validators.required)
    );
  }
  private addBridgeAndCityFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'rtuDataName',
      new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.name : null, Validators.required)
    );
    this.form.addControl(
      'rtuDataId',
      new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.id : null, Validators.required)
    );
    this.form.addControl(
      'rrva',
      new FormControl(this.isUpdating ? taxonomy.properties?.rrvaNumArrPti : null, Validators.required)
    );
  }
  private addBoroughFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl('rtuDataName', new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.name : null));
    this.form.addControl('rtuDataId', new FormControl(this.isUpdating ? taxonomy.properties?.rtuData?.id : null));
    this.form.addControl('rrva', new FormControl(this.isUpdating ? taxonomy.properties?.rrvaNumArrPti : null));
  }
  private addRequirementTypeFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'requirementsType',
      new FormControl(this.isUpdating ? taxonomy.properties?.requirementType : null, Validators.required)
    );
    this.form.addControl(
      'submissionRequirementsSubType',
      new FormControl(this.isUpdating ? taxonomy.properties?.relatedDesignRequirement : null)
    );
  }

  private addSubmissionRequirementTypeFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'submissionRequirementsType',
      new FormControl(this.isUpdating ? taxonomy.properties?.requirementType : null, Validators.required)
    );
  }
  private addUrlFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'url',
      new FormControl(this.isUpdating ? taxonomy.properties?.url : null, Validators.required)
    );
  }
  private addCategoryFormControl(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'category',
      new FormControl(this.isUpdating ? taxonomy.properties?.category : null, Validators.required)
    );
  }
  private createForm(): void {
    const taxonomy = cloneDeep(this.taxonomy);
    this.form = this.fb.group({
      code: [null, [Validators.required, Validators.pattern(REGEX_NO_WHITE_SPACE)]],
      labelfr: [null, Validators.required],
      labelen: [null, Validators.required]
    });

    if (this.isUpdating) {
      this.form.reset({
        labelfr: taxonomy.label.fr,
        labelen: taxonomy.label.en
      });
      this.form.controls.code.reset({ value: taxonomy.code, disabled: true });
    }
    this.addFormControls(taxonomy);
  }

  private addFormControls(taxonomy: ITaxonomy): void {
    switch (this.group.code) {
      case TaxonomyGroup.externalResource:
        this.addUrlFormControl(taxonomy);
        break;
      case TaxonomyGroup.infoRtuPartner:
        this.addCategoryFormControl(taxonomy);
        break;
      case TaxonomyGroup.requirementSubtype:
        this.addRequirementTypeFormControl(taxonomy);
        break;
      case TaxonomyGroup.submissionRequirementSubtype:
        this.addSubmissionRequirementTypeFormControl(taxonomy);
        break;
      case TaxonomyGroup.borough:
        this.addBoroughFormControl(taxonomy);
        break;
      case TaxonomyGroup.bridge:
      case TaxonomyGroup.city:
        this.addBridgeAndCityFormControl(taxonomy);
        break;
      case TaxonomyGroup.projectStatus:
        this.addProjectStatuFormControls(taxonomy);
        break;
      case TaxonomyGroup.programType:
        this.addProgramTypeFormControl(taxonomy);
        break;
      case TaxonomyGroup.requestor:
        this.form.addControl('isInternal', new FormControl(this.isUpdating ? taxonomy.properties?.isInternal : null));
        break;
      case TaxonomyGroup.service:
        this.addServiceFormControl(taxonomy);
        break;
      case TaxonomyGroup.assetDataKey:
        this.initControlsForAssetDataKey(taxonomy);
        break;
      case TaxonomyGroup.assetType:
        this.initControlsForAssetType(taxonomy);
        break;
      default:
    }
  }
  /**
   * Create form controls when taxonomy group is assetDataKey
   * @param taxonomy
   */
  public initControlsForAssetDataKey(taxonomy: ITaxonomy): void {
    this.form.addControl(
      'geomaticKey',
      new FormControl(this.isUpdating ? taxonomy.properties?.geomaticKey : null, Validators.required)
    );
    this.form.addControl(
      'assetKey',
      new FormControl(this.isUpdating ? taxonomy.properties?.assetKey : null, Validators.required)
    );
    this.form.addControl('unit', new FormControl(this.isUpdating ? taxonomy.properties?.unit : null));
    this.loadUnitsListItems();
  }

  /**
   * Create form controls when taxonomy group is assetType
   * @param taxonomy
   */
  public initControlsForAssetType(taxonomy: ITaxonomy): void {
    this.originalConsultationOnly = taxonomy.properties?.consultationOnly;
    this.form.addControl(
      'isConsultationOnly',
      new FormControl(this.isUpdating ? taxonomy.properties?.consultationOnly : null)
    );
    this.form.addControl(
      'owners',
      new FormControl(this.isUpdating ? taxonomy.properties?.owners : null, Validators.required)
    );
    this.form.addControl('workTypes', new FormControl(this.isUpdating ? taxonomy.properties?.workTypes : null));
    this.form.addControl(
      'dataKeys',
      new FormControl(this.isUpdating ? this.orderByDisplayOrder(taxonomy.properties?.dataKeys) : null)
    );
    this.form.addControl('assetDataKeySearch', new FormControl(''));
    this.updateAssetDataKeysSearchOptions();
  }

  public reject(): void {
    this.activeModal.close(false);
  }

  public markConsultationDirty(): void {
    this.form.controls.isConsultationOnly.markAsDirty();
  }

  private canShowConsultationOnlyWarning(): boolean {
    const consultationOnly = this.form.get('isConsultationOnly');
    return consultationOnly
      ? consultationOnly.value !== this.originalConsultationOnly && consultationOnly.value
      : false;
  }

  private async showConsultationOnlyWarning(): Promise<any> {
    const modal = this.dialogsService.showModal(AlertModalComponent);
    modal.componentInstance.type = AlertType.warning;
    modal.componentInstance.buttonLabel = 'Annuler';
    modal.componentInstance.modalTitle = 'Modifier un élément de taxonomie';
    modal.componentInstance.confirmLabel = 'Modifier';
    modal.componentInstance.confirmButtonClass = 'btn-primary';
    modal.componentInstance.alertTitle = 'Attention !';
    modal.componentInstance.alertMessage =
      "Cette action va modifier les droits sur ce type d'actif. Il sera maintenant impossible de créer des objets à partir de cette couche. Êtes-vous certains d'appliquer cette action?";

    return modal.result;
  }

  private async showModal(taxonomy: ITaxonomy): Promise<any> {
    const modal = this.dialogsService.showModal(TaxonomyGroupItemModalComponent);
    modal.componentInstance.buttonLabel = this.buttonLabel;
    modal.componentInstance.title = this.title;
    modal.componentInstance.taxonomy = taxonomy;
    modal.componentInstance.group = this.group;

    await modal.result;
  }

  private updateAssetDataKeysSearchOptions(): void {
    const dataKeys = cloneDeep(this.form.controls.dataKeys.value);
    this.assetDataKeys$.subscribe(assetDataKeys => {
      this.selectableAssetDataKeys = filter(
        assetDataKeys,
        assetDataKey => !find(dataKeys, dataKey => dataKey.code === assetDataKey.code)
      );
      this.form.controls.assetDataKeySearch.reset();
    });
  }

  private loadUnitsListItems(): void {
    this.units$.subscribe((groups: ITaxonomyList[]) => {
      this.selectableUnits = orderBy(groups[0].concat(groups[1]), ['label.fr'], ['asc']);
    });
  }

  public updateDataKey(dataKey: ITaxonomyAssetTypeDataKey): void {
    const dataKeys = this.form.controls.dataKeys.value;

    dataKeys.forEach(item => {
      if (item.code === dataKey.code) {
        item.displayOrder = dataKey.displayOrder;
        item.isMainAttribute = dataKey.isMainAttribute;
      }
    });
  }

  public removeDataKey(dataKey: ITaxonomyAssetTypeDataKey): void {
    let dataKeys = cloneDeep(this.form.controls.dataKeys.value);

    dataKeys = filter(dataKeys, item => item.code !== dataKey.code);

    if (!dataKeys.length) {
      dataKeys = null;
    }

    // Update value
    this.form.controls.dataKeys.setValue(dataKeys);

    // Update available search options
    this.updateAssetDataKeysSearchOptions();
  }

  public async addDataKey(value: string): Promise<void> {
    // Find value
    const assetDataKeys = await this.assetDataKeys$.toPromise();
    const assetDataKey = find(assetDataKeys, item => item.code === value);
    const dataKeys = cloneDeep(this.form.controls.dataKeys.value) || [];

    if (assetDataKey) {
      let highest: number = 0;
      // Get highest display order already present
      if (dataKeys.length) {
        highest = dataKeys.map(item => item.displayOrder).reduce((a, b) => Math.max(a, b));
      }

      // increase display order
      highest++;

      // Add a data key
      dataKeys.unshift({
        code: assetDataKey.code,
        isMainAttribute: false,
        displayOrder: highest
      });

      // Update value
      this.form.controls.dataKeys.setValue(dataKeys);

      // Update available search options
      this.updateAssetDataKeysSearchOptions();
    }
  }

  public orderByDisplayOrder(array: ITaxonomyAssetTypeDataKey[]): ITaxonomyAssetTypeDataKey[] {
    return orderBy(array, ['displayOrder'], ['asc']);
  }
}
