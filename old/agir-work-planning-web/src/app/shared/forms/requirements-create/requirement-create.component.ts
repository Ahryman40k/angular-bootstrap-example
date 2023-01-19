import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IConflictualItem,
  IConflictualType,
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionSearchRequest,
  InterventionStatus,
  IProjectSearchRequest,
  IRequirement,
  ITaxonomy,
  ITaxonomyList,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { omit } from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, take, takeUntil } from 'rxjs/operators';

import { arrayUtils } from '../../arrays/array.utils';
import { BaseComponent } from '../../components/base/base.component';
import { BtnLabel } from '../../models/btn-label';
import { ObjectType } from '../../models/object-type/object-type';
import { IRquirement } from '../../models/requirements/requirement-model';
import { InterventionService } from '../../services/intervention.service';
import { ObjectTypeService } from '../../services/object-type.service';
import { ProjectService } from '../../services/project.service';
import { RequirementService } from '../../services/requirement.service';
import { SearchObjectResults, SearchObjectsService } from '../../services/search-objects.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { RestrictionType, UserRestrictionsService } from '../../user/user-restrictions.service';

const CONFLICTUAL_PAIR_LENGTH = 2;
const SEARCH_RESULTS_MAX_LENGTH = 10;
interface ISelectedObject extends IConflictualItem {
  data: IEnrichedProject | IEnrichedIntervention;
}
interface IISubTypeForSelect {
  label: { en: string; fr: string };
  subTypes: ITaxonomy[];
}
@Component({
  selector: 'app-requirement-create',
  templateUrl: './requirement-create.component.html'
})
export class RequirementCreateComponent extends BaseComponent implements OnInit {
  @Input() public object: IEnrichedProject | IEnrichedIntervention;

  public formValid = new EventEmitter<boolean>();

  public form: FormGroup;
  public selectedObjects: ISelectedObject[] = [];
  public ObjectType = ObjectType;
  @Input() public requirement: IRequirement;
  @Input() public project: IEnrichedProject;
  @Input() public intervention: IEnrichedIntervention;

