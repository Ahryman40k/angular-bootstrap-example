import { Permission, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

import { userService } from '../../services/userService';
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { annualProgramRepository } from '../annualPrograms/mongo/annualProgramRepository';
import { IProgramBookCriterias } from './models/programBookFindOptions';

class ProgramBookMatchBuilder extends BaseMatchBuilder<IProgramBookCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    annualProgramId: 'annualProgramId',
    status: 'status',
    // objectivePin: 'objective.pin',
    name: 'name',
    projectTypes: 'projectTypes',
    removedProjectsIds: 'removedProjectsIds',
    priorityScenarioProjectsIds: 'priorityScenarios.orderedProjects',
    boroughIds: 'boroughIds',
    programTypes: 'programTypes'
  };

  protected async getOtherFilterConstraints(criterias: IProgramBookCriterias): Promise<any[]> {
    return [await this.getImportCompatible(criterias), await this.getSharedRolesFilter()];
  }

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case '_id':
      case 'id':
      case 'annualProgramId':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      case 'sharedRoles':
      case 'projectTypes':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: criteriaValue } };
      case 'objectivePin':
      case 'name':
        return { [this.queryCorrespondence[criteriaKey]]: criteriaValue };
      case 'removedProjectsIds':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $elemMatch: {
              $in: convertStringOrStringArray(criteriaValue)
            }
          }
        };
      case 'priorityScenarioProjectsIds':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $elemMatch: {
              projectId: { $in: convertStringOrStringArray(criteriaValue) }
            }
          }
        };
      default:
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }

  private async getAnnualProgramIdsByYearAndExecutor(targetYear: number, executorId: string): Promise<any> {
    const annualProgramIds = await annualProgramRepository.distinct('_id', {
      year: targetYear,
      executorId
    });
    return {
      [`annualProgramId`]: { $in: annualProgramIds }
    };
  }

  private async getImportCompatible(criterias: IProgramBookCriterias): Promise<any> {
    if (criterias.targetYear && criterias.importCompatibleProject) {
      return {
        $and: [
          await this.getAnnualProgramIdsByYearAndExecutor(
            criterias.targetYear,
            criterias.importCompatibleProject.executorId
          ),
          { status: { $in: [ProgramBookStatus.programming] } },
          { boroughIds: { $in: [criterias.importCompatibleProject.boroughId, null] } },
          { projectTypes: { $in: [criterias.importCompatibleProject.projectTypeId] } }
        ]
      };
    }
    return {};
  }

  private async getSharedRolesFilter(): Promise<any> {
    const user = userService.currentUser;
    if (user.hasPermission(Permission.PROJECT_READ_ALL)) {
      return undefined;
    }
    return {
      sharedRoles: {
        $in: user.roles
      }
    };
  }
}
export const programBookMatchBuilder = new ProgramBookMatchBuilder();
