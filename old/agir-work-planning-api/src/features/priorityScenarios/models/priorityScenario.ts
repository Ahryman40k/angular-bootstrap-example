import { ProgramBookPriorityScenarioStatus } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { getId } from '../../../shared/domain/entity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { IPriorityScenarioMongoAttributes } from '../mongo/priorityScenarioSchema';
import { OrderedProject, ORDEREDPROJECTS_MANDATORY_FIELDS } from './orderedProject';
import { PriorityLevel } from './priorityLevel';

export const PRIORITYSCENARIOS_MANDATORY_FIELDS = [
  'id',
  'audit',
  ...ORDEREDPROJECTS_MANDATORY_FIELDS.map(field => `orderedProjects.${field}`)
];

// tslint:disable:no-empty-interface
export interface IPriorityScenarioProps extends IAuditableProps {
  // IPriorityScenario
  id: string; // due to incompatibility with paginate projects on IPriorityScenario
  name: string;
  orderedProjects: OrderedProject[];
  status: ProgramBookPriorityScenarioStatus;
  audit: Audit;
  priorityLevels: PriorityLevel[];
  isOutdated?: boolean;
}

export class PriorityScenario extends Auditable(AggregateRoot)<IPriorityScenarioProps> {
  public static create(props: IPriorityScenarioProps, id?: string): Result<PriorityScenario> {
    const guardPlain = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guard = Guard.combine([guardPlain, guardAudit]);
    if (!guard.succeeded) {
      return Result.fail<PriorityScenario>(guard);
    }
    const priorityScenario = new PriorityScenario(props, id);
    return Result.ok<PriorityScenario>(priorityScenario);
  }

  public get name(): string {
    return this.props.name;
  }

  public get priorityLevels(): PriorityLevel[] {
    return this.props.priorityLevels;
  }

  public get orderedProjects(): OrderedProject[] {
    return this.props.orderedProjects;
  }

  public get isOutdated(): boolean {
    return this.props.isOutdated;
  }

  public get status(): ProgramBookPriorityScenarioStatus {
    return this.props.status;
  }

  public static guard(props: IPriorityScenarioProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.id,
        argumentName: 'id',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      },
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.isOutdated,
        argumentName: 'isOutdated',
        guardType: [GuardType.IS_BOOLEAN]
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ProgramBookPriorityScenarioStatus)
      }
    ];
    let guardPriorityLevels = [{ succeeded: true }];
    if (!isEmpty(props.priorityLevels)) {
      guardPriorityLevels = props.priorityLevels.map(priorityLevel => {
        return PriorityLevel.guard(priorityLevel);
      });
    }
    let guardOrderedProjects = [{ succeeded: true }];
    if (!isEmpty(props.orderedProjects)) {
      guardOrderedProjects = props.orderedProjects.map(orderedProject => {
        const guardBasic = OrderedProject.guard(orderedProject);
        const guardAudit = Audit.guard(orderedProject.audit);
        return Guard.combine([guardBasic, guardAudit]);
      });
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardPriorityLevels, ...guardOrderedProjects]);
  }

  public static async toDomainModel(raw: IPriorityScenarioMongoAttributes): Promise<PriorityScenario> {
    let priorityLevels: PriorityLevel[] = [];
    if (!isEmpty(raw.priorityLevels)) {
      priorityLevels = await Promise.all(
        raw.priorityLevels.map(level => {
          return PriorityLevel.toDomainModel(level);
        })
      );
    }
    let orderedProjects: OrderedProject[] = [];
    if (!isEmpty(raw.orderedProjects)) {
      orderedProjects = await Promise.all(
        raw.orderedProjects.map(rawProject => {
          return OrderedProject.toDomainModel(rawProject);
        })
      );
    }
    const result = PriorityScenario.create(
      {
        id: raw.id,
        name: raw.name,
        priorityLevels,
        orderedProjects,
        isOutdated: raw.isOutdated,
        status: raw.status as ProgramBookPriorityScenarioStatus,
        audit: await Audit.toDomainModel(raw.audit)
      },
      raw.id
    );
    return result.getValue();
  }

  public static toPersistence(priorityScenario: PriorityScenario): IPriorityScenarioMongoAttributes {
    return {
      id: priorityScenario.id,
      name: priorityScenario.name,
      priorityLevels: priorityScenario.priorityLevels.map(level => PriorityLevel.toPersistence(level)),
      orderedProjects: priorityScenario.orderedProjects.map(project => OrderedProject.toPersistence(project)),
      isOutdated: priorityScenario.isOutdated,
      status: priorityScenario.status,
      audit: Audit.toPersistance(priorityScenario.audit)
    };
  }

  public static getDefault(): PriorityScenario {
    const defaultProps: IPriorityScenarioProps = {
      id: getId(),
      name: 'scenario1',
      priorityLevels: [PriorityLevel.getDefault()],
      status: ProgramBookPriorityScenarioStatus.pending,
      orderedProjects: [],
      isOutdated: false,
      audit: Audit.fromCreateContext()
    };
    return PriorityScenario.create(defaultProps, defaultProps.id).getValue();
  }

  public outDate(isOutdated = true) {
    this.props.isOutdated = isOutdated;
  }

  // TODO REMOVE MAYBE
  public setOrderedProjects(orderedProjects: OrderedProject[]) {
    this.props.orderedProjects = orderedProjects;
  }
}
