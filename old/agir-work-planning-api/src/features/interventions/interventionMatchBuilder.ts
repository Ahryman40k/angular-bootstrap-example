import * as turf from '@turf/turf';
import {
  InterventionExternalReferenceType,
  Permission,
  ProjectDecisionType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isNil } from 'lodash';

import { userService } from '../../services/userService';
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { appUtils } from '../../utils/utils';
import { programBookRepository } from '../programBooks/mongo/programBookRepository';
import { PROJECT_ID } from '../projects/mongo/projectModel';
import { projectRepository } from '../projects/mongo/projectRepository';
import { IInterventionCriterias, InterventionFindOptions } from './models/interventionFindOptions';

const INTERVENTION_AREA_GEOMETRY = 'interventionArea.geometry';
const ESTIMATE_ALLOWANCE = 'estimate.allowance';

class InterventionMatchBuilder extends BaseMatchBuilder<IInterventionCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    assetOwnerId: 'assets.ownerId',
    assetTypeId: 'assets.typeId',
    boroughId: 'boroughId',
    decisionTypeId: 'decisions.typeId',
    estimate: ESTIMATE_ALLOWANCE,
    excludeIds: 'excludeIds',
    fromEstimate: ESTIMATE_ALLOWANCE,
    toEstimate: ESTIMATE_ALLOWANCE,
    interventionAreaBbox: INTERVENTION_AREA_GEOMETRY,
    interventionTypeId: 'interventionTypeId',
    interventionYear: 'interventionYear',
    fromInterventionYear: 'interventionYear',
    toInterventionYear: 'interventionYear',
    planificationYear: 'planificationYear',
    fromPlanificationYear: 'planificationYear',
    toPlanificationYear: 'planificationYear',
    programId: 'programId',
    project: PROJECT_ID,
    q: 'q',
    requestorId: 'requestorId',
    status: 'status',
    workTypeId: 'workTypeId',
    medalId: 'medalId',
    programBookId: 'programBookId',
    executorId: 'executorId',
    documentId: 'documents.objectId',
    nexoReferenceNumber: 'externalReferenceIds',
    projectId: PROJECT_ID,
    decisionRequired: 'decisionRequired',
    intersectGeometry: INTERVENTION_AREA_GEOMETRY,
    decisions: 'decisions'
  };

  protected cleanUpCriterias(criterias: IInterventionCriterias): IInterventionCriterias {
    this.cleanUpDatesCriterias(criterias, ['estimate', 'interventionYear', 'planificationYear']);
    return criterias;
  }

  protected async getOtherFilterConstraints(criterias: IInterventionCriterias): Promise<any[]> {
    return [await this.getSharedRolesFilter(), this.getAssetIdsExternalReferenceIds(criterias)];
  }

  // tslint:disable:cyclomatic-complexity
  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    // NOSONAR
    switch (criteriaKey) {
      case 'q':
        if (!criteriaValue) {
          return null;
        }
        const matchWithRegex = this.getFreeQueryMatch(criteriaValue);
        return {
          $or: [
            { _id: matchWithRegex },
            { interventionName: matchWithRegex },
            { streetName: matchWithRegex },
            { streetFrom: matchWithRegex },
            { streetTo: matchWithRegex },
            ...this.getExternalIdsConstraint(criteriaValue)
          ]
        };
      case 'interventionYear':
      case 'planificationYear':
      case 'estimate':
        let value = [appUtils.parseInt(criteriaValue)];
        if (Array.isArray(criteriaValue)) {
          value = criteriaValue.map(Number);
        }
        return { [this.queryCorrespondence[criteriaKey]]: { $in: value } };
      case 'excludeIds':
        return { _id: { $nin: convertStringOrStringArray(criteriaValue) } };
      case 'interventionAreaBbox':
        // convert the string of coordinates into array of numbers
        const result = criteriaValue.split(',').map((x: string) => +x);
        const geometry = turf.bboxPolygon(result).geometry;
        // return the match as a geometry bbox polygon
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $geoIntersects: { $geometry: geometry }
          }
        };
      case 'project':
        if (isEmpty(criteriaValue) || criteriaValue === 'null') {
          return { [this.queryCorrespondence[criteriaKey]]: { $exists: false } };
        }
        return null;
      case 'status':
        // TODO
        // Is it normal that for example in test C42746 some interventions do not have status
        // Is it something that exists, or just a wrong test ?
        // How an intervention exists in database without a status (at least 'created')
        // UGLY -> should be direct status in with no status null
        const statuses = convertStringOrStringArray(criteriaValue);
        if (JSON.stringify(statuses) !== JSON.stringify(InterventionFindOptions.getDefaultStatuses())) {
          return {
            status: {
              $in: statuses
            }
          };
        }
        return {
          $or: [{ status: { $in: statuses } }, { status: { $exists: false } }, { status: null }]
        };
      case 'fromEstimate':
      case 'fromInterventionYear':
      case 'fromPlanificationYear':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $gte: appUtils.parseInt(criteriaValue)
          }
        };
      case 'toEstimate':
      case 'toInterventionYear':
      case 'toPlanificationYear':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $lte: appUtils.parseInt(criteriaValue)
          }
        };
      case 'programBookId':
        return this.getProjectIdsByProgramBookIds(criteriaValue);
      case 'documentId':
        return { [this.queryCorrespondence[criteriaKey]]: criteriaValue };
      case 'nexoReferenceNumber':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $elemMatch: {
              type: InterventionExternalReferenceType.nexoReferenceNumber,
              value: { $in: convertStringOrStringArray(criteriaValue) }
            }
          }
        };
      case 'decisionRequired':
        if (!criteriaValue) {
          return { [this.queryCorrespondence[criteriaKey]]: { $ne: true } };
        }
        return { [this.queryCorrespondence[criteriaKey]]: criteriaValue };
      case 'intersectGeometry':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $geoIntersects: { $geometry: criteriaValue }
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

  private async getProjectIdsByProgramBookIds(programBookId: string | string[]): Promise<any> {
    // Get project ids that are in given programBook
    const projectIds = await projectRepository.distinct('_id', {
      'annualDistribution.annualPeriods': {
        $elemMatch: { programBookId: { $in: convertStringOrStringArray(programBookId) } }
      }
    });
    return {
      [`project.id`]: { $in: projectIds }
    };
  }

  private async getSharedRolesFilter(): Promise<any> {
    const user = userService.currentUser;
    if (user.hasPermission(Permission.INTERVENTION_READ_ALL)) {
      return undefined;
    }
    const programBookIds = await programBookRepository.distinct('_id', {
      sharedRoles: { $in: user.roles }
    });

    let projectIds;
    const programBookConstraint = {
      'annualDistribution.annualPeriods': { $elemMatch: { programBookId: { $in: programBookIds } } }
    };
    if (user.hasPermission(Permission.PROJECT_WITH_POSTPONED_DECISION_READ)) {
      projectIds = await projectRepository.distinct('_id', {
        $or: [programBookConstraint, { 'decisions.typeId': ProjectDecisionType.postponed }]
      });
    } else {
      projectIds = await projectRepository.distinct('_id', programBookConstraint);
    }
    return {
      [`project.id`]: { $in: projectIds }
    };
  }

  private getAssetIdsExternalReferenceIds(criterias: IInterventionCriterias): any {
    if (isNil(criterias.assetId) && isNil(criterias.assetExternalReferenceIds)) {
      return undefined;
    }

    const orAssetIdsExternalReferenceIds = { $or: [] as any[] };
    if (criterias.assetId) {
      orAssetIdsExternalReferenceIds.$or.push({
        'assets.id': { $in: convertStringOrStringArray(criterias.assetId) }
      });
    }
    if (criterias.assetExternalReferenceIds) {
      orAssetIdsExternalReferenceIds.$or.push(
        ...criterias.assetExternalReferenceIds.map(assetExternalReferenceId => {
          return {
            'assets.externalReferenceIds': {
              $elemMatch: { type: assetExternalReferenceId.type, value: assetExternalReferenceId.value }
            }
          };
        })
      );
    }
    return orAssetIdsExternalReferenceIds;
  }
}
export const interventionMatchBuilder = new InterventionMatchBuilder();
