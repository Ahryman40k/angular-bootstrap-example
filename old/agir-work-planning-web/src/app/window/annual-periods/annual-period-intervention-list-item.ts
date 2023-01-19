import { IEnrichedIntervention, IInterventionAnnualPeriod } from '@villemontreal/agir-work-planning-lib/dist/src';

import { IGanttIndex } from '../../shared/models/gantt/gant-index';

export interface IAnnualPeriodInterventionListItem extends IEnrichedIntervention {
  ganttIndex: IGanttIndex;
  annualPeriodsDictionary: { [year: number]: IInterventionAnnualPeriod };
}
