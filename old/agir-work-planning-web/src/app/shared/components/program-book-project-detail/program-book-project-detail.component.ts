import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedObjective,
  IEnrichedProgramBook,
  IEnrichedProject,
  IOrderedProject,
  ProgramBookObjectiveType,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { InterventionService } from '../../services/intervention.service';
import { ProjectService } from '../../services/project.service';
import { BaseComponent } from '../base/base.component';

interface IObjectiveSumName {
  objectiveId: string;
  sum: number;
  name: string;
}
@Component({
  selector: 'app-program-book-project-detail',
  templateUrl: './program-book-project-detail.component.html',
  styleUrls: ['./program-book-project-detail.component.scss']
})
export class ProgramBookProjectDetailComponent extends BaseComponent implements OnInit {
  @Input() public project: IEnrichedProject;
  @Input() public previousOrderedProject: IOrderedProject;
  @Input() public orderedProject: IOrderedProject;
  @Input() public annualProgram: IEnrichedAnnualProgram;
  @Input() public programBook: IEnrichedProgramBook;

  public interventions: IEnrichedIntervention[];
  public objectives: IEnrichedObjective[];
  public objectiveSumNames: IObjectiveSumName[] = [];
  public objectiveNames: string[] = [];

  constructor(private readonly projectService: ProjectService, public interventionService: InterventionService) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    if (!isEmpty(this.project.interventions)) {
      this.interventions = this.project.interventions.filter(i =>
        i.annualDistribution.annualPeriods.map(ap => ap.year).includes(this.annualProgram.year)
      );
    } else {
      this.interventions = await this.interventionService
        .searchInterventionsPost({
          id: this.project.interventionIds,
          fields: ['interventionName', 'annualDistribution']
        })
        .toPromise();
      this.interventions = this.interventions.filter(i =>
        i.annualDistribution.annualPeriods.map(ap => ap.year).includes(this.annualProgram.year)
      );
    }
    this.objectives = this.programBook.objectives.filter(
      obj => obj.objectiveType === ProgramBookObjectiveType.threshold
    );
    this.initObjectiveSumNames();
    this.initObjectiveNames();
  }

  public initObjectiveNames(): void {
    if (!this.orderedProject) {
      return;
    }
    this.objectiveNames = [];
    this.objectiveSumNames.forEach(objectiveNameSum => {
      const objectiveCalculation = this.orderedProject.objectivesCalculation.find(
        objCalculation => objCalculation.objectiveId === objectiveNameSum.objectiveId
      );
      if (objectiveNameSum.sum < objectiveCalculation.objectiveSum) {
        this.objectiveNames.push(objectiveNameSum.name);
      }
    });
  }

  public initObjectiveSumNames(): void {
    this.objectives.forEach(obj => {
      const previousObjectiveCalculation = this.previousOrderedProject?.objectivesCalculation.find(
        objCalculation => objCalculation.objectiveId === obj.id
      );

      this.objectiveSumNames.push({
        objectiveId: obj.id,
        sum: previousObjectiveCalculation?.objectiveSum || 0,
        name: obj.name
      });
    });
  }

  public getInterventionAnnualAllowance(intervention: IEnrichedIntervention): number {
    return intervention.annualDistribution.annualPeriods.find(ap => ap.year === this.annualProgram.year)
      .annualAllowance;
  }
}
