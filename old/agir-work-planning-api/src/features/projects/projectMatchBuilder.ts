import * as turf from '@turf/turf';
import {
  BoroughCode,
  InterventionExternalReferenceType,
  Permission,
  ProjectDecisionType,
  ProjectExternalReferenceType
} from '@villemontreal/agir-work-planning-lib';

import { userService } from '../../services/userService';
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { appUtils } from '../../utils/utils';
import { ImportFlag } from '../imports/enums/importFlag';
import { interventionRepository } from '../interventions/mongo/interventionRepository';
import { programBookRepository } from '../programBooks/mongo/programBookRepository';
import { RtuProjectExportStatus } from '../rtu/models/rtuProjectExport/rtuProjectExport';
import { IProjectCriterias } from './models/projectFindOptions';
import { ANNUAL_DISTRIBUTION_ANNUAL_PERIODS } from './mongo/projectModel';

const budgetKey = 'globalBudget.allowance';
const exportAtKey = '$rtuExport.exportAt';
class ProjectMatchBuilder extends BaseMatchBuilder<IProjectCriterias> {
  protected readonly queryCorrespondence = {
    bbox: 'geometry',
    boroughId: 'boroughId',
    budget: budgetKey,
    cancelAtInfoRtu: 'cancelAtInfoRtu',
    categoryId: 'annualDistribution.annualPeriods.categoryId',
    documentId: 'documents.objectId',
    drmNumbers: 'drmNumber',
    endYear: 'endYear',
    excludeIds: '_id',
    excludeProgramBookIds: 'annualDistribution.annualPeriods.programBookId',
    excludeImportBic: 'excludeImportBic',
    executorId: 'executorId',
    exportRtu: 'exportRtu',
    fromBudget: budgetKey,
    fromEndYear: 'endYear',
    fromStartYear: 'startYear',
    fromYear: 'annualDistribution.annualPeriods.year',
    id: '_id',
    inChargeId: 'inChargeId',
    intersectGeometry: 'geometry',
    interventionIds: 'interventionIds',
    interventionProgramId: 'programId',
    interventionAssetTypeId: 'assets.typeId',
    isGeolocated: 'bbox',
    medalId: 'medalId',
    nexoReferenceNumber: 'externalReferenceIds',
    programBookId: 'annualDistribution.annualPeriods.programBookId',
    projectTypeId: 'projectTypeId',
    q: 'q',
    startYear: 'startYear',
    status: 'status',
    subCategoryId: 'subCategoryIds',
    submissionNumber: 'submissionNumber',
    toBudget: budgetKey,
    toEndYear: 'endYear',
    toStartYear: 'startYear',
    workTypeId: 'workTypeId'
  };

  private fromYear: number = appUtils.getCurrentYear();

  protected async getOtherFilterConstraints(criterias: IProjectCriterias): Promise<any[]> {
    return [await this.getSharedRolesFilter()];
  }

  protected cleanUpCriterias(criterias: IProjectCriterias): IProjectCriterias {
    this.cleanUpDatesCriterias(criterias, ['startYear', 'budget', 'endYear']);
    return criterias;
  }

