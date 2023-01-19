import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IImportRelationCriterias extends ICriterias {
  bicProjectNumber?: string | number;
  bicProjectId?: string | number;
  projectId?: string;
}

export interface IImportRelationFindOptionsProps extends IFindOptionsProps {
  criterias: IImportRelationCriterias;
}

export class ImportRelationFindOptions extends FindOptions<IImportRelationFindOptionsProps> {
  public static create(props: IImportRelationFindOptionsProps): Result<ImportRelationFindOptions> {
    const guard = ImportRelationFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ImportRelationFindOptions>(guard);
    }
    const importRelationFindOptions = new ImportRelationFindOptions(props);
    return Result.ok<ImportRelationFindOptions>(importRelationFindOptions);
  }

  public static guard(props: IImportRelationFindOptionsProps): IGuardResult {
    const guardBasicCriteria = FindOptions.guard(props);
    const guardCriterias = ImportRelationFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardBasicCriteria, guardCriterias]);
  }

  private static guardCriterias(criterias: IImportRelationCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.projectId,
        argumentName: `projectId`,
        guardType: [GuardType.VALID_PROJECT_ID]
      }
    ];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }
}