  public btnLabel = BtnLabel.selected;
  // Taxonomies
  public requirementSubtype: ITaxonomy[];
  public requirementTypes: ITaxonomy[];
  public requirementSubtypeForSelect: IISubTypeForSelect[] = [];
  public readonly disabledSearchObjectTypes = [ObjectType.address, ObjectType.asset, ObjectType.submissionNumber];
  public conflictualPair: IConflictualItem[] = [];
  private readonly subTypeSubject = new BehaviorSubject<ITaxonomy[]>(null);
  public subTypes$ = this.subTypeSubject.asObservable();
  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly fb: FormBuilder,
    private readonly searchObjectsService: SearchObjectsService,
    public objectTypeService: ObjectTypeService,
    public userRestrictionsService: UserRestrictionsService,
    private readonly requirementService: RequirementService,
    private readonly projectService: ProjectService,
    private readonly interventionService: InterventionService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.taxonomiesService
      .group(TaxonomyGroup.requirementSubtype)
      .pipe(take(1))
      .subscribe(subtypeData => {
        this.requirementSubtype = subtypeData;
        // group subTypes by type for the select exemple works : rehabEgBeforePrcpr , Travaux ESP avant PCPR
        const groupedRequirementSubtype = arrayUtils.groupBy(
          this.requirementSubtype,
          element => element.properties.requirementType
        );
        this.taxonomiesService
          .group(TaxonomyGroup.requirementType)
          .pipe(take(1))
          .subscribe(typeData => {
            this.requirementTypes = typeData;
            this.requirementTypes.forEach((type, i) => {
              if (groupedRequirementSubtype.get(type?.code)) {
                this.requirementSubtypeForSelect.push({
                  label: { en: type.label.en, fr: type.label.fr },
                  subTypes: groupedRequirementSubtype.get(type.code)
                });
              }
            });
          });
      });
    this.createForm();
    if (this.requirement) {
      this.initConflictualItemData();
      this.assignForm();
    }
    this.form.controls.subType.valueChanges.subscribe(element => {
      const selectedRequirementType = this.requirementTypes.filter(e => e.code === element.properties.requirementType);
      this.form.controls.type.setValue(selectedRequirementType[0]);
    });
    this.form.valueChanges.subscribe(() => {
      this.requirementService.setCreationFormStatus(this.form.valid);
    });
  }

  private createForm(): FormGroup {
    this.form = this.fb.group({
      type: [null, Validators.required],
      subType: [null, Validators.required],
      description: [null, Validators.required]
    });
    return this.form;
  }
  private assignForm(): void {
    this.form.reset({
      type: this.requirementTypes.find(e => e.code === this.requirement.typeId),
      subType: this.requirementSubtype.find(e => e.code === this.requirement.subtypeId),
      description: this.requirement.text
    });
    this.requirementService.setCreationFormStatus(this.form.valid);
  }
  private initConflictualItemData(): void {
    let object: IEnrichedIntervention | IEnrichedProject = {};
    this.requirement.items.forEach(async item => {
      if (item.type === ObjectType.project) {
        object = await this.projectService.getProject(item.id);
      } else {
        object = await this.interventionService.getIntervention(item.id);
      }
      if (object.id === this.object.id) {
        this.selectedObjects.unshift(this.createConflictualItemObject(object));
      } else {
        this.selectedObjects.push(this.createConflictualItemObject(object));
      }
    });
    this.toggleBtnLabel();
  }
  public selectItem(event: IEnrichedIntervention | IEnrichedProject): void {
    this.resetSelectedObjects();
    const object = this.createConflictualItemObject(event);
    this.selectedObjects.push(object);
    this.toggleBtnLabel();
  }

  private toggleBtnLabel(): void {
    if (this.btnLabel === BtnLabel.selected) {
      this.btnLabel = BtnLabel.remove;
    } else {
      this.btnLabel = BtnLabel.selected;
    }
  }

  public handleConflictualPair(event: IEnrichedIntervention | IEnrichedProject, index: number): void {
    if (this.btnLabel === BtnLabel.remove) {
      this.selectedObjects.splice(index, 1);
    } else {
      const object = this.createConflictualItemObject(event);
      this.selectedObjects.splice(1, 0, object);
      this.selectedObjects.splice(2, this.selectedObjects.length - CONFLICTUAL_PAIR_LENGTH);
    }
    this.toggleBtnLabel();
  }

  private resetSelectedObjects(): void {
    this.selectedObjects.length = 1;
    this.btnLabel = BtnLabel.selected;
  }
  public get defaultInterventionSearchRequest$(): Observable<IInterventionSearchRequest> {
    return this.taxonomiesService.groups(TaxonomyGroup.borough, TaxonomyGroup.requestor, TaxonomyGroup.executor).pipe(
      map(([boroughs, requestors, executors]) => {
        return {
          boroughId: this.getSearchValuesForRestrictionType(boroughs, RestrictionType.BOROUGH),
          requestorId: this.getSearchValuesForRestrictionType(requestors, RestrictionType.REQUESTOR),
          executorId: this.getSearchValuesForRestrictionType(executors, RestrictionType.EXECUTOR)
        };
      })
    );
  }
  public get defaultProjectSearchRequest$(): Observable<IProjectSearchRequest> {
    return this.taxonomiesService.groups(TaxonomyGroup.borough, TaxonomyGroup.executor).pipe(
      map(([boroughs, executors]) => {
        return {
          boroughId: this.getSearchValuesForRestrictionType(boroughs, RestrictionType.BOROUGH),
          executorId: this.getSearchValuesForRestrictionType(executors, RestrictionType.EXECUTOR)
        };
      })
    );
  }
  private getSearchValuesForRestrictionType(taxonomyList: ITaxonomyList, restrictionType: RestrictionType): string[] {
    return this.userRestrictionsService.hasRestrictionOnType(restrictionType)
      ? this.userRestrictionsService.filterTaxonomies(taxonomyList, restrictionType).map(el => el.code)
      : undefined;
  }
  public searchObjects(term: string): Observable<{}[]> {
    if (!term?.replace(/\s/g, '').length) {
      return undefined;
    }
    combineLatest([this.defaultInterventionSearchRequest$, this.defaultProjectSearchRequest$])
      .pipe(
        switchMap(([defaultInterventionSearchRequest, defaultProjectSearchRequest]) => {
          return this.searchObjectsService.searchObjects({
            limit: SEARCH_RESULTS_MAX_LENGTH,
            term,
            defaultInterventionSearchRequest,
            defaultProjectSearchRequest,
            options: { disabledObjectTypes: this.disabledSearchObjectTypes }
          });
        }),
        takeUntil(this.destroy$),
        map((results: SearchObjectResults) => {
          return arrayUtils.firstNOfArrays(results, SEARCH_RESULTS_MAX_LENGTH) as [];
        })
      )
      .subscribe(items => {
        this.assignConflictualItemObject(items);
      });
  }
  public filterSearchResults = (results: (IEnrichedProject | IEnrichedIntervention)[]) => {
    return results?.filter(element => element.id !== this.object.id && this.isObjectWithValidStatus(element.status));
  };

  private assignConflictualItemObject(objects: (IEnrichedIntervention | IEnrichedProject)[]): void {
    this.resetSelectedObjects();
    objects.forEach(item => {
      this.selectedObjects.push(this.createConflictualItemObject(item));
    });
    this.selectedObjects = this.selectedObjects.filter(
      e => e.id !== this.object.id && this.isObjectWithValidStatus(e.data.status)
    );
  }

  public isObjectWithValidStatus(status: string): boolean {
    const invalidStatuses: string[] = [InterventionStatus.waiting, InterventionStatus.wished, ProjectStatus.canceled];
    return !invalidStatuses.includes(status);
  }
  protected createConflictualItemObject(object: IEnrichedProject | IEnrichedIntervention): ISelectedObject {
    const objectType = this.objectTypeService.getObjectTypeFromModel(object);
    return {
      id: object.id,
      data: object,
      type: objectType as IConflictualType
    };
  }

  public getDataRequirement(): IRquirement {
    const requirementUpsert = {
      typeId: this.form.controls.type.value.code,
      subtypeId: this.form.controls.subType.value.code,
      text: this.form.controls.description.value,
      items: this.selectedObjects.length === 2 ? [omit(this.selectedObjects[1], ['data'])] : []
    };
    return requirementUpsert;
  }
}
