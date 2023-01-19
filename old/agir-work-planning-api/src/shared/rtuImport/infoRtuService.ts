import { booleanPointInPolygon } from '@turf/turf';
import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  ErrorCodes,
  IGeometry,
  IPoint3D,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { httpUtils } from '@villemontreal/core-http-request-nodejs-lib/dist/src';
import { IFeature } from '@villemontreal/core-utils-geo-nodejs-lib';
import { readFileSync } from 'fs-extra';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as path from 'path';
import * as superagent from 'superagent';
import { configs } from '../../../config/configs';
import { constants } from '../../../config/constants';
import { Audit } from '../../features/audit/audit';
import { RtuContactProject } from '../../features/rtu/models/rtuContactProject';
import { RtuImportError, RtuImportTarget } from '../../features/rtu/models/rtuImportError';
import { RtuProject } from '../../features/rtu/models/rtuProject';
import { RtuProjectValidator } from '../../features/rtu/validators/rtuProjectValidator';
import { taxonomyService } from '../../features/taxonomies/taxonomyService';
import { workAreaService } from '../../services/workAreaService';
import { createLogger } from '../../utils/logger';
import { ForbiddenError } from '../domainErrors/forbiddenError';
import { UnexpectedError } from '../domainErrors/unexpectedError';
import { Result } from '../logic/result';
import { IInfoRtuPlaces } from './infoRtuPlaces';
import { IInfoRtuContactProject, IInfoRtuProject } from './infoRtuProject';
import { IRtuContactResponse } from './IRtuContactResponse';
import { IRtuFilterInput } from './rtuFilterInput';
import { IRtuFilterResponse } from './rtuFilterResponse';
import { IRtuProjetsResponse } from './rtuProjetsResponse';
import { IRtuSessionResponse } from './rtuSessionResponse';

const logger = createLogger('rtuImportService');

export const STATUS_OK = 'OK';

class InfoRtuService {
  private phaseTaxonomy: ITaxonomy[];
  private listAreaIdsTaxonomy: ITaxonomy[];
  private certificate: Buffer;

  public async openInfoRtuSession(): Promise<Result<IRtuSessionResponse>> {
    logger.info('Init openInfoRtuSession()');
    const urlSession = configs.rtuImport.urls.session;
    const request = this.getRtuSuperagentRequest('POST', urlSession);

    // prepare input credentials
    const bodyAuth: IRtuSessionInput = {
      username: configs.rtuImport.serviceAccount.username,
      password: configs.rtuImport.serviceAccount.password,
      type: configs.rtuImport.serviceAccount.scope
    };
    try {
      // add request information
      this.addHeaders(request.send(bodyAuth));
      // call endpoint rtu
      const response = await httpUtils.send(request);
      if (!response?.ok) {
        if (response.status === HttpStatusCodes.FORBIDDEN) {
          return Result.fail(new ForbiddenError(response.error));
        } // unexpect error
        return Result.fail(new UnexpectedError(response.error));
      }
      return Result.ok(response.body);
    } catch (error) {
      return Result.fail(new UnexpectedError(error));
    }
  }

