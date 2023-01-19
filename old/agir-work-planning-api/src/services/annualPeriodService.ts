import { ProjectStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ProjectAnnualPeriod } from '../features/annualPeriods/models/projectAnnualPeriod';
import { StateMachine2 } from '../utils/stateMachine2';

export interface IAnnualPeriodService {
  updateAnnualPeriodInProgramBookStatus(annualPeriod: ProjectAnnualPeriod, status: ProjectStatus): Promise<void>;
}

class AnnualPeriodService implements IAnnualPeriodService {
  private readonly stateMachine = new StateMachine2<ProjectAnnualPeriod>();

  constructor() {
    this.initStateMachine();
  }

  private initStateMachine(): void {
    this.stateMachine.transitions = [
      { from: ProjectStatus.planned, to: ProjectStatus.programmed, transit: this.setStatus },
      { from: ProjectStatus.planned, to: ProjectStatus.replanned, transit: this.setStatus },
      { from: ProjectStatus.postponed, to: ProjectStatus.programmed, transit: this.setStatus },
      { from: ProjectStatus.postponed, to: ProjectStatus.finalOrdered, transit: this.setStatus },
      { from: ProjectStatus.programmed, to: ProjectStatus.planned, transit: this.setStatus },
      { from: ProjectStatus.programmed, to: ProjectStatus.replanned, transit: this.setStatus },
      { from: ProjectStatus.programmed, to: ProjectStatus.postponed, transit: this.setStatus },
      { from: ProjectStatus.programmed, to: ProjectStatus.finalOrdered, transit: this.setStatus },
      { from: ProjectStatus.replanned, to: ProjectStatus.planned, transit: this.setStatus },
      { from: ProjectStatus.replanned, to: ProjectStatus.programmed, transit: this.setStatus },
      { from: ProjectStatus.finalOrdered, to: ProjectStatus.postponed, transit: this.setStatus }
    ];
  }

  public async updateAnnualPeriodInProgramBookStatus(
    annualPeriod: ProjectAnnualPeriod,
    status: ProjectStatus
  ): Promise<void> {
    if (annualPeriod.status !== status) {
      await this.stateMachine.transit(annualPeriod, status);
    }
  }

  public getAnnualPeriodsFromYear(annualPeriods: ProjectAnnualPeriod[], year: number): ProjectAnnualPeriod[] {
    return annualPeriods.filter(ap => {
      return year >= ap.year;
    });
  }

  private setStatus(annualPeriod: ProjectAnnualPeriod, status: ProjectStatus): ProjectAnnualPeriod {
    annualPeriod.setStatus(status);
    return annualPeriod;
  }
}

export const annualPeriodService = new AnnualPeriodService();
