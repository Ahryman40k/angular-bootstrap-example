import {
  ISubmissionRequirementRequest,
  SubmissionRequirementSubtype,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';
import { taxonomyService } from '../../../taxonomies/taxonomyService';

// tslint:disable:no-empty-interface
export interface IPlainSubmissionRequirementProps extends ISubmissionRequirementRequest {}

export class PlainSubmissionRequirement<P extends IPlainSubmissionRequirementProps> extends AggregateRoot<P> {
  public static guard(props: IPlainSubmissionRequirementProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.text,
        argumentName: `text`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.subtypeId,
        argumentName: `subtypeId`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(SubmissionRequirementSubtype)
      },
      {
        argument: props.projectIds,
        argumentName: `projectIds`,
        guardType: [GuardType.EMPTY_ARRAY]
      },
      {
        argument: props.planningRequirementId,
        argumentName: `planningRequirementId`,
        guardType: [GuardType.EMPTY_STRING]
      }
    ];

    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  public static create(
    props: IPlainSubmissionRequirementProps
  ): Result<PlainSubmissionRequirement<IPlainSubmissionRequirementProps>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<PlainSubmissionRequirement<IPlainSubmissionRequirementProps>>(guard);
    }
    const projectSubmissionCommand = new PlainSubmissionRequirement(props, undefined);
    return Result.ok<PlainSubmissionRequirement<IPlainSubmissionRequirementProps>>(projectSubmissionCommand);
  }

  public get subtypeId(): string {
    return this.props.subtypeId;
  }
  public get text(): string {
    return this.props.text;
  }
  public get projectIds(): string[] {
    return this.props.projectIds;
  }
  public get planningRequirementId(): string {
    return this.props.planningRequirementId;
  }

  public static async getType(subtypeId: string): Promise<string> {
    const group = await taxonomyService.getTaxonomy(TaxonomyGroup.submissionRequirementSubtype, subtypeId);
    return group?.properties?.requirementType;
  }
}
