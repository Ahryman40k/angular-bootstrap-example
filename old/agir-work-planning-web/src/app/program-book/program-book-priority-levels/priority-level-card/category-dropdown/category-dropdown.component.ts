import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import {
  IProjectCategoryCriteria,
  ITaxonomy,
  ITaxonomyList,
  ProjectCategory
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IFilterTaxonomies } from 'src/app/program-book/program-book-priority-scenarios/program-book-priority-scenarios.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

@Component({
  selector: 'app-category-dropdown',
  templateUrl: './category-dropdown.component.html',
  styleUrls: ['./category-dropdown.component.scss']
})
export class CategoryDropdownComponent extends BaseComponent implements OnInit, AfterViewInit {
  @Input() public disabled = false;
  @Input() public projectCategoryCriteria: IProjectCategoryCriteria[];
  @Input() public priorityLevelCriteriaRemoved: Subject<void>;
  @Input() public priorityLevelRank: number;
  @Input() public taxonomies: IFilterTaxonomies;
  @Input() public index: number;

  @Output() public projectCategoryChange = new EventEmitter<IProjectCategoryCriteria[]>();
  @ViewChild(NgbDropdown) public dropdown: NgbDropdown;

  public get projectCategories(): FormArray {
    return this.form.controls.projectCategories as FormArray;
  }

  public get isSelected(): boolean {
    return !isEmpty(this.projectCategoryCriteria);
  }

  public form: FormGroup;
  public taxonomiesProjectCategories: ITaxonomyList;

  public availableCategories: ITaxonomyList[] = [];
  public availableSubCategories: ITaxonomyList[] = [];
  public MAX_NUMBER_SUB_CATEGORIES: number;
  public canAddNewCategory = false;

  constructor(private readonly fb: FormBuilder) {
    super();
  }

  public ngOnInit(): void {
    this.initVariables();
    this.updateTaxonomies();
    this.initForm();
    this.initOnFormChanges();
    this.updateAvailableOptions();
  }

  public ngAfterViewInit(): void {
    this.priorityLevelCriteriaRemoved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateForm();
      this.initOnFormChanges();
    });
  }

  private initVariables(): void {
    this.MAX_NUMBER_SUB_CATEGORIES = this.taxonomies.projectSubCategories.length;
  }

  private updateForm(): void {
    this.form.controls.projectCategories = this.fb.array([]);
    this.projectCategoryCriteria.forEach(projectCategory => {
      this.addProjectCategory(projectCategory);
      this.updateAvailableOptions();
    });
  }

  private updateTaxonomies(): void {
    if (this.priorityLevelRank === 1) {
      return;
    }
    this.taxonomiesProjectCategories = this.taxonomies.projectCategories.filter(
      pc => pc.code !== ProjectCategory.completing
    );
  }

  private initForm(): void {
    this.form = this.fb.group({
      projectCategories: this.fb.array([])
    });
    if (this.projectCategoryCriteria?.length > 0) {
      this.projectCategoryCriteria.forEach((projectCategory, i) => {
        this.addProjectCategory(projectCategory);
      });
      this.projectCategoryChange.emit(this.projectCategoryCriteria);
    } else {
      this.projectCategoryChange.emit([]);
    }
    this.updateCanAddNewCategory();
  }

  private initOnFormChanges(): void {
    this.projectCategories.valueChanges.subscribe((projectCategories: IProjectCategoryCriteria[]) => {
      this.updateAvailableOptions();
      this.updateCanAddNewCategory();
      this.emitProjectCategories(projectCategories);
    });
  }

  private updateAvailableOptions(): void {
    const categories: IProjectCategoryCriteria[] = this.projectCategories.value;
    this.projectCategories.value.forEach((projectCategory, i) => {
      const otherProjectCategories = this.getOtherProjectCategories(categories, projectCategory);
      this.availableCategories[i] = this.getAvailableCategories(otherProjectCategories);
      this.availableSubCategories[i] = this.getAvailableSubCategories(otherProjectCategories, projectCategory);
    });
  }

  private getAvailableCategories(otherProjectCategories: IProjectCategoryCriteria[]): ITaxonomy[] {
    const categoryGroups = otherProjectCategories.groupBy(opc => opc.category);
    return this.taxonomiesProjectCategories?.filter(category => {
      const selectedCategoriesLength = categoryGroups.find(cg => cg.key === category.code)?.items.length;
      const maxSubcategories = this.taxonomies.projectSubCategories.length;
      return selectedCategoriesLength !== maxSubcategories;
    });
  }

  private getAvailableSubCategories(
    otherProjectCategories: IProjectCategoryCriteria[],
    projectCategory: IProjectCategoryCriteria
  ): ITaxonomy[] {
    return this.taxonomies.projectSubCategories.filter(psc => {
      const categoryGroups = otherProjectCategories.groupBy(opc => opc.category);
      const otherSubCategories = categoryGroups
        .find(cg => cg.key === projectCategory.category)
        ?.items.map(i => i.subCategory);
      return !otherSubCategories?.includes(psc.code);
    });
  }

  private getOtherProjectCategories(
    categories: IProjectCategoryCriteria[],
    projectCategory: IProjectCategoryCriteria
  ): IProjectCategoryCriteria[] {
    return categories?.filter(
      c => c.category !== projectCategory.category || c.subCategory !== projectCategory.subCategory
    );
  }

  private emitProjectCategories(projectCategories: IProjectCategoryCriteria[]): void {
    if (projectCategories.some(pc => !pc.category && !pc.subCategory)) {
      return;
    }
    this.projectCategoryChange.emit(projectCategories);
  }

  public addProjectCategory(projectCategory?: IProjectCategoryCriteria): void {
    this.projectCategories.push(
      this.fb.group({
        category: [projectCategory?.category || null, [Validators.required]],
        subCategory: [projectCategory?.subCategory || null, [Validators.required]]
      })
    );
    this.updateAvailableOptions();
  }

  public removeProjectCategory(index: number): void {
    this.projectCategories.removeAt(index);
    this.availableSubCategories[index] = [];
    this.availableCategories[index] = [];
    this.updateAvailableOptions();
  }

  private updateCanAddNewCategory(): void {
    const maxNumberOfOptions = this.taxonomies.projectCategories.length * this.MAX_NUMBER_SUB_CATEGORIES;
    this.canAddNewCategory = this.projectCategories.length !== maxNumberOfOptions;
  }
}
