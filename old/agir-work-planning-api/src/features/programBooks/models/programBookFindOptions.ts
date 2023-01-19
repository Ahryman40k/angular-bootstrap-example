import { Permission, ProgramBookStatus, ProjectType } from '@villemontreal/agir-work-planning-lib';
import { get } from 'lodash';

import { userService } from '../../../services/userService';
import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';
import { enumValues } from '../../../utils/enumUtils';

interface ICompatibleProjectCriteria {
  executorId: string;
  boroughId: string;
  projectTypeId: string;
}

export interface IProgramBookCriterias extends ICriterias {
  id?: string | string[];
  annualProgramId?: string;
  status?: ProgramBookStatus[];
  sharedRoles?: string[];
  targetYear?: number;
  importCompatibleProject?: ICompatibleProjectCriteria;
  objectivePin?: boolean;
  name?: string;
  projectTypes?: ProjectType[];
  removedProjectsIds?: string | string[];
  priorityScenarioProjectsIds?: string | string[];
  programTypes?: string[];
  boroughIds?: string[];
  projectLimit?: number;
  projectOffset?: number;
}

export interface IProgramBookFindOptionsProps extends IFindOptionsProps {
  criterias: IProgramBookCriterias;
}

export class ProgramBookFindOptions extends FindOptions<IProgramBookFindOptionsProps> {
  public static create(props: IProgramBookFindOptionsProps): Result<ProgramBookFindOptions> {
    const guard = ProgramBookFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProgramBookFindOptions>(guard);
    }
    this.setDefaultValues(props);
    const programBookFindOptions = new ProgramBookFindOptions(props);
    return Result.ok<ProgramBookFindOptions>(programBookFindOptions);
  }

  public static guard(props: IProgramBookFindOptionsProps): IGuardResult {
    const guardFindOptionsBase = FindOptions.guard(props);
    let guardIds = [{ succeeded: true }];
    if (get(props, 'criterias.id')) {
      guardIds = this.guardIds(convertStringOrStringArray(props.criterias.id));
    }
    const guardCriterias = ProgramBookFindOptions.guardCriterias(props.criterias);
    return Guard.combine([guardFindOptionsBase, ...guardIds, guardCriterias]);
  }

  private static guardCriterias(criterias: IProgramBookCriterias): IGuardResult {
    if (!criterias) {
      return { succeeded: true };
    }
    const guardBulk: IGuardArgument[] = [
      {
        argument: criterias.annualProgramId,
        argumentName: 'annualProgramId',
        guardType: [GuardType.VALID_UUID]
      },
      {
        argument: criterias.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ProgramBookStatus)
      }
    ];
    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  public static setDefaultValues(props: IProgramBookFindOptionsProps) {
    this.setDefaultCriterias(props);
    this.setDefaultSort(props);
  }

  private static setDefaultCriterias(props: IProgramBookFindOptionsProps) {
    if (!props.criterias) {
      props.criterias = {};
    }
    if (!props.criterias.status) {
      props.criterias.status = this.getDefaultStatuses();
    }
  }

  private static setDefaultSort(props: IProgramBookFindOptionsProps) {
    if (!props.orderBy) {
      props.orderBy = '-createdAt';
    }
  }

  public static getDefaultStatuses(): ProgramBookStatus[] {
    const defaultStatuses = enumValues(ProgramBookStatus) as ProgramBookStatus[];
    if (!userService.currentUser.hasPermission(Permission.PROGRAM_BOOK_READ_NEW)) {
      return defaultStatuses.filter(element => element !== ProgramBookStatus.new);
    }
    return defaultStatuses;
  }

  protected static guardIds(ids: string[]): IGuardResult[] {
    return ids.map((id, index) =>
      Guard.guard({
        argument: id,
        argumentName: `id[${index}]`,
        guardType: [GuardType.VALID_UUID]
      })
    );
  }
  protected static guardProjectTypes(projectTypes: ProjectType[]): IGuardResult[] {
    let guardprojectTypes: IGuardResult[] = [{ succeeded: true }];
    if (projectTypes) {
      guardprojectTypes = projectTypes.map((projectType, index) =>
        Guard.guard({
          argument: projectType,
          argumentName: `projectType[${index}]`,
          guardType: [GuardType.IS_ONE_OF],
          values: enumValues(ProjectType)
        })
      );
    }
    return guardprojectTypes;
  }
}
