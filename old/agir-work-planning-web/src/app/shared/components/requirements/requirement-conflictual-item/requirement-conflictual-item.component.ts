import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IEnrichedIntervention, IEnrichedProject, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';

export enum BtnLabel {
  selected = 'Sélectionner',
  remove = 'Retirer'
}
@Component({
  selector: 'app-requirement-conflictual-item',
  templateUrl: './requirement-conflictual-item.component.html'
})
export class RequirementConflictualItemComponent implements OnChanges {
  public TaxonomyGroup = TaxonomyGroup;
  @Input() public itemType: string;
  @Input() public item: IEnrichedProject | IEnrichedIntervention;
  @Input() public btnLabel: BtnLabel = null;

  @Output() public selected = new EventEmitter();

  public BtnLabel = BtnLabel;
  public taxonomyGroupStatus: string;
  public taxonomyGroupType: string;
  public itemId: string;
  public itemStatus: string;
  public itemYear: number;
  public itemTypeId: string;
  public itemName: string;
  public itemLinkUrl: string;
  get project(): IEnrichedProject {
    return this.item as IEnrichedProject;
  }
  get intervention(): IEnrichedIntervention {
    return this.item as IEnrichedIntervention;
  }

  constructor(public interventionService: InterventionService, public projectService: ProjectService) {}
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes?.itemType?.currentValue === ObjectType.intervention) {
      this.taxonomyGroupStatus = TaxonomyGroup.interventionStatus;
      this.taxonomyGroupType = TaxonomyGroup.interventionType;
      this.itemId = this.intervention.id;
      this.itemStatus = this.intervention.status;
      this.itemYear = this.intervention.interventionYear;
      this.itemTypeId = this.intervention.interventionTypeId;
      this.itemName = this.intervention.interventionName;
      this.itemLinkUrl = this.interventionService.getInterventionLink(this.intervention);
    } else if (changes?.itemType?.currentValue === ObjectType.project) {
      this.taxonomyGroupStatus = TaxonomyGroup.projectStatus;
      this.taxonomyGroupType = TaxonomyGroup.projectType;
      this.itemId = this.project.id;
      this.itemStatus = this.project.status;
      this.itemYear = this.project.startYear;
      this.itemTypeId = this.project.projectTypeId;
      this.itemName = this.project.streetName;
      this.itemLinkUrl = this.projectService.getProjectLink(this.project);
    }
  }
  public toggleBtnLabel(): void {
    this.selected.emit();
  }
}
