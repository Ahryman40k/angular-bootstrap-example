import { Component, Input } from '@angular/core';
import {
  IEnrichedObjective,
  IEnrichedProgramBook,
  Permission,
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { ObjectiveMenuService } from 'src/app/shared/services/objective-menu.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';

@Component({
  selector: 'app-objective-card',
  templateUrl: './objective-card.component.html',
  styleUrls: ['./objective-card.component.scss']
})
export class ObjectiveCardComponent {
  public Permission = Permission;
  public ProgramBookObjectiveTargetType = ProgramBookObjectiveTargetType;
  public TaxonomyGroup = TaxonomyGroup;

  @Input() public objective: IEnrichedObjective;
  @Input() public programBook: IEnrichedProgramBook;
  @Input() public restrictionItems: IRestrictionItem[];

  public get objectiveTypeDescription(): string {
    const objectiveType = this.objective.objectiveType === ProgramBookObjectiveType.threshold ? 'Seuil' : 'Indicateur';
    return `Objectif de type ${objectiveType}`;
  }

  constructor(
    private readonly objectiveMenuService: ObjectiveMenuService,
    private readonly programBookService: ProgramBookService
  ) {}

  public getObjectiveMenuItems(objective: IEnrichedObjective): IMoreOptionsMenuItem[] {
    return this.objectiveMenuService.getMenuItems(objective, this.programBook, this.restrictionItems);
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.programBookService.isAutomaticLoadingInProgress;
  }
}
