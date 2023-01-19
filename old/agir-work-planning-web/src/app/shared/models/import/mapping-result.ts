import { IImportProjectRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

export class IMappingResult {
  public get total(): number {
    return this.projectsWithFeatures.length + this.projectsWithoutFeatures.length;
  }

  public get totalSuccess(): number {
    return this.projectsWithFeatures.length;
  }

  public get totalFail(): number {
    return this.projectsWithoutFeatures.length;
  }

  public get successPercentage(): number {
    return this.total === 0 ? 0 : Math.ceil((this.totalSuccess / this.total) * 100);
  }

  constructor(
    public projectsWithFeatures: IImportProjectRequest[] = [],
    public projectsWithoutFeatures: IImportProjectRequest[] = []
  ) {}
}
