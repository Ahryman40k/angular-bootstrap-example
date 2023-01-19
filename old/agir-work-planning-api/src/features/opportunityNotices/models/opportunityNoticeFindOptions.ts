import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { isEmpty } from '../../../utils/utils';

export interface IOpportunityNoticeCriterias extends ICriterias {
  id?: string;
  projectId?: string | string[];
}

export interface IOpportunityNoticeFindOptionsProps extends IFindOptionsProps {
  criterias: IOpportunityNoticeCriterias;
}

export class OpportunityNoticeFindOptions extends FindOptions<IOpportunityNoticeFindOptionsProps> {
  public static create(props: IOpportunityNoticeFindOptionsProps): Result<OpportunityNoticeFindOptions> {
    const guard = OpportunityNoticeFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<OpportunityNoticeFindOptions>(guard);
    }
    const opportunityNoticeFindOptions = new OpportunityNoticeFindOptions(props);
    return Result.ok<OpportunityNoticeFindOptions>(opportunityNoticeFindOptions);
  }

  public static guard(props: IOpportunityNoticeFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = OpportunityNoticeFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IOpportunityNoticeCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.id,
        argumentName: 'id',
        guardType: [GuardType.VALID_UUID]
      }
    ];
    let guardProjectId = [{ succeeded: true }];
    if (!isEmpty(criterias.projectId)) {
      if (!Array.isArray(criterias.projectId)) {
        criterias.projectId = [criterias.projectId];
      }
      guardProjectId = criterias.projectId.map(pId =>
        Guard.guard({
          argument: criterias.projectId,
          argumentName: 'projectId',
          guardType: [GuardType.VALID_PROJECT_ID]
        })
      );
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardProjectId]);
  }
}
