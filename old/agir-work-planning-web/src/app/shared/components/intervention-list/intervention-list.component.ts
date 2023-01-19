import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IEnrichedIntervention, ProjectType } from '@villemontreal/agir-work-planning-lib/dist/src';

import { InterventionService } from '../../services/intervention.service';
import { ISelectedAsset } from '../asset-list/asset-list.component';

export interface ISelectedIntervention {
  intervention: IEnrichedIntervention;
  assets: ISelectedAsset[];
  highlighted?: boolean;
}

@Component({
  selector: 'app-intervention-list',
  templateUrl: './intervention-list.component.html',
  styleUrls: ['./intervention-list.component.scss']
})
export class InterventionListComponent {
  public selectedInterventions: ISelectedIntervention[] = [];
  @Input() public projectType: ProjectType = null;
  @Input() public isReadOnly: boolean = false;
  @Input() public isEditorActivated: boolean = false;
  @Input() public isGeneratingArea: boolean = false;
  @Input() public interventionsList: IEnrichedIntervention[] = [];
  @Input() public set items(interventions: ISelectedIntervention[]) {
    this.selectedInterventions = interventions;
  }

  @Output() public interventionAddEvent = new EventEmitter<IEnrichedIntervention>();
  @Output() public interventionHoverEvent = new EventEmitter<ISelectedIntervention>();
  @Output() public interventionRemoveEvent = new EventEmitter<IEnrichedIntervention>();

  constructor(private readonly interventionService: InterventionService) {}

  public hoverIntervention(intervention?: ISelectedIntervention): void {
    this.interventionHoverEvent.emit(intervention);
  }

  public highlightIntervention(id: string, highlight: boolean): void {
    const intervention = this.selectedInterventions.find(item => item.intervention.id === id);
    intervention.highlighted = highlight;
  }

  public inInterventionList(interventionId: string): boolean {
    return this.interventionsList.some(x => x.id === interventionId);
  }

  public canAddInterventionToProject(intervention: IEnrichedIntervention): boolean {
    const isProjectNonIntegratedAndHasNonProgrammedInterventions =
      this.projectType === ProjectType.nonIntegrated && !intervention.programId;

    return (
      !isProjectNonIntegratedAndHasNonProgrammedInterventions &&
      !this.isGeneratingArea &&
      !this.isEditorActivated &&
      this.interventionService.canInteract(intervention)
    );
  }

  public canRemoveInterventionFromProject(): boolean {
    return this.hasMoreThanOneIntervention() && !this.isGeneratingArea && !this.isEditorActivated;
  }

  private hasMoreThanOneIntervention(): boolean {
    return this.interventionsList.length > 1;
  }

  public addIntervention(intervention: IEnrichedIntervention): void {
    this.interventionAddEvent.emit(intervention);
  }

  public removeIntervention(intervention: IEnrichedIntervention): void {
    this.interventionRemoveEvent.emit(intervention);
  }
}
