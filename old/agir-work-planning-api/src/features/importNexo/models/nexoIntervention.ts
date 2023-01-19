import { IProject, ModificationType } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { IKeyAndValue } from '../../../utils/utils';
import { IInterventionProps, Intervention } from '../../interventions/models/intervention';

// This class is a bastard between "old" code and refacto with DDD
export interface INexoInterventionProps extends IInterventionProps {
  modificationType?: ModificationType;
  lineNumber: number;
  interventionId: string;
  codeStatusCarnet: string;
  codePhase: string;
  modificationSummary: IKeyAndValue<boolean>;
}

export class NexoIntervention extends Intervention<INexoInterventionProps> {
  public static create(props: INexoInterventionProps, id?: string): Result<NexoIntervention> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<NexoIntervention>(guard);
    }
    const nexoIntervention = new NexoIntervention(props, id);
    return Result.ok<NexoIntervention>(nexoIntervention);
  }

  public static guard(props: INexoInterventionProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.executorId,
        argumentName: 'executorId',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.modificationType,
        argumentName: 'modificationType',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ModificationType)
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public get executorId(): string {
    return this.props.executorId;
  }

  public get modificationType(): ModificationType {
    if (!this.props.modificationType) {
      return ModificationType.CREATION;
    }
    return this.props.modificationType;
  }

  public setId(id: string) {
    this.props.interventionId = id;
  }

  public get id() {
    return this.props.interventionId;
  }

  public get lineNumber(): number {
    return this.props.lineNumber;
  }

  public get codeStatusCarnet(): string {
    return this.props.codeStatusCarnet;
  }

  public get codePhase(): string {
    return this.props.codePhase;
  }

  public get modificationSummary(): IKeyAndValue<boolean> {
    return this.props.modificationSummary;
  }

  public get project(): IProject {
    return this.props.project;
  }

  public setProject(project: IProject): void {
    this.props.project = project;
  }
}
