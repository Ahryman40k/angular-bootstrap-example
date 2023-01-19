import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { IServicePriority, ITaxonomy, ITaxonomyList } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IFilterTaxonomies } from 'src/app/program-book/program-book-priority-scenarios/program-book-priority-scenarios.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

@Component({
  selector: 'app-priority-service-dropdown',
  templateUrl: './priority-service-dropdown.component.html',
  styleUrls: ['./priority-service-dropdown.component.scss']
})
export class PriorityServiceDropdownComponent extends BaseComponent implements OnInit, AfterViewInit {
  @Input() public disabled = false;
  @Input() public taxonomies: IFilterTaxonomies;
  @Input() public servicePrioritiesCriteria: IServicePriority[];
  @Input() public priorityLevelCriteriaChanged: boolean;
  @Input() public index: number;

  @Output() public servicePrioritiesChange = new EventEmitter<IServicePriority[]>();

  @Input() public priorityLevelCriteriaRemoved: Subject<void>;

  @ViewChild(NgbDropdown) public dropdown: NgbDropdown;

  public availableServices: ITaxonomyList[] = [];
  public availablePriorities: ITaxonomyList[] = [];
  public MAX_NUMBER_PRIORITIES: number;
  public canAddNewService = false;

  public get servicePriorities(): FormArray {
    return this.form.controls.servicePriorities as FormArray;
  }

  public get isSelected(): boolean {
    return !isEmpty(this.servicePrioritiesCriteria);
  }

  public form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    super();
  }

  public ngOnInit(): void {
    this.initVariables();
    this.initForm();
    this.initOnFormChanges();
    this.updateAvailableServices();
  }

  public ngAfterViewInit(): void {
    this.priorityLevelCriteriaRemoved.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateForm();
      this.initOnFormChanges();
    });
  }

  private initVariables(): void {
    this.MAX_NUMBER_PRIORITIES = this.taxonomies.priorityTypes.length;
  }

  private initForm(): void {
    this.form = this.fb.group({
      servicePriorities: this.fb.array([])
    });
    if (this.servicePrioritiesCriteria?.length > 0) {
      this.servicePrioritiesCriteria.forEach((servicePriority, i) => {
        this.addServicePriority(servicePriority);
        this.availableServices[i] = this.taxonomies.services;
      });
      this.servicePrioritiesChange.emit(this.servicePrioritiesCriteria);
    } else {
      this.servicePrioritiesChange.emit([]);
    }
    this.updateCanAddNewService();
  }

  private updateForm(): void {
    this.form.controls.servicePriorities = this.fb.array([]);
    this.servicePrioritiesCriteria.forEach(servicePriority => {
      this.addServicePriority(servicePriority);
    });
  }

  private initOnFormChanges(): void {
    this.servicePriorities.valueChanges.subscribe((servicePriorities: IServicePriority[]) => {
      this.updateAvailableServices();
      this.updateCanAddNewService();
      if (servicePriorities.every(sp => sp.service && sp.priorityId)) {
        this.servicePrioritiesChange.emit(servicePriorities);
      }
    });
  }

  private updateAvailableServices(): void {
    const selectedServices: IServicePriority[] = this.servicePriorities.value;
    this.servicePriorities.value.forEach((servicePriority, i) => {
      const otherSelectedServices = this.getOtherSelectedServices(servicePriority, selectedServices);
      this.availableServices[i] = this.getAvailableServices(otherSelectedServices);
      this.availablePriorities[i] = this.getAvailablePriorities(servicePriority, otherSelectedServices);
    });
  }

  private getOtherSelectedServices(
    servicePriority: IServicePriority,
    selectedServices: IServicePriority[]
  ): IServicePriority[] {
    return selectedServices?.filter(
      ss => ss.service !== servicePriority.service || ss.priorityId !== servicePriority.priorityId
    );
  }

  private getAvailablePriorities(
    servicePriority: IServicePriority,
    otherSelectedServices: IServicePriority[]
  ): ITaxonomy[] {
    const serviceGroups = otherSelectedServices.groupBy(oss => oss.service);
    return this.taxonomies.priorityTypes.filter(pt => {
      const otherPriorities = serviceGroups
        .find(sg => sg.key === servicePriority.service)
        ?.items.map(i => i.priorityId);
      return !otherPriorities?.includes(pt.code);
    });
  }

  private getAvailableServices(otherSelectedServices: IServicePriority[]): ITaxonomy[] {
    const serviceGroups = otherSelectedServices.groupBy(oss => oss.service);
    return this.taxonomies.services.filter(service => {
      const selectedPrioritiesLength = serviceGroups.find(sg => sg.key === service.code)?.items.length;
      return selectedPrioritiesLength !== this.MAX_NUMBER_PRIORITIES;
    });
  }

  public addServicePriority(servicePriority?: IServicePriority): void {
    this.servicePriorities.push(
      this.fb.group({
        service: [servicePriority?.service || null, [Validators.required]],
        priorityId: [servicePriority?.priorityId || null, [Validators.required]]
      })
    );
    this.availableServices[this.servicePriorities.length - 1] = this.taxonomies.services;
    this.updateAvailableServices();
  }

  public removeServicePriority(index: number): void {
    this.servicePriorities.removeAt(index);
    this.availableServices[index] = [];
    this.updateAvailableServices();
  }

  private updateCanAddNewService(): void {
    const maxNumberOfOptions = this.taxonomies.services.length * this.MAX_NUMBER_PRIORITIES;
    this.canAddNewService = this.servicePriorities.length !== maxNumberOfOptions;
  }
}
