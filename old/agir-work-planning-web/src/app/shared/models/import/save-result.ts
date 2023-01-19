import { IApiError, IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

export class SaveResult {
  public get total(): number {
    return this.successes.length + this.failures.length;
  }

  public get totalSuccess(): number {
    return this.successes.length;
  }

  public get totalFail(): number {
    return this.failures.length;
  }

  public get successPercentage(): number {
    return this.total === 0 ? 0 : Math.ceil((this.totalSuccess / this.total) * 100);
  }

  constructor(
    public readonly successes: IEnrichedProject[] = [],
    public readonly failures: ISaveResultFailure[] = []
  ) {}
}

export interface ISaveResultFailure {
  bicProjectId: string;
  error: IApiError;
}
