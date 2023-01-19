import {
  createApiLocationConfig,
  createApiPlanningConfig,
  createApiSpatialAnalysisConfig,
  createAuthenticationConfig,
  createMapConfig,
  createServicesConfig
} from './environment-common';

const baseWebUrl = 'https://services.accept.montreal.ca/agir-planification-formation';
const baseApiUrl = 'https://api.accept.montreal.ca';
const gdaBaseWebUrl = 'https://services.accept.interne.montreal.ca/acces-gestion';

export const environment = {
  production: true,
  map: {
    config: createMapConfig(baseApiUrl)
  },
  apis: {
    location: createApiLocationConfig(baseApiUrl),
    planning: createApiPlanningConfig(baseApiUrl, 'training'),
    spatialAnalysis: createApiSpatialAnalysisConfig(baseApiUrl)
  },
  externalUrls: {
    gdaUrl: gdaBaseWebUrl
  },
  services: createServicesConfig(),
  authentificationConfig: createAuthenticationConfig(
    'https://idp.accept.montreal.ca',
    '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!2605.74E3.A962.7954',
    baseWebUrl,
    [baseApiUrl]
  )
};
