import { Component, Input, OnInit } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProgramBook,
  InterventionType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { map, uniq } from 'lodash';
import { Observable } from 'rxjs';
import { IProgramBookDisplayData } from '../program-book-composition.component';
interface IRequestorsStatistic {
  requestorId: string;
  initialNeedInterventionsCount: number;
  opportunitydInterventionsCount: number;
  total: number;
}
@Component({
  selector: 'app-requestors-composition',
  templateUrl: './requestors-composition.component.html',
  styleUrls: ['./requestors-composition.component.scss']
})
export class RequestorsCompositionComponent implements OnInit {
  // Data received from the ProgramBookCompositionComponent
  public interventions: IEnrichedIntervention[];
  public programBook: IEnrichedProgramBook;
  @Input() public programBookDataReady$: Observable<IProgramBookDisplayData>;

  // Local data
  public requestorsStatistics: IRequestorsStatistic[] = [];

  public ngOnInit() {
    this.programBookDataReady$.subscribe(data => {
      if (!data) {
        return;
      }
      this.interventions = data.interventions;
      this.programBook = data.programBook;
      this.requestorsStatistics = [];
      const requestorList = uniq(map(this.interventions, 'requestorId'));
      this.requestorsStatistics = requestorList?.map(reqId => {
        const interventionsByRequestor = this.getInterventionsByRequestor(reqId);
        return {
          requestorId: reqId,
          initialNeedInterventionsCount: this.getInitialNeedInterventionsCount(reqId),
          opportunitydInterventionsCount: this.getOpportunitydInterventionsCount(reqId),
          total: interventionsByRequestor.length
        };
      });
    });
  }
  public getInitialNeedInterventionsCount(reqId: string) {
    const interventionsByRequestor = this.getInterventionsByRequestor(reqId);
    return interventionsByRequestor.filter(i => i.interventionTypeId === InterventionType.initialNeed).length;
  }
  public getOpportunitydInterventionsCount(reqId: string) {
    const interventionsByRequestor = this.getInterventionsByRequestor(reqId);
    return interventionsByRequestor.filter(i => i.interventionTypeId === InterventionType.opportunity).length;
  }

  public getInterventionsByRequestor(reqId: string): IEnrichedIntervention[] {
    return this.interventions.filter(i => i.requestorId === reqId);
  }
}
