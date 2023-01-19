import {
  AdditionalCostType,
  IEnrichedProjectAnnualPeriod,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { ProgramBook } from '../../programBooks/models/programBook';
import { programBookRepository } from '../../programBooks/mongo/programBookRepository';
import { AdditionalCost } from './additionalCost';
import { IPlainProjectAnnualPeriodProps, PlainProjectAnnualPeriod } from './plainProjectAnnualPeriod';

// tslint:disable:no-empty-interface
export interface IProjectAnnualPeriodProps extends IPlainProjectAnnualPeriodProps, IAuditableProps {
  programBook: ProgramBook;
  status: ProjectStatus;
  categoryId: string;
  annualBudget: number;
  additionalCostsTotalBudget: number;
  interventionIds: string[];
  interventionsTotalBudget: number;
  rank: number;
}

export class ProjectAnnualPeriod extends Auditable(PlainProjectAnnualPeriod)<IProjectAnnualPeriodProps> {
  public static create(props: IProjectAnnualPeriodProps, id?: string): Result<ProjectAnnualPeriod> {
    const guardProjectAnnualPeriod = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardProjectAnnualPeriod, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<ProjectAnnualPeriod>(guardResult);
    }
    const projectAnnualPeriod = new ProjectAnnualPeriod(props, id);
    return Result.ok<ProjectAnnualPeriod>(projectAnnualPeriod);
  }

  public static guard(props: IProjectAnnualPeriodProps): IGuardResult {
    const guardBasic = PlainProjectAnnualPeriod.guard(props);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ProjectStatus)
      },
      {
        argument: props.categoryId,
        argumentName: 'categoryId',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.annualBudget,
        argumentName: 'annualBudget',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_NUMBER]
      },
      {
        argument: props.rank,
        argumentName: 'rank',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.additionalCostsTotalBudget,
        argumentName: 'additionalCostsTotalBudget',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_NUMBER]
      },
      {
        argument: props.interventionsTotalBudget,
        argumentName: 'interventionsTotalBudget',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_NUMBER]
      }
    ];
    let guardInterventionsIds = [{ succeeded: true }];
    if (!isEmpty(props.interventionIds)) {
      guardInterventionsIds = props.interventionIds.map((interventionId, index) =>
        Guard.guard({
          argument: interventionId,
          argumentName: `interventionIds${index}`,
          guardType: [GuardType.VALID_INTERVENTION_ID]
        })
      );
    }
    return Guard.combine([guardBasic, ...Guard.guardBulk(guardBulk), ...guardInterventionsIds]);
  }

  // TODO DELETE AFTER PROJECT REFACTO
  public static async fromEnrichedToInstance(
    enriched: IEnrichedProjectAnnualPeriod,
    programBook?: ProgramBook
  ): Promise<ProjectAnnualPeriod> {
    const additionalCosts = enriched.additionalCosts.map(ac =>
      AdditionalCost.create({
        type: ac.type as AdditionalCostType,
        amount: ac.amount,
        accountId: ac.accountId
      })
    );
    const instance = ProjectAnnualPeriod.create({
      additionalCosts: additionalCosts.map(ac => ac.getValue()),
      programBook: programBook ? programBook : await programBookRepository.findById(enriched.programBookId),
      status: enriched.status as ProjectStatus,
      categoryId: enriched.categoryId,
      rank: enriched.rank,
      annualBudget: enriched.annualBudget,
      additionalCostsTotalBudget: enriched.additionalCostsTotalBudget,
      interventionIds: enriched.interventionIds,
      interventionsTotalBudget: enriched.interventionsTotalBudget,
      year: enriched.year,
      audit: Audit.fromCreateContext()
    });
    return instance.getValue();
  }

  public static async fromEnrichedToInstanceBulk(
    enricheds: IEnrichedProjectAnnualPeriod[]
  ): Promise<ProjectAnnualPeriod[]> {
    return Promise.all(enricheds.map(pap => this.fromEnrichedToInstance(pap)));
  }

  // TODO DELETE AFTER PROJECT REFACTO

  public get programBook(): ProgramBook {
    return this.props.programBook;
  }

  public get status(): string {
    return this.props.status;
  }

  public get categoryId(): string {
    return this.props.categoryId;
  }

  public get annualBudget(): number {
    return this.props.annualBudget;
  }

  public get rank(): number {
    return this.props.rank;
  }

  public get additionalCostsTotalBudget(): number {
    return this.props.additionalCostsTotalBudget;
  }

  public get interventionIds(): string[] {
    return this.props.interventionIds;
  }

  public get interventionsTotalBudget(): number {
    return this.props.interventionsTotalBudget;
  }

  public setStatus(status: ProjectStatus) {
    this.props.status = status;
  }

  public setProgramBook(programBook: ProgramBook) {
    this.props.programBook = programBook;
  }
}
