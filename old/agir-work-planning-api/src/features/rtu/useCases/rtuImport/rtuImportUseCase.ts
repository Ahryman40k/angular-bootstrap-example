import { ErrorCodes, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { AnalysisLayerIds, IFeature } from '@villemontreal/core-utils-geo-nodejs-lib/dist/src';
import { clone, uniqBy } from 'lodash';
import * as moment from 'moment';
import { configs } from '../../../../../config/configs';
import { IValidationError } from '../../../../repositories/core/baseRepository';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { infoRtuService, STATUS_OK } from '../../../../shared/rtuImport/infoRtuService';
import { IRtuFilterInput } from '../../../../shared/rtuImport/rtuFilterInput';
import { fireAndForget } from '../../../../utils/fireAndForget';
import { createLogger } from '../../../../utils/logger';
import { Audit } from '../../../audit/audit';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { RtuImportError, RtuImportTarget } from '../../models/rtuImportError';
import { RtuImportLog, RtuImportStatus } from '../../models/rtuImportLog';
import { RtuProject } from '../../models/rtuProject';
import { RtuProjectError } from '../../models/rtuProjectError';
import { RtuProjectFindOptions } from '../../models/rtuProjectFindOptions';
import { rtuImportLogRepository } from '../../mongo/rtuImportLogRepository';
import { rtuProjectRepository } from '../../mongo/rtuProjectRepository';

const logger = createLogger('rtuImportUseCase');

const DATE_FROM = '2015-01-01';
const MAX_DATE_TO = '-12-31';
const MAX_YEARS = 10;
const bodyFilter: IRtuFilterInput = {
  name: null,
  description: null,
  dateFrom: DATE_FROM,
  dateTo: '',
  dateRelFrom: null,
  dateRelTo: null,
  dateExpired: true,
  dateModification: null,
  isSelected: 'false',
  status: [],
  selfPartner: null,
  extent: null,
  zoomRegion: null,
  initiator: null,
  probability: null,
  projectNumber: null,
  projectName: null,
  mapRotation: null,
  isConflict: false,
  partnerIds: [],
  officeIds: [],
  areaIds: [],
  typeIds: [],
  phaseIds: [],
  conflict: false,
  temporary: false,
  defaultFilter: false
};

export class RtuImportUseCase extends UseCase<void, void> {
  private startDateTime: Date;

  public async execute(): Promise<Response<void>> {
    logger.debug('Start RtuImportUseCase()');
    const response = await this.import(false);
    logger.debug('End RtuImportUseCase()');
    return response;
  }

  public async import(blocking: boolean): Promise<Response<void>> {
    this.startDateTime = new Date();
    logger.debug(`start import() at ${this.startDateTime}`);
    const openRtuImportSessionResult = await this.openRtuImportSession();
    if (openRtuImportSessionResult.isFailure) {
      const rtuImportErrorResult = RtuImportError.create({
        code: ErrorCode.FORBIDDEN,
        target: RtuImportTarget.SESSION
      });
      if (rtuImportErrorResult.isFailure) {
        return left(new UnexpectedError(Result.combineForError(rtuImportErrorResult)));
      }
      await this.saveImportLog(rtuImportErrorResult.getValue());
      return left(openRtuImportSessionResult.errorValue() as any);
    }

    if (blocking) {
      await this.saveRtuProjects(await this.getRtuProjects(openRtuImportSessionResult.getValue()));
    } else {
      fireAndForget(async () => {
        await this.saveRtuProjects(await this.getRtuProjects(openRtuImportSessionResult.getValue()));
      });
    }
    logger.debug('end import()');
    return right(Result.ok<void>());
  }

  private async openRtuImportSession(): Promise<Result<string>> {
    logger.debug('start openRtuImportSession()');
    const openSessionResult = await infoRtuService.openInfoRtuSession();
    if (openSessionResult.isFailure) {
      return openSessionResult as Result<any>;
    }
    const openSessionResponse = openSessionResult.getValue();
    // we received a succesfull http response but we need to validate inside body if status is ok
    if (openSessionResponse.status !== STATUS_OK) {
      return Result.fail(
        new UnexpectedError(openSessionResponse, 'Server response was ok but result body status is not ok')
      );
    }
    const idSession = openSessionResponse.result?.sessionId?.toString();
    logger.debug({ idSession }, 'idSession received');
    if (!idSession) {
      return Result.fail(new UnexpectedError(idSession, 'Not valid session id'));
    }
    logger.debug('end openRtuImportSession()');
    return Result.ok<string>(idSession);
  }

  public async getRtuProjects(idSession: string): Promise<Result<RtuProject>[]> {
    logger.debug('init getListOfRtuProjects()');
    let rtuProjects: Result<RtuProject>[] = [];
    const pagingPartnerIds = configs.rtuImport.projectsConfig.paging.partnerIds;
    let localIdSession = idSession;
    // get partnerIds from taxonomies
    const listPartnerIds = await taxonomyService.getGroup(TaxonomyGroup.infoRtuPartner);
    // clone bodyFilter to avoid conflict in multiple request
    const bodyFilterLocal = {
      ...clone(bodyFilter),
      areaIds: await infoRtuService.getListAreaIds(),
      dateTo:
        moment()
          .add(MAX_YEARS, 'years')
          .format('YYYY') + MAX_DATE_TO
    };
    // start paging by config filter by group of partnerIds depending the config
    for (let i = 0; i < listPartnerIds.length; i = i + pagingPartnerIds) {
      // get a sub-group of partnerIds limited by config
      bodyFilterLocal.partnerIds = await this.getListPartnerIdsByIndex(i, pagingPartnerIds, listPartnerIds);
      // log filter to allow debugging
      logger.debug(bodyFilterLocal, 'Current bodyFilter ready to be sent');
      // only get listOfSubProjetcs, in next recit we will map to planing Projets and save
      const rtuFilterSessionResult = await this.setFilterOfSubProjects(localIdSession, bodyFilterLocal);
      if (rtuFilterSessionResult.isSuccess) {
        // refresh session with current or new result of set filter
        localIdSession = rtuFilterSessionResult.getValue();
        // get list of projets it can be empty array
        rtuProjects = rtuProjects.concat(await this.getListOfSubProjects(localIdSession));
      }
    }
    return rtuProjects;
  }

  private async saveRtuProjects(rtuProjectsResult: Result<RtuProject>[]): Promise<void> {
    logger.debug({ total: rtuProjectsResult.length }, 'List of projects to save');
    logger.debug({ total: rtuProjectsResult.filter(result => result.isSuccess).length }, 'List of projects isSuccess');
    logger.debug({ total: rtuProjectsResult.filter(result => result.isFailure).length }, 'List of projects isFailure');
    // if not projects found log a global import log  error an exit
    if (rtuProjectsResult.length === 0) {
      await this.saveImportLog(
        RtuImportError.create({
          code: ErrorCode.EMPTY_LIST,
          target: RtuImportTarget.PROJECTS
        }).getValue()
      );
      return;
    }
    // get list of succesProjects and failedProjects
    const succesProjects = rtuProjectsResult.filter(value => value.isSuccess).map(item => item.getValue());
    const failedProjects = rtuProjectsResult.filter(value => value.isFailure).map(item => item.errorValue() as any);
    // delete all old projects
    const rtuProjectFindOptions = RtuProjectFindOptions.create({ criterias: {} }).getValue();
    const deleteResult = await rtuProjectRepository.delete(rtuProjectFindOptions, { applyHistory: false });
    // validate delete result
    if (deleteResult.isFailure) {
      logger.error({ result: deleteResult.errorValue() }, 'deleting all error');
      await this.saveImportLog(
        RtuImportError.create({
          code: ErrorCode.DELETE,
          target: RtuImportTarget.DATABASE
        }).getValue(),
        failedProjects
      );
      return;
    }
    if (succesProjects.length) {
      // save all projects in one batch
      const insertManyResult = await rtuProjectRepository.saveBulk(succesProjects, {
        ordered: false,
        upsert: false
      });
      // if insert many success save import log
      if (insertManyResult.isSuccess) {
        const insertedObjs = insertManyResult.getValue()?.savedObjects;
        const errorsValidation = insertManyResult.getValue()?.validationErrors || [];
        logger.debug({ total: insertedObjs?.length }, 'Total Projects insered in BD');
        // if not database validation erros and all succesfull projects inserted
        if (!errorsValidation.length && !failedProjects.length && insertedObjs?.length === succesProjects?.length) {
          await this.saveImportLog(null);
          return;
        }
        // add other error validation in database to failedProjects
        const dataBaseFailedProjects = await this.extractDataBaseValidationError(
          insertedObjs,
          errorsValidation,
          succesProjects
        );
        if (dataBaseFailedProjects.length) {
          failedProjects.push(...dataBaseFailedProjects);
        }
      } else {
        logger.debug({ errorText: insertManyResult.errorValue() }, 'Error insertManyResult');
        await this.saveImportLog(
          RtuImportError.create({
            code: ErrorCode.INSERT_MANY,
            target: RtuImportTarget.DATABASE
          }).getValue(),
          failedProjects
        );
        return;
      }
    }
    // save invalid projects
    const rtuImportErrorResult = RtuImportError.create({
      code: ErrorCode.INVALID,
      target: RtuImportTarget.PROJECTS,
      values: { value1: failedProjects.length }
    });
    await this.saveImportLog(rtuImportErrorResult.getValue(), failedProjects);
  }

  private async saveImportLog(errorDetail: RtuImportError, failedProjects: RtuProjectError[] = []): Promise<void> {
    const audit: Audit = Audit.fromCreateContext();
    const rtuImportLogCreateResult = RtuImportLog.create({
      startDateTime: this.startDateTime ? this.startDateTime : new Date(),
      endDateTime: new Date(),
      status: errorDetail ? RtuImportStatus.FAILURE : RtuImportStatus.SUCCESSFUL,
      audit,
      errorDetail,
      failedProjects
    });
    if (rtuImportLogCreateResult.isFailure) {
      logger.error(rtuImportLogCreateResult.errorValue(), 'Error in RtuImportLog.create()');
    }
    if (rtuImportLogCreateResult.isSuccess) {
      const savedRtuImportLogResult = await rtuImportLogRepository.save(rtuImportLogCreateResult.getValue());
      // End set audit and save in BD
      if (savedRtuImportLogResult.isFailure) {
        logger.error(savedRtuImportLogResult.errorValue(), 'Error in rtuImportLogRepository.save()');
      } else {
        logger.debug('RtuImportLog save correctly');
      }
    }
  }

  private async extractDataBaseValidationError(
    insertedObjs: RtuProject[],
    errorsValidation: IValidationError[],
    succesProjects: RtuProject[]
  ): Promise<RtuProjectError[]> {
    logger.debug({ resullt: uniqBy(errorsValidation, 'message') }, 'Distinct errors during insertMany');
    const listDataBaseInputErrors = [];
    // remove not inserted in success projects
    const filterSuccesProjects = succesProjects.filter(item => !insertedObjs.find(o => o.id === item.id));
    if (filterSuccesProjects.length !== errorsValidation.length) {
      logger.error('Lists filterSuccesProjects and errorsValidation are not equal');
      return [];
    }
    for (const [key, item] of filterSuccesProjects.entries()) {
      const errorDetail = RtuImportError.create({
        code: ErrorCodes.InvalidInput,
        target: RtuImportTarget.DATABASE,
        values: { value1: errorsValidation[key].message }
      });
      const rtuProjectError = RtuProjectError.create({
        projectId: item.id,
        projectNoReference: item.noReference,
        projectName: item.name,
        streetName: item.streetName,
        streetFrom: item.streetFrom,
        streetTo: item.streetTo,
        errorDetails: [errorDetail.getValue()]
      });
      listDataBaseInputErrors.push(rtuProjectError.getValue());
    }
    return listDataBaseInputErrors;
  }

  private async getListPartnerIdsByIndex(index: number, count: number, listPartnerIds: ITaxonomy[]): Promise<string[]> {
    const ids = [];
    // if index + count > length of list, we need to cut to length to avoid positions in the list that doesn't exist
    const maxIterationCount = index + count >= listPartnerIds.length ? listPartnerIds.length : index + count;
    for (let i = index; i < maxIterationCount; i++) {
      ids.push(listPartnerIds[i].code);
    }
    return ids;
  }

  /**
   * this method set filters and return a session id
   * @param idSession actual session id or new one
   * @param retryCount
   * @returns
   */
  private async setFilterOfSubProjects(
    idSession: string,
    bodyFilterParam: IRtuFilterInput,
    retryCount = 0
  ): Promise<Result<string>> {
    const rtuFilterSessionResult = await infoRtuService.setFilterRtuImport(idSession, bodyFilterParam);
    if (rtuFilterSessionResult.isFailure) {
      logger.error(rtuFilterSessionResult.errorValue(), 'Error setting filter with this input');
      // try again if there is a isForbiddenError and limit max retry still good
      if (
        this.isForbiddenError(rtuFilterSessionResult.errorValue()) &&
        retryCount < configs.rtuImport.projectsConfig.sessionRetryMax
      ) {
        return this.setFilterOfSubProjects(await infoRtuService.refreshSessionId(), bodyFilterParam, retryCount + 1);
      }
      return Result.fail(new UnexpectedError('Error setting filter'));
    }
    return Result.ok(idSession);
  }

  private async getListOfSubProjects(idSession: string, retryCount = 0): Promise<Result<RtuProject>[]> {
    // get list projets
    const listProjectsResult = await infoRtuService.getRtuImportProjects(idSession);
    if (listProjectsResult.isFailure) {
      logger.error('Error getting list of projects with this input');
      // when error return empty list to allow process continue
      return [];
    }
    logger.debug({ result: listProjectsResult.getValue().result.length }, 'list projets()');
    const boroughsAndCitiesFeaturesResult = await spatialAnalysisService.getFeaturesBylayerId([
      AnalysisLayerIds.boroughs,
      AnalysisLayerIds.cities
    ]);
    if (boroughsAndCitiesFeaturesResult.isFailure) {
      logger.error(
        boroughsAndCitiesFeaturesResult.error,
        'Error when trying to get all features for boroughs and cities '
      );
    }
    const listAreaIds = await infoRtuService.getListAreaIdsTaxonomy();
    const filteredBoroughsAndCities: IFeature[] =
      boroughsAndCitiesFeaturesResult.isSuccess && boroughsAndCitiesFeaturesResult.getValue()
        ? boroughsAndCitiesFeaturesResult
            .getValue()
            .filter(
              feature =>
                feature?.properties?.dateDebut &&
                new Date() >= new Date(feature?.properties?.dateDebut) &&
                (!feature?.properties?.dateFin || new Date() <= new Date(feature?.properties?.dateFin)) &&
                listAreaIds.find(ct => ct.properties?.rrvaNumArrPti === feature?.properties?.rrvaNumArrPti)
            )
        : [];

    // all projects will be return  but some of them could have errors inside
    return Promise.all(
      listProjectsResult
        .getValue()
        .result.map(async project => infoRtuService.mapInfoRtuProjectToRtuProject(project, filteredBoroughsAndCities))
    );
  }

  // TODO: to be removed in task APOC-6659
  private isForbiddenError(error: any): error is ForbiddenError {
    return error.constructor && error.constructor === ForbiddenError;
  }
}

export const rtuImportUseCase = new RtuImportUseCase();
