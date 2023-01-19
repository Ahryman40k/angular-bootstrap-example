import { Component, Input, OnInit } from '@angular/core';
import { IEnrichedIntervention, IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import { compact, filter, floor, map, sumBy, uniq } from 'lodash';
import { Observable } from 'rxjs';
import { IProgramBookDisplayData } from '../program-book-composition.component';
interface IProgramsStatistic {
  programId: string;
  interventionsCount: number;
  annualLength: number;
  budget: number;
}
@Component({
  selector: 'app-programs-composition',
  templateUrl: './programs-composition.component.html',
  styleUrls: ['./programs-composition.component.scss']
})
export class ProgramsCompositionComponent implements OnInit {
  // Data received from the ProgramBookCompositionComponent
  public interventions: IEnrichedIntervention[];
  public programBook: IEnrichedProgramBook;
  public hasPermissionInterventionAnnualDistribution: boolean;
  @Input() public programBookDataReady$: Observable<IProgramBookDisplayData>;

  // Local data
  public programStatistics: IProgramsStatistic[] = [];

  public ngOnInit() {
    this.programBookDataReady$.subscribe(data => {
      if (!data) {
        return;
      }
      this.interventions = data.interventions;
      this.programBook = data.programBook;
      this.hasPermissionInterventionAnnualDistribution = data.hasPermissionInterventionAnnualDistribution;

      this.programStatistics = [];
      const programsList = compact(uniq(map(this.interventions, 'programId')));
      this.programStatistics = programsList.map(programId => {
        const interventionsByProgram = this.getInterventionsByProgram(programId);
        return {
          programId,
          interventionsCount: interventionsByProgram.length,
          annualLength: floor(this.getAnnualLengthCountByProgram(programId), 2),
          budget: this.getBudgetTotalByProgram(programId)
        };
      });
    });
  }

  public getInterventionsByProgram(programId: string): IEnrichedIntervention[] {
    return this.interventions.filter(i => i.programId === programId);
  }

  public getAnnualLengthCountByProgram(programId: string) {
    const interventionsByProgram = this.getInterventionsByProgram(programId);
    return sumBy(interventionsByProgram, ({ annualDistribution }) =>
      sumBy(
        filter(annualDistribution?.annualPeriods, period => period.year === this.programBook?.annualProgram?.year),
        'annualLength'
      )
    );
  }

  public getBudgetTotalByProgram(programId: string) {
    const interventionsByProgram = this.getInterventionsByProgram(programId);
    return sumBy(interventionsByProgram, ({ annualDistribution }) =>
      sumBy(
        filter(annualDistribution?.annualPeriods, period => period.year === this.programBook?.annualProgram?.year),
        'annualAllowance'
      )
    );
  }
}
