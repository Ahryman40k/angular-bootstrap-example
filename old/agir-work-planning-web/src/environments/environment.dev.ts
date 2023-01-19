import {
  createApiLocationConfig,
  createApiPlanningConfig,
  createApiSpatialAnalysisConfig,
  createAuthenticationConfig,
  createMapConfig,
  createServicesConfig
} from './environment-common';

const baseWebUrl = 'https://services.dev.interne.montreal.ca/agir-planification';
const baseApiUrl = 'https://api.dev.interne.montreal.ca';
const gdaBaseWebUrl = 'https://services.dev.interne.montreal.ca/acces-gestion';

export const environment = {
  production: true,
  map: {
    config: createMapConfig(baseApiUrl)
  },
  apis: {
    location: createApiLocationConfig(baseApiUrl),
    planning: createApiPlanningConfig(baseApiUrl),
    spatialAnalysis: createApiSpatialAnalysisConfig(baseApiUrl)
  },
  externalUrls: {
    gdaUrl: gdaBaseWebUrl
  },
  services: createServicesConfig(),
  authentificationConfig: createAuthenticationConfig(
    'https://idp.dev.montreal.ca',
    '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!8A15.D6CB.054D.FB43',
    baseWebUrl,
    [baseApiUrl]
  )
};
