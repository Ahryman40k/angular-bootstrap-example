import { IEnrichedProject, ProjectExpand } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isNil, sumBy } from 'lodash';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { appUtils } from '../../../utils/utils';
import { AnnualProgram } from '../../annualPrograms/models/annualProgram';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { PriorityScenario } from '../../priorityScenarios/models/priorityScenario';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { Objective } from './objective';
import { IPlainProgramBookProps, PlainProgramBook } from './plainProgramBook';

// tslint:disable:no-empty-interface
export interface IProgramBookProps extends IPlainProgramBookProps, IAuditableProps {
  annualProgram?: AnnualProgram;
  objectives?: Objective[];
  projects?: IEnrichedProject[];
  removedProjects?: IEnrichedProject[];
  priorityScenarios?: PriorityScenario[];
  isAutomaticLoadingInProgress: boolean;
}

export class ProgramBook extends Auditable(PlainProgramBook)<IProgramBookProps> {
  public static create(props: IProgramBookProps, id?: string): Result<ProgramBook> {
    const guardPlain = PlainProgramBook.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardPlain, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<ProgramBook>(guardResult);
    }
    const programBook = new ProgramBook(props, id);
    return Result.ok<ProgramBook>(programBook);
  }

  constructor(props: IProgramBookProps, id: string) {
    super(props, id);
    if (isEmpty(props.priorityScenarios)) {
      props.priorityScenarios = [PriorityScenario.getDefault()];
    }
    if (isEmpty(props.objectives)) {
      props.objectives = [];
    }
    if (isEmpty(props.removedProjects)) {
      props.removedProjects = [];
    }
    if (isEmpty(props.programTypes)) {
      props.programTypes = [];
    }
    if (isNil(props.isAutomaticLoadingInProgress)) {
      props.isAutomaticLoadingInProgress = false;
    }
  }

  public get annualProgram(): AnnualProgram {
    return this.props.annualProgram;
  }

  public get objectives(): Objective[] {
    return this.props.objectives;
  }

  public get projects(): IEnrichedProject[] {
    return this.props.projects;
  }

  public get removedProjects(): IEnrichedProject[] {
    return this.props.removedProjects;
  }

  public get priorityScenarios(): PriorityScenario[] {
    return this.props.priorityScenarios;
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.props.isAutomaticLoadingInProgress;
  }

  public setIsAutomaticLoadingInProgress(isAutomaticLoadingInProgress: boolean) {
    this.props.isAutomaticLoadingInProgress = isAutomaticLoadingInProgress;
  }
  public setProjects(projects: IEnrichedProject[]) {
    this.props.projects = projects;
  }

  public addOrReplacePriorityScenario(priorityScenario: PriorityScenario): void {
    const priorityScenarioIndex = this.priorityScenarios.findIndex(i => i.id === priorityScenario.id);
    if (priorityScenarioIndex > -1) {
      this.props.priorityScenarios.splice(priorityScenarioIndex, 1, priorityScenario);
    } else {
      this.props.priorityScenarios.push(priorityScenario);
    }
  }

  public outdatePriorityScenarios(): void {
    for (const priorityScenario of this.priorityScenarios) {
      priorityScenario.outDate();
    }
  }

  public async addOrReplaceObjective(objective: Objective): Promise<Result<Objective>> {
    const objectiveIndex = this.objectives.findIndex(o => o.id === objective.id);
    if (objectiveIndex > -1) {
      this.props.objectives.splice(objectiveIndex, 1, objective);
    } else {
      this.props.objectives.unshift(objective);
    }
    return objective.updateValue(
      await this.getInterventions(),
      this.annualProgram.year,
      this.getProjectsAdditionalCosts(this.projects)
    );
  }

  public removeObjective(objective: Objective): void {
    const atIndex = this.props.objectives.findIndex(o => o.id === objective.id);
    if (atIndex > -1) {
      this.props.objectives.splice(atIndex, 1);
    }
  }

  public async computeObjectives(reloadProjects = false): Promise<Result<Objective[]>> {
    if (isEmpty(this.objectives)) {
      return Result.ok();
    }
    let programBookProjectsAndInterverventions: IEnrichedProject[] = this.projects;
    if (reloadProjects || isEmpty(programBookProjectsAndInterverventions)) {
      programBookProjectsAndInterverventions = await this.getProjects(reloadProjects, true);
    }
    const interventions = await this.getInterventions(programBookProjectsAndInterverventions);
    const additionalCosts = this.getProjectsAdditionalCosts(programBookProjectsAndInterverventions);
    return Result.combine(
      this.objectives.map(obj => obj.updateValue(interventions, this.annualProgram.year, additionalCosts))
    );
  }

  public async getProjects(forceReload = false, withInterventions = false): Promise<IEnrichedProject[]> {
    if (forceReload || isEmpty(this.projects)) {
      return this.loadProjects(withInterventions);
    }
    return this.projects;
  }

  public async getInterventions(projects: IEnrichedProject[] = []) {
    let programBookProjects = !isEmpty(projects) ? projects : this.projects;
    if (isEmpty(programBookProjects)) {
      programBookProjects = await this.loadProjects(true);
    }
    return appUtils.concatArrayOfArrays(programBookProjects.map(p => p.interventions));
  }

  // TODO: should be a project entity method
  public getProjectsAdditionalCosts(projects: IEnrichedProject[]): number {
    return sumBy(projects, p => {
      const annualPeriod = p.annualDistribution.annualPeriods.find(ap => ap.year === this.annualProgram.year);
      return annualPeriod ? annualPeriod.additionalCostsTotalBudget : 0;
    });
  }

  // TODO IMPLEMENT
  // COULD NOT FIND IMPLEMENTATION IN LEGACY CODE
  public canDelete(): boolean {
    return true;
  }

  private async loadProjects(withInterventions = false): Promise<IEnrichedProject[]> {
    this.props.projects = await projectRepository.findAll(
      ProjectFindOptions.create({
        criterias: {
          programBookId: this.id
        },
        expand: withInterventions ? ProjectExpand.interventions : undefined
      }).getValue()
    );
    return this.projects;
  }
}
