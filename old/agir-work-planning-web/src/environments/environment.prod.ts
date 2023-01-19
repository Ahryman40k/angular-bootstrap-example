import {
  createApiLocationConfig,
  createApiPlanningConfig,
  createApiSpatialAnalysisConfig,
  createAuthenticationConfig,
  createMapConfig,
  createServicesConfig
} from './environment-common';

const baseWebUrl = 'https://services.montreal.ca/agir-planification';
const baseApiUrl = 'https://api.montreal.ca';
const gdaBaseWebUrl = 'https://services.interne.montreal.ca/acces-gestion';

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
    'https://idp.montreal.ca',
    '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!58A2.409F.84F8.1A3C',
    baseWebUrl,
    [baseApiUrl]
  )
};
