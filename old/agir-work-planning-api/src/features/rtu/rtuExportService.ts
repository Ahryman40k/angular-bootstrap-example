import { Feature } from '@turf/helpers';
import { LineString, multiPolygon, polygon, polygonToLineString } from '@turf/turf';
import {
  ErrorCodes,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  ITaxonomy,
  ProjectExternalReferenceType,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as moment from 'moment';

import { configs } from '../../../config/configs';
import { ExternalReferenceId } from '../../shared/domain/externalReferenceId/externalReferenceId';
import { ForbiddenError } from '../../shared/domainErrors/forbiddenError';
import { Result } from '../../shared/logic/result';
import { IRtuContactResponse } from '../../shared/rtuImport/IRtuContactResponse';
import { createLogger } from '../../utils/logger';
import { appUtils, isEmpty } from '../../utils/utils';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { RtuExportError, RtuExportTarget } from './models/rtuExportError';
import { RtuExportLog, RtuExportStatus } from './models/rtuExportLog';
import { RtuExportLogFindOptions } from './models/rtuExportLogFindOptions';
import { IPhaseProps, Phase } from './models/rtuProjectExport/phase';
import { RtuContactProjectExport } from './models/rtuProjectExport/rtuContactProjectExport';
import { RtuProjectExport } from './models/rtuProjectExport/rtuProjectExport';
import { IStatusProps, Status } from './models/rtuProjectExport/status';
import { ITypeProps, Type } from './models/rtuProjectExport/type';
import { rtuExportLogRepository } from './mongo/rtuExportLogRepository';

export const EXPORT_IN_PROGRESS = 'There is other export in progress';
export const RTU_EXPORT_PROJECT_NAME_MAX_LENGTH = 109;

export const enum typeFieldMappingErrors {
  INTERVENTIONS = 'interventions',
  PROGRAMID = 'programId',
  PROGRAMTYPETAXO = 'programTypeTaxo',
  RTUDATA = 'rtuData'
}

export interface IRtuSession {
  sessionId: string;
}
const logger = createLogger('rtuExportService');

class RtuExportService {
  private taxoList: { [key: string]: ITaxonomy[] } = {};

  public async initTaxonomies(): Promise<void> {
    const taxonomiesGroups = [
      TaxonomyGroup.exportStatus,
      TaxonomyGroup.programBookStatus,
      TaxonomyGroup.requestor,
      TaxonomyGroup.borough,
      TaxonomyGroup.projectStatus,
      TaxonomyGroup.rtuProjectStatus,
      TaxonomyGroup.programType,
      TaxonomyGroup.workType,
      TaxonomyGroup.assetType,
      TaxonomyGroup.rtuProjectPhase,
      TaxonomyGroup.service
    ];
    const taxonomiesByGroups = await Promise.all(taxonomiesGroups.map(group => taxonomyService.getGroup(group)));
    const taxonomies = appUtils.concatArrayOfArrays(taxonomiesByGroups);
    this.taxoList = appUtils.groupArrayToObject<ITaxonomy>('group', taxonomies);
    logger.debug(this.taxoList.length, 'getTaxonomies()');
  }

  public async validateExportInProgress(): Promise<RtuExportLog> {
    logger.debug('validateExportStaus()');
    const rtuExporttLogFindOptions = RtuExportLogFindOptions.create({
      criterias: {
        status: RtuExportStatus.IN_PROGRESS
      }
    }).getValue();
    return rtuExportLogRepository.findOne(rtuExporttLogFindOptions);
  }

  private getContactResult(contact: IRtuContactResponse): Result<RtuContactProjectExport> {
    return RtuContactProjectExport.create(contact.result, contact.result.id);
  }
  public async mapToRtuProjectExport(
    enrichedProject: IEnrichedProject,
    contact: IRtuContactResponse,
    mapToCancel = false
  ): Promise<Result<RtuProjectExport>> {
    const contactResult = this.getContactResult(contact);
    const findTypeResult = this.findType(enrichedProject);
    const typeResult = findTypeResult.isSuccess ? Type.create(findTypeResult.getValue()) : null;
    // map to cancel automatically when flag is sent
    const statusResult = Status.create(this.findStatus(mapToCancel ? ProjectStatus.canceled : enrichedProject.status));
    const phaseResult = Phase.create(this.findPhase(enrichedProject.status));
    const geometryResult = await this.mapGeometries(enrichedProject.geometry);
    let externalReferenceIds: ExternalReferenceId[] = [];
    if (!isEmpty(enrichedProject.externalReferenceIds)) {
      externalReferenceIds = enrichedProject.externalReferenceIds.map(externalReference =>
        ExternalReferenceId.create(externalReference).getValue()
      );
    }
    const rtuProjectResult = RtuProjectExport.create(
      {
        name: this.getTruncatedProjectName(enrichedProject.projectName),
        description: this.findDescription(enrichedProject.interventions),
        productionPb: null,
        conflict: null,
        duration: null,
        district: this.findDistrict(enrichedProject.boroughId),
        idOrganization: configs.rtuExport.exportValues.organizationId,
        nomOrganization: null,
        noReference: enrichedProject.id,
        coordinate: enrichedProject.geometryPin,
        geometry: geometryResult.isSuccess ? geometryResult.getValue().geometry : null,
        status: statusResult.getValue(),
        type: typeResult ? typeResult.getValue() : null,
        phase: phaseResult.getValue(),
        dateStart: moment()
          .year(enrichedProject.startYear)
          .startOf('year')
          .valueOf(),
        dateEnd: moment()
          .year(enrichedProject.endYear)
          .endOf('year')
          .valueOf(),
        dateEntry: moment(enrichedProject?.audit?.createdAt).valueOf(),
        dateModification: enrichedProject?.audit?.lastModifiedAt
          ? moment(enrichedProject?.audit?.lastModifiedAt).valueOf()
          : undefined,
        cancellationReason: null,
        localization: null,
        rueSur: enrichedProject.streetName,
        rueDe: enrichedProject.streetFrom,
        rueA: enrichedProject.streetTo,
        infoRtuId: enrichedProject?.externalReferenceIds?.find(
          (item: any) => item.type === ProjectExternalReferenceType.infoRtuId
        )?.value,
        externalReferenceIds,
        contact: contactResult.isSuccess ? contactResult.getValue() : null
      },
      enrichedProject.id
    );
    const inputValidationResult = Result.combine([rtuProjectResult, contactResult, findTypeResult, geometryResult]);
    // map to project error result
    if (inputValidationResult.isSuccess) {
      return Result.ok(rtuProjectResult.getValue());
    }
    return Result.fail<any>(
      RtuProjectExport.summaryFromResultError(inputValidationResult, enrichedProject.id, {
        projectName: enrichedProject.projectName,
        streetName: enrichedProject.streetName,
        streetFrom: enrichedProject.streetFrom,
        streetTo: enrichedProject.streetTo
      })
    );
  }

  private getTruncatedProjectName(projectName: string): string {
    let truncatedProjectName = projectName;
    if (projectName.length > RTU_EXPORT_PROJECT_NAME_MAX_LENGTH) {
      truncatedProjectName = `${projectName.slice(0, RTU_EXPORT_PROJECT_NAME_MAX_LENGTH - 3)}...`;
    }
    return truncatedProjectName;
  }

  private async mapGeometries(geometry: IGeometry): Promise<Result<Feature<LineString>>> {
    try {
      // convert polygon geometry to line string polygon
      const coordinates = (geometry as any).coordinates;
      if (geometry.type === 'MultiPolygon') {
        return Result.ok(polygonToLineString(multiPolygon(coordinates)));
      }
      return Result.ok(polygonToLineString(polygon(coordinates)));
    } catch (error) {
      logger.error(error, 'Error converting geometrie polygon to lineString');
      return Result.fail(
        RtuExportError.create({ code: ErrorCodes.InvalidInput, target: RtuExportTarget.GEOMETRY }).getValue()
      );
    }
  }

  private findDistrict(boroughId: string): string {
    const taxo = this.taxoList[TaxonomyGroup.borough].find(item => item.code === boroughId);
    // main object will validate null and project status will be failed
    return taxo?.properties?.rtuData?.name;
  }

  private findDescription(interventions: IEnrichedIntervention[]): string {
    const arrayDescriptions = [];
    for (const intervention of interventions) {
      let labelFr = this.taxoList[TaxonomyGroup.requestor].find(item => item.code === intervention.requestorId).label
        .fr;
      if (!labelFr) {
        labelFr = intervention.requestorId;
      }
      arrayDescriptions.push(`${labelFr} / ${intervention.interventionName}`);
    }
    return arrayDescriptions.join(' ; ');
  }

  private findStatus(status: string): IStatusProps {
    const taxoProjectStatus = this.taxoList[TaxonomyGroup.projectStatus].find(item => item.code === status);
    const taxoRtuProjectSatus = this.taxoList[TaxonomyGroup.rtuProjectStatus].find(
      item => item.code === taxoProjectStatus?.properties?.rtuData?.status
    );
    if (!taxoRtuProjectSatus) {
      // main object will validate null and project status will be failed
      return null;
    }
    return {
      name: taxoRtuProjectSatus.code,
      description: taxoRtuProjectSatus.label.fr
    };
  }

  private findPhase(status: string): IPhaseProps {
    const taxoProjectStatus = this.taxoList[TaxonomyGroup.projectStatus].find(item => item.code === status);
    const taxoRtuProjectPhase = this.taxoList[TaxonomyGroup.rtuProjectPhase].find(
      item => item.code === taxoProjectStatus?.properties?.rtuData?.phase
    );
    if (!taxoRtuProjectPhase) {
      // main object will validate null and project status will be failed
      return null;
    }
    return {
      value: taxoRtuProjectPhase.label.fr,
      definition: taxoRtuProjectPhase.label.en
    };
  }
  private findType(enrichedProject: IEnrichedProject): Result<ITypeProps> {
    // if project is PNI
    if (enrichedProject.projectTypeId === ProjectType.nonIntegrated) {
      // at least one intervention
      if (!enrichedProject.interventions.length) {
        return this.failFindType(typeFieldMappingErrors.INTERVENTIONS);
      }
      const firstIntervention = enrichedProject.interventions[0];
      // intervention must have a programId
      if (!firstIntervention.programId) {
        return this.failFindType(typeFieldMappingErrors.PROGRAMID);
      }
      // find the program taxo
      const taxoProgramType = this.taxoList[TaxonomyGroup.programType].find(
        item => item.code === firstIntervention.programId
      );
      // not program taxo found
      if (!taxoProgramType) {
        return this.failFindType(typeFieldMappingErrors.PROGRAMTYPETAXO);
      }
      // get value and definition from taxo rtuData
      const value = taxoProgramType?.properties?.rtuData?.value;
      const definition = taxoProgramType?.properties?.rtuData?.definition;
      if (!value || !definition) {
        return this.failFindType(typeFieldMappingErrors.RTUDATA);
      }
      return Result.ok({
        value,
        partnerId: configs.rtuExport.exportValues.organizationId,
        definition
      });
    }
    return Result.ok({
      value: configs.rtuExport.exportValues.typeValue,
      partnerId: configs.rtuExport.exportValues.organizationId,
      definition: configs.rtuExport.exportValues.typeDefinition
    });
  }
  private failFindType(field: string): Result<any> {
    return Result.fail(
      RtuExportError.create({
        code: ErrorCodes.MissingValue,
        target: 'findType',
        values: { value1: field }
      }).getValue()
    );
  }

  // TODO: to be removed in task APOC-6659
  public isForbiddenError(error: any): error is ForbiddenError {
    return error.constructor && error.constructor === ForbiddenError;
  }
}

export const rtuExportService = new RtuExportService();
