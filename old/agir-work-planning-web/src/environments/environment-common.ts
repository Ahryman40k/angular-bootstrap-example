import { MtlAuthLibraryConfig } from '@villemontreal/core-security-angular-lib';
import { IMapConfig } from '@villemontreal/maps-angular-lib';
import { mapConfig } from 'src/app/map/config/config';

import {
  IApiLocationConfig,
  IApiPlanningConfig,
  IApiSpatialAnalysisConfig,
  IServicesConfig
} from './environment-interfaces';

export function createAuthenticationConfig(
  authServerUrl: string,
  clientId: string,
  baseWebUrl: string,
  interceptDomains: string[],
  sessionCheckInterval?: number
): MtlAuthLibraryConfig {
  return {
    activation: true,
    authServerUrl,
    clientId,
    scope: 'openid profile email user_name address phone',
    sessionChecksEnabled: true,
    silentRefreshEnabled: true,
    postLogoutRedirectUrl: `${baseWebUrl}/logout`,
    postLoginRedirectUrl: `${baseWebUrl}/authorize`,
    startupRoute: '/',
    unauthorizedRoute: `${baseWebUrl}/unauthorized`,
    silentRefreshUrl: `${baseWebUrl}/assets/html/silent-refresh.html`,
    redirectToGuardAttemptedUrl: true,
    applicationName: 'agir-planif-web',
    interceptDomains,
    sessionCheckIntervall: sessionCheckInterval
  };
}

export function createMapConfig(baseMapUrl: string): IMapConfig {
  return { ...mapConfig, baseUrl: baseMapUrl };
}

export function createApiLocationConfig(baseApiUrl: string): IApiLocationConfig {
  const baseUrlLocation = baseApiUrl + '/api/geographic/location/v1';
  return {
    addresses: baseUrlLocation + '/addresses'
  };
}

export function createApiPlanningConfig(baseApiUrl: string, instanceName: string = ''): IApiPlanningConfig {
  let planningBaseUrl = baseApiUrl + '/api/public-works/planning/v1';

  // Vérification de la présence de l'instance pour l'environnement de formation
  if (instanceName !== '') {
    planningBaseUrl = `${baseApiUrl}/api/public-works/planning-${instanceName}/v1`;
  }

  return {
    annualPrograms: planningBaseUrl + '/annualPrograms',
    assets: planningBaseUrl + '/assets',
    bicImportLogs: planningBaseUrl + '/import/bicImportLogs',
    documents: planningBaseUrl + '/documents',
    drmNumber: planningBaseUrl + '/projects/generateDrmNumber',
    submissionNumber: planningBaseUrl + '/submissions',
    importInternalProjects: planningBaseUrl + '/import/internal/projects',
    info: planningBaseUrl + '/info',
    interventions: planningBaseUrl + '/interventions',
    me: planningBaseUrl + '/me',
    nexoImports: planningBaseUrl + '/nexoImports',
    opportunityNotices: planningBaseUrl + '/opportunityNotices',
    programBooks: planningBaseUrl + '/programBooks',
    projects: planningBaseUrl + '/projects',
    rtuExportLogs: planningBaseUrl + '/rtuExportLogs',
    rtuImportLogs: planningBaseUrl + '/rtuImportLogs',
    rtuProjects: planningBaseUrl + '/rtuProjects',
    search: planningBaseUrl + '/search',
    taxonomies: planningBaseUrl + '/taxonomies',
    requirements: planningBaseUrl + '/requirements'
  };
}

export function createApiSpatialAnalysisConfig(baseApiUrl: string): IApiSpatialAnalysisConfig {
  const spatialAnalysisBaseUrl = baseApiUrl + '/api/it-platforms/geomatic/spatialanalysis/v1';
  return {
    url: spatialAnalysisBaseUrl
  };
}

export function createServicesConfig(): IServicesConfig {
  return {
    import: {
      internal: {
        chunkSize: 10
      }
    },
    notifications: {
      timeouts: {
        default: 5000,
        warning: 6000,
        success: 5000
      }
    },
    taxonomies: {
      refreshInterval: 4 * 60 * 60 * 1000 // 4 hours
    },
    pagination: {
      limitMax: 100000
    }
  };
}