  // tslint:disable:cyclomatic-complexity
  // tslint:disable-next-line: max-func-body-length
  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'fromYear':
        // is set up in case of coupling with categoryId criteria
        this.fromYear = criteriaValue;
        return null;
      case 'q':
        if (!criteriaValue) {
          return null;
        }
        const matchWithRegex = this.getFreeQueryMatch(criteriaValue);
        return {
          $or: [
            { _id: matchWithRegex },
            { projectName: matchWithRegex },
            { streetName: matchWithRegex },
            { streetFrom: matchWithRegex },
            { streetTo: matchWithRegex },
            ...this.getSubmissionDrmNumberConstraint(criteriaValue),
            ...this.getExternalIdsConstraint(criteriaValue)
          ]
        };
      case 'intersectGeometry':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $geoIntersects: { $geometry: criteriaValue }
          }
        };
      case 'bbox':
        if (!criteriaValue) {
          return null;
        }
        // convert the string of coordinates into array of numbers
        const result: any = criteriaValue.split(',').map((x: string) => +x);
        const geometry = turf.bboxPolygon(result).geometry;
        // // sets the filter to a geometry bbox polygon
        return {
          [this.queryCorrespondence.bbox]: {
            $geoIntersects: { $geometry: geometry }
          }
        };
      case 'startYear':
      case 'budget':
      case 'endYear':
        let value = [appUtils.parseInt(criteriaValue)];
        if (Array.isArray(criteriaValue)) {
          value = criteriaValue.map(Number);
        }
        return { [this.queryCorrespondence[criteriaKey]]: { $in: value } };
      case 'fromEndYear':
      case 'fromStartYear':
      case 'fromBudget':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $gte: appUtils.parseInt(criteriaValue)
          }
        };
      case 'toEndYear':
      case 'toStartYear':
      case 'toBudget':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $lte: appUtils.parseInt(criteriaValue)
          }
        };
      case 'isGeolocated':
        if (criteriaValue === false) {
          return { [this.queryCorrespondence.bbox]: null };
        }
        if (criteriaValue === true) {
          return { [this.queryCorrespondence.bbox]: { $ne: null } };
        }
        return null;
      case 'categoryId':
        if (!criteriaValue) {
          return null;
        }
        return {
          [ANNUAL_DISTRIBUTION_ANNUAL_PERIODS]: {
            $elemMatch: { year: this.fromYear, categoryId: { $in: convertStringOrStringArray(criteriaValue) } }
          }
        };
      case 'programBookId':
        // TODO is it with $elemMatch: { programBookId }
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      case 'excludeProgramBookIds':
        return { [this.queryCorrespondence[criteriaKey]]: { $nin: this.idsToObjectIds(criteriaValue) } };
      case 'excludeImportBic':
        return criteriaValue
          ? {
              importFlag: { $ne: ImportFlag.internal },
              'externalReferenceIds.type': { $ne: ProjectExternalReferenceType.infoRTUReferenceNumber }
            }
          : {};
      case 'workTypeId':
        return this.getInterventionsIdsByProperty(this.queryCorrespondence.workTypeId, criteriaValue);
      case 'documentId':
        return { [this.queryCorrespondence[criteriaKey]]: criteriaValue };
      case 'interventionProgramId':
        return this.getInterventionsIdsByProperty(this.queryCorrespondence.interventionProgramId, criteriaValue);
      case 'interventionAssetTypeId':
        return this.getInterventionsIdsByProperty(this.queryCorrespondence.interventionAssetTypeId, criteriaValue);
      case 'nexoReferenceNumber':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $elemMatch: {
              type: InterventionExternalReferenceType.nexoReferenceNumber,
              value: { $in: convertStringOrStringArray(criteriaValue) }
            }
          }
        };
      case 'exportRtu':
        return {
          geometry: { $ne: null },
          $or: [
            {
              rtuExport: null
            },
            {
              $and: [
                { 'rtuExport.status': RtuProjectExportStatus.SUCCESSFUL },
                {
                  $expr: {
                    $gt: [
                      { $dateFromString: { dateString: '$audit.lastModifiedAt' } },
                      { $dateFromString: { dateString: exportAtKey } }
                    ]
                  }
                }
              ]
            },
            {
              $and: [
                { 'rtuExport.status': RtuProjectExportStatus.FAILURE },
                {
                  $expr: {
                    $lt: [
                      { $dateFromString: { dateString: exportAtKey } },
                      { $dateFromString: { dateString: criteriaValue.startDateTime.toISOString() } }
                    ]
                  }
                }
              ]
            }
          ]
        };
      case 'cancelAtInfoRtu':
        return {
          'externalReferenceIds.type': ProjectExternalReferenceType.infoRtuId,
          $expr: {
            $gt: [
              { $dateFromString: { dateString: '$audit.lastModifiedAt' } },
              { $dateFromString: { dateString: exportAtKey } }
            ]
          }
        };
      case 'interventionIds':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $elemMatch: {
              $in: convertStringOrStringArray(criteriaValue)
            }
          }
        };
      case 'excludeIds':
        return { [this.queryCorrespondence[criteriaKey]]: { $nin: convertStringOrStringArray(criteriaValue) } };
      case 'boroughId':
        if (!criteriaValue || criteriaValue === BoroughCode.MTL) {
          return undefined;
        }
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
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

  private getSubmissionDrmNumberConstraint(criteriaValue: string): any[] {
    /* Removing all possible char that users can put to lookout for a drm or a submission number to match the numeric string in mongodb
      submissionNUmberInput : #500001
      drmNumber in mongoDb : 5000
      submissionNumber in mongoDb : 500001
    */
    const formattedSearchCriteria = criteriaValue.replace('#', '').replace(/\D/g, '');
    if (!formattedSearchCriteria) {
      return [];
    }
    const searchValue = this.getFreeQueryMatch(formattedSearchCriteria);
    return [{ submissionNumber: searchValue }, { drmNumber: searchValue }];
  }

  private async getInterventionsIdsByProperty(propertyName: string, propertyValue: string | string[]): Promise<any> {
    // Get interventions ids that are in given property
    const interventionsIds = await interventionRepository.distinct('_id', {
      [propertyName]: { $in: convertStringOrStringArray(propertyValue) }
    });
    return {
      [`interventionIds`]: { $in: interventionsIds }
    };
  }

  private async getSharedRolesFilter(): Promise<any> {
    const user = userService.currentUser;
    if (user.hasPermission(Permission.PROJECT_READ_ALL)) {
      return undefined;
    }
    const programBookIds = await programBookRepository.distinct('_id', {
      sharedRoles: { $in: user.roles }
    });

    const programBookConstraint = {
      [`${ANNUAL_DISTRIBUTION_ANNUAL_PERIODS}.programBookId`]: {
        $in: programBookIds
      }
    };

    if (user.hasPermission(Permission.PROJECT_WITH_POSTPONED_DECISION_READ)) {
      return {
        $or: [programBookConstraint, { 'decisions.typeId': ProjectDecisionType.postponed }]
      };
    }
    return programBookConstraint;
  }
}

export const projectMatchBuilder = new ProjectMatchBuilder();
