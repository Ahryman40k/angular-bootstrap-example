import {
  createApiLocationConfig,
  createApiPlanningConfig,
  createApiSpatialAnalysisConfig,
  createAuthenticationConfig,
  createMapConfig,
  createServicesConfig
} from './environment-common';

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const baseWebUrl = 'http://localhost:4200';
const baseApiLocalUrl = 'http://localhost:12345';
const baseApiDevUrl = 'https://api.dev.interne.montreal.ca';
const gdaBaseWebUrl = 'https://services.dev.interne.montreal.ca/acces-gestion';
const authenticationSessionCheckIntervalMs = 4 * 60 * 1000; // 4 minutes. This way, user sessions never expire in local environment.

export const environment = {
  production: false,
  map: {
    config: createMapConfig(baseApiDevUrl)
  },
  apis: {
    location: createApiLocationConfig(baseApiDevUrl),
    planning: createApiPlanningConfig(baseApiLocalUrl),
    spatialAnalysis: createApiSpatialAnalysisConfig(baseApiDevUrl)
  },
  externalUrls: {
    gdaUrl: gdaBaseWebUrl
  },
  services: createServicesConfig(),
  authentificationConfig: createAuthenticationConfig(
    'https://idp.dev.montreal.ca',
    '@!4025.CA62.9BB6.16C5!0001!2212.0010!0008!8A15.D6CB.054D.FB43',
    baseWebUrl,
    [baseApiLocalUrl, baseApiDevUrl],
    authenticationSessionCheckIntervalMs
  )
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