  public async getContactById(sessionId: string, contactId: string): Promise<Result<IRtuContactResponse>> {
    logger.info('Init getContactById()');
    const urlContact = `${configs.rtuExport.urls.contacts}/${contactId}`;
    const request = this.getRtuSuperagentRequest('GET', urlContact).query({ sessionId });

    try {
      // call endpoint rtu
      const response = await httpUtils.send(request);
      if (!response?.ok) {
        if (response.status === HttpStatusCodes.UNAUTHORIZED) {
          return Result.fail(new ForbiddenError(response.error));
        } // unexpect error
        return Result.fail(new UnexpectedError(response.error));
      }
      return Result.ok(response.body);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public async setFilterRtuImport(
    sessionId: string,
    rtuFilterInput: IRtuFilterInput
  ): Promise<Result<IRtuFilterResponse>> {
    logger.info('Init setFilterRtuImport()');
    const urlFilter = configs.rtuImport.urls.filter;
    const request = this.getRtuSuperagentRequest('PUT', urlFilter).query({ sessionId });

    try {
      // add request information
      this.addHeaders(request.send(rtuFilterInput));
      // call endpoint rtu
      const response = await httpUtils.send(request);
      if (!response?.ok) {
        if (response.status === HttpStatusCodes.UNAUTHORIZED) {
          return Result.fail(new ForbiddenError(response.error));
        } // unexpect error
        return Result.fail(new UnexpectedError(response.error));
      }
      return Result.ok(response.body);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public async getRtuImportProjects(sessionId: string): Promise<Result<IRtuProjetsResponse>> {
    logger.info('Init getRtuImportProjects()');
    const urlProjets = configs.rtuImport.urls.projects;
    const request = this.getRtuSuperagentRequest('GET', urlProjets).query({ sessionId });

    try {
      // add request information
      request.send().timeout({
        response: configs.rtuImport.projectsConfig.timeout.response, // Wait x seconds for the server to start sending,
        deadline: configs.rtuImport.projectsConfig.timeout.deadline // allow x seconds for the file to finish loading.
      });
      this.addHeaders(request);
      // call endpoint rtu
      const response = await httpUtils.send(request);
      if (!response?.ok) {
        if (response.status === HttpStatusCodes.FORBIDDEN) {
          return Result.fail(new ForbiddenError(response.error));
        } // unexpect error
        return Result.fail(new UnexpectedError(response.error));
      }
      return Result.ok(response.body);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public async createRtuProject(sessionId: string, project: IInfoRtuProject): Promise<Result<IInfoRtuProject>> {
    logger.info({ projectId: project.noReference }, 'Init createRtuProject()');
    const urlProjets = configs.rtuExport.urls.projects;
    const request = this.getRtuSuperagentRequest('PUT', urlProjets).query({ sessionId });
    try {
      // add request information
      this.addHeaders(request.send(project));
      // call endpoint rtu
      const response = await httpUtils.send(request);
      if (!response?.ok) {
        if (response.status === HttpStatusCodes.UNAUTHORIZED) {
          return Result.fail(new ForbiddenError(response.error));
        } // unexpect error
        return Result.fail(new UnexpectedError(response.error));
      }
      return Result.ok(response.body.result);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public async updateRtuProject(sessionId: string, project: IInfoRtuProject): Promise<Result<IInfoRtuProject>> {
    logger.info({ idAgir: project.noReference, idInfoRtu: project.id }, 'Init updateRtuProject()');
    const urlProjets = configs.rtuExport.urls.projects;
    const request = this.getRtuSuperagentRequest('POST', urlProjets).query({ sessionId });
    try {
      // add request information
      this.addHeaders(request.send(project));
      // call endpoint rtu
      const response = await httpUtils.send(request);
      if (!response?.ok) {
        if (response.status === HttpStatusCodes.UNAUTHORIZED) {
          return Result.fail(new ForbiddenError(response.error));
        } // unexpect error
        return Result.fail(new UnexpectedError(response.error));
      }
      return Result.ok(response.body.result);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public async refreshSessionId(): Promise<string> {
    const rtuResponseResult = await this.openInfoRtuSession();
    if (rtuResponseResult.isFailure) {
      logger.error(rtuResponseResult.errorValue(), 'Not possible to refreshSessionId');
      return null;
    }
    return rtuResponseResult.getValue().result?.sessionId?.toString();
  }

  public addHeaders(request: superagent.SuperAgentRequest) {
    request
      .set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON)
      .set(httpHeaderFieldsTyped.CACHE_CONTROL, constants.httpHeadersValues.NO_CACHE);
  }

  public async mapInfoRtuProjectToRtuProject(
    infoRtuProject: IInfoRtuProject,
    filteredBoroughsAndCities: IFeature[]
  ): Promise<Result<RtuProject>> {
    this.phaseTaxonomy = await taxonomyService.getGroup(TaxonomyGroup.rtuProjectPhase);
    const contactResult = this.getContactResult(infoRtuProject.contact);
    const geometryResult = await this.joinGeometries(infoRtuProject.places, infoRtuProject.id);
    const audit: Audit = Audit.fromCreateContext();
    const rtuProjectResult = RtuProject.create(
      {
        name: infoRtuProject.name,
        description: infoRtuProject.description,
        areaId: this.findAreaIdCode(
          infoRtuProject.district,
          [infoRtuProject.coordinate.x, infoRtuProject.coordinate.y],
          filteredBoroughsAndCities
        ),
        partnerId: infoRtuProject.idOrganization,
        noReference: infoRtuProject.noReference,
        geometryPin: [infoRtuProject.coordinate.x, infoRtuProject.coordinate.y],
        geometry: geometryResult.isSuccess ? (geometryResult.getValue()?.geometry as IGeometry) : null,
        status: infoRtuProject.status.name,
        type: infoRtuProject.type.value,
        phase: this.findPhaseCode(infoRtuProject.phase.value),
        dateStart: infoRtuProject.dateStart,
        dateEnd: infoRtuProject.dateEnd,
        dateEntry: infoRtuProject.dateEntry,
        dateModification: infoRtuProject.dateModification,
        cancellationReason: infoRtuProject.cancellationReason,
        productionPb: infoRtuProject.productionPb,
        conflict: infoRtuProject.conflict,
        duration: infoRtuProject.duration,
        localization: infoRtuProject.localization,
        streetName: infoRtuProject.rueSur,
        streetTo: infoRtuProject.rueA,
        streetFrom: infoRtuProject.rueDe,
        contact: contactResult.isSuccess ? contactResult.getValue() : null,
        audit
      },
      infoRtuProject.id
    );
    let inputValidationResult = Result.combine([rtuProjectResult, geometryResult, contactResult]);
    if (inputValidationResult.isSuccess) {
      const taxonomiesValidationResult = await RtuProjectValidator.validateTaxonomies(rtuProjectResult.getValue());
      if (taxonomiesValidationResult.isFailure) {
        logger.debug({ values: taxonomiesValidationResult.errorValue() }, 'taxonomiesValidationResult');
      }
      // combine result errors
      inputValidationResult = Result.combine([inputValidationResult, taxonomiesValidationResult]);
    }
    // map to project error result
    if (inputValidationResult.isSuccess) {
      return rtuProjectResult;
    }
    return Result.fail<any>(
      RtuProject.fromResultError(
        inputValidationResult,
        infoRtuProject.id,
        infoRtuProject.noReference,
        infoRtuProject.name,
        infoRtuProject.rueSur,
        infoRtuProject.rueDe,
        infoRtuProject.rueA
      )
    );
  }

  public getContactResult(contact: IInfoRtuContactProject): Result<RtuContactProject> {
    if (!contact) {
      return Result.fail(
        RtuImportError.create({ code: ErrorCodes.MissingValue, target: RtuImportTarget.CONTACT }).getValue()
      );
    }
    return RtuContactProject.create(
      {
        officeId: contact.officeId,
        num: contact.num,
        prefix: contact.prefix,
        name: contact.name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        phoneExtensionNumber: contact.phoneExtensionNumber,
        cell: contact.cell,
        fax: contact.fax,
        typeNotfc: contact.typeNotfc,
        paget: contact.paget,
        profile: contact.profile,
        globalRole: contact.globalRole,
        idInterim: contact.idInterim,
        inAutoNotification: contact.inAutoNotification,
        inDiffusion: contact.fax,
        areaName: contact.areaName,
        role: contact.role,
        partnerType: contact.partnerType,
        partnerId: contact.partnerId
      },
      contact?.id
    );
  }
  public async getListAreaIds(): Promise<string[]> {
    this.listAreaIdsTaxonomy = await this.getListAreaIdsTaxonomy();
    return this.listAreaIdsTaxonomy.map(taxo => taxo?.properties?.rtuData?.id);
  }

  public async getListAreaIdsTaxonomy(): Promise<ITaxonomy[]> {
    const [boroughs, cities, bridges] = await Promise.all(
      [TaxonomyGroup.borough, TaxonomyGroup.city, TaxonomyGroup.bridge].map(group => taxonomyService.getGroup(group))
    );
    this.listAreaIdsTaxonomy = [...boroughs.filter(taxo => taxo?.properties?.rtuData?.id), ...cities, ...bridges];
    return this.listAreaIdsTaxonomy;
  }

  public findPhaseCode(phase: string) {
    const taxo = this.phaseTaxonomy.find(item => item.label.fr === phase);
    return taxo?.code;
  }

  public findAreaIdCode(district: string, geometryPin: IPoint3D, filteredBoroughsAndCities: IFeature[]) {
    let taxo = this.listAreaIdsTaxonomy.find(item => item?.properties?.rtuData?.name === district);
    if (!taxo) {
      const featureWhereIsGeometryPin = filteredBoroughsAndCities?.find(e =>
        /**
         * wfs routes can return one of those geometry types depending on AnalysisLayerIds
         * used Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection;
         * since we are using boroughs and cities as layers we know that the only types
         * that will be retuned are depending on AnalysisLayerIds used
         * booleanPointInPolygon function accepts only Polygon | MultiPolygon
         * this is why we have to cast the geometry
         *
         */
        booleanPointInPolygon(geometryPin, e.geometry as Polygon | MultiPolygon)
      );
      if (featureWhereIsGeometryPin?.properties?.rrvaNumArrPti) {
        taxo = this.listAreaIdsTaxonomy?.find(
          item => item?.properties?.rrvaNumArrPti === featureWhereIsGeometryPin?.properties?.rrvaNumArrPti
        );
      }
    }
    return taxo?.code;
  }

  public async joinGeometries(
    places: IInfoRtuPlaces[],
    projectId: string
  ): Promise<Result<Feature<Polygon | MultiPolygon>>> {
    const geometriesStringList: string[] = [];
    for (const place of places) {
      if (place?.sections?.geometries) {
        geometriesStringList.push(...place.sections.geometries);
      }
      if (place?.intersection?.geometry) {
        geometriesStringList.push(place.intersection.geometry);
      }
      if (place?.interval?.geometries) {
        geometriesStringList.push(...place.interval.geometries);
      }
      if (place?.polygon?.geometries) {
        geometriesStringList.push(...place.polygon.geometries);
      }
      if (place?.address?.section?.geometry) {
        geometriesStringList.push(place.address.section.geometry);
      }
    }
    if (!geometriesStringList.length) {
      return Result.ok();
    }
    try {
      // conver string geometries in objects
      const geometriesList: IGeometry[] = geometriesStringList.map(geometry => JSON.parse(geometry));
      const newPolygon = await workAreaService.getPolygonFromGeometries(geometriesList);
      return Result.ok(newPolygon);
    } catch (error) {
      logger.error(error, 'Error converting geometries to polygones');
      return Result.fail(
        RtuImportError.create({ code: ErrorCodes.InvalidInput, target: RtuImportTarget.PLACES }).getValue()
      );
    }
  }

  private getRtuSuperagentRequest(verb: string, url: string): superagent.SuperAgentRequest {
    if (configs.rtuImport.certificate.enabled) {
      return superagent(verb, url).ca(this.getCertificate());
    }
    return superagent(verb, url);
  }

  private getCertificate(): Buffer {
    if (!this.certificate) {
      this.certificate = readFileSync(path.resolve(__dirname, configs.rtuImport.certificate.fileName));
    }
    return this.certificate;
  }
}

export const infoRtuService: InfoRtuService = new InfoRtuService();
