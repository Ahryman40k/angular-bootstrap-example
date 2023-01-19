import { toPersistanceMongoId } from '../../../../shared/domain/entity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { auditable } from '../../../../shared/mixins/mixins';
import { Audit } from '../../../audit/audit';
import { IAuditableProps } from '../../../audit/auditable';
import { IRequirementMongoAttributes } from '../../mongo/requirementSchema';
import { IPlainSubmissionRequirementProps, PlainSubmissionRequirement } from './plainSubmissionRequirement';

// tslint:disable-next-line: no-empty-interface
export interface ISubmissionRequirementProps extends IPlainSubmissionRequirementProps, IAuditableProps {
  mentionId: string;
  typeId: string;
  isDeprecated: boolean;
}

export class SubmissionRequirement extends auditable(PlainSubmissionRequirement)<ISubmissionRequirementProps> {
  public static create(props: ISubmissionRequirementProps, id?: string): Result<SubmissionRequirement> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SubmissionRequirement>(guard);
    }
    const requirement = new SubmissionRequirement(props, id);
    return Result.ok<SubmissionRequirement>(requirement);
  }

  public static guard(props: ISubmissionRequirementProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.mentionId,
        argumentName: `mentionId`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.typeId,
        argumentName: `typeId`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.isDeprecated,
        argumentName: `isDeprecated`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_BOOLEAN]
      }
    ];
    return Guard.combine([PlainSubmissionRequirement.guard(props), ...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IRequirementMongoAttributes): Promise<SubmissionRequirement> {
    const audit = await Audit.toDomainModel(raw.audit);
    return SubmissionRequirement.create(
      {
        text: raw.text,
        mentionId: raw.mentionId,
        typeId: raw.typeId,
        subtypeId: raw.subtypeId,
        isDeprecated: raw.isDeprecated,
        planningRequirementId: raw.planningRequirementId,
        projectIds: raw.projectIds,
        audit
      },
      raw._id.toString()
    ).getValue();
  }

  public static toPersistence(submissionRequirement: SubmissionRequirement): IRequirementMongoAttributes {
    return {
      _id: toPersistanceMongoId(submissionRequirement),
      text: submissionRequirement.text,
      mentionId: submissionRequirement.mentionId,
      typeId: submissionRequirement.typeId,
      subtypeId: submissionRequirement.subtypeId,
      isDeprecated: submissionRequirement.isDeprecated,
      planningRequirementId: submissionRequirement.planningRequirementId,
      projectIds: submissionRequirement.projectIds,
      audit: Audit.toPersistance(submissionRequirement.audit)
    };
  }
  public get mentionId(): string {
    return this.props.mentionId;
  }
  public get typeId(): string {
    return this.props.typeId;
  }
  public get isDeprecated(): boolean {
    return this.props.isDeprecated;
  }
}

export const isRequirementItem = (v: any): v is SubmissionRequirement => {
  return v instanceof SubmissionRequirement;
};
