// ==========================================
// We export the global constants too!

// ==========================================
export { globalConstants } from '@villemontreal/core-utils-general-nodejs-lib';

interface IConstantServices {
  project: {
    category: {
      yearRange: number;
    };
  };
}
/**
 * Endpoint types.
 */
export enum EndpointTypes {
  /**
   * An endpoint of type "NONE" won't have a root or a domain path
   * automatically added to its specified path... This allows
   * you to specify the exact path to use to this endpoint.
   */
  NONE = 'NONE' as any,
  API = 'API' as any,
  DOCUMENTATION = 'DOCUMENTATION' as any,
  DIAGNOSTICS = 'DIAGNOSTICS' as any
}

export enum EntityType {
  intervention = 'intervention',
  project = 'project',
  moreInformation = 'moreInformation'
}

/**
 * Application constants
 */
export class Constants {
  /**
   * Known environment types
   */
  get Environments() {
    return {
      LOCAL: 'local',
      ACCEPTATION: 'acceptation',
      LAB: 'lab',
      // ==========================================
      // "development" seems to be the standard Node label, not "dev".
      // The node-config library uses this :
      // https://github.com/lorenwest/node-config/wiki/Configuration-Files#default-node_env
      // ==========================================
      DEV: 'development',
      // ==========================================
      // "production" seems to be the standard Node label, not "prod".
      // ==========================================
      PROD: 'production'
    };
  }

  /**
   * Known app instances
   */
  get AppInstances() {
    return {
      /**
       * App instance name to use when running local tests.
       * This allows the configs from the "local-tests.yaml"
       * file to be picked.
       */
      TESTS: 'tests'
    };
  }

  /**
   * Environment variables
   */
  get EnvVariables() {
    return {
      /**
       * Environment type. The possible values are defined
       * in "Constants.Environments"
       * Do not change this :
       * https://github.com/lorenwest/node-config/wiki/Configuration-Files#default-node_env
       */
      ENV_TYPE: 'NODE_ENV',

      /**
       * The timezone to use for the Oracle connections.
       */
      ORA_SDTZ: 'ORA_SDTZ',

      NODE_APP_INSTANCE: 'NODE_APP_INSTANCE',

      /**
       * The number of working thread available
       * to node-oracledb.
       */
      UV_THREADPOOL_SIZE: 'UV_THREADPOOL_SIZE'
    };
  }

  /**
   * Endpoint type roots.
   *
   * Those roots should probably never be changed, since some
   * of our operation components (Nginx / Kong / etc.) are
   * configured for them.
   */
  get EnpointTypeRoots() {
    return {
      API: '/api',
      DIAGNOSTICS: '/diagnostics',
      DOCUMENTATION: '/documentation'
    };
  }

  /**
   * API Errors related constants
   */
  get apiErrors() {
    return {
      codes: {}
    };
  }

  get assets() {
    return {
      workArea: {
        featuresMaxDistance: 15
      }
    };
  }

  get locationPaths() {
    return {
      ANNUAL_PROGRAM: `/v1/annualPrograms`,
      ASSETS_SEARCH_WORK_AREA: `/v1/search/assets/work-area`,
      ASSETS_SEARCH: `/v1/assets/search`,
      ASSETS_SEARCH_LAST_INTERVENTION: `/v1/assets/search/lastIntervention`,
      ASSETS: `/v1/assets`,
      BIC_IMPORT_LOGS: `/v1/import/bicImportLogs`,
      DOCUMENT: `/v1/documents`,
      IMPORT_INTERNAL: `/v1/import/internal`,
      INTERVENTION: `/v1/interventions`,
      OPPORTUNITY_NOTICES: `/v1/opportunityNotices`,
      PROGRAM_BOOK: `/v1/programBooks`,
      PROJECT: `/v1/projects`,
      REQUIREMENTS: `/v1/requirements`,
      SEARCHWORKAREA: `/v1/search/work-area`,
      SUBMISSIONS: `/v1/submissions`,
      TAXONOMIES: `/v1/taxonomies`,
      USERS_PREFERENCES: `/v1/me/preferences`,
      GET_DIAGNOSTICS_INFO: `/v1/info`,
      RTU_IMPORT_LOGS: `/v1/rtuImportLogs`,
      RTU_EXPORT_LOGS: `/v1/rtuExportLogs`,
      RTU_PROJECTS: `/v1/rtuProjects`
    };
  }

  get interventionRules() {
    return {
      MINIMUM_YEAR_GAP: 0
    };
  }

  get operation() {
    return {
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete'
    };
  }

  get historyCategoryId() {
    return {
      ANNUAL_DISTRIBUTION: 'annualDistribution',
      COMMENT: 'comment',
      DECISION: 'decision',
      DOCUMENT: 'document',
      DRM_NUMBER: 'drmNumber',
      REQUIREMENT: 'exigence',
      STATUS: 'status'
    };
  }

  get systemMessages() {
    return {
      ANNUAL_DISTRIBUTION_UPDATED: 'La distribution annuelle à été modifiée',
      REQUIREMENT_ADDED: 'Une exigence a été ajoutée',
      REQUIREMENT_UPDATED: 'Une exigence a été modifiée',
      REQUIREMENT_DELETED: 'Une exigence a été supprimée',
      COMMENT_ADDED: 'Un commentaire a été ajouté',
      COMMENT_UPDATED: 'Un commentaire a été modifié',
      COMMENT_DELETED: 'Un commentaire a été supprimé',
      DECISION_ADDED: 'Une décision a été ajoutée',
      DOCUMENT_ADDED: 'Un document a été ajouté',
      DOCUMENT_UPDATED: 'Un document a été modifié',
      DOCUMENT_DELETED: 'Un document a été supprimé',
      DRM_NUMBER_DELETED: 'Le numéro de drm a été supprimé',
      PROJECT_INTERVENTION_STATUS: `Le status de l'intervention a été modifié car le status du projet a été modifié`,
      PROJECT_ROLLBACK: `Le project a fait un retour à son état précédent`
    };
  }

  get spatialAnalysis() {
    return {
      ASSET_WORK_AREA_INTERSECTED_FEATURES_BUFFER_DISTANCE: 20,
      PROJECT_WORK_AREA_MINIMAL_INTERSECTED_AREA_METERS: 20,
      INTERSECTED_FEATURES_BUFFER_DISTANCE: 2,
      SIMPLIFICATION_TOLERANCE: 0.00001,
      SIMPLIFICATION_PROJECT_TOLERANCE: 0.00004,
      UNION_FAILURE_BUFFER_METERS: 0.25
    };
  }

  get taxonomy() {
    return {
      CACHE_ENABLED: true,
      REFRESH_RATE_MINUTES: 1
    };
  }

  /**
   * Mongo constants
   */
  get mongo() {
    return {
      testing: {
        /**
         * The "connectionString" to use for a mock
         * Mongo server to be used instead of a real one.
         * This option is only available on the "development"
         * environment, or when tests are ran.
         */
        MOCK_CONNECTION_STRING: 'mock'
      },

      /**
       * The names of the Mongo collections used in
       * this application.
       */
      collectionNames: {
        ANNUAL_PROGRAMS: 'annual_programs',
        ANNUAL_PROGRAMS_HISTORICALS: 'annual_programs_historicals',
        CONSTRAINTS_HISTORICALS: 'constraints_historicals',
        COUNTERS: 'counters',
        INTERVENTIONS: 'interventions',
        HISTORY: 'history',
        IMPORT_RELATIONS: 'import_relations',
        BIC_IMPORT_LOGS: 'bic_import_logs',
        NEXO_IMPORT_LOGS: 'nexo_import_logs',
        INTERVENTIONS_HISTORICALS: 'interventions_historicals',
        OPPORTUNITY_NOTICES: 'opportunity_notices',
        PROGRAM_BOOKS: 'program_books',
        PROGRAM_BOOKS_HISTORICALS: 'program_books_historicals',
        PROJECTS: 'projects',
        PROJECTS_HISTORICALS: 'projects_historicals',
        TAXONOMIES: 'taxonomies',
        TAXONOMIES_HISTORICALS: 'taxonomies_historicals',
        USERS_PREFERENCES: 'users_preferences',
        REQUIREMENTS: 'requirements',
        RTU_IMPORT_LOGS: 'rtu_import_logs',
        RTU_PROJECTS: 'rtu_projects',
        RTU_EXPORT_LOGS: 'rtu_export_logs',
        SUBMISSIONS: 'submissions'
      }
    };
  }

  /**
   * media-types constants
   */
  get mediaTypes() {
    return {
      GEOJSON: 'application/geo+json',
      JSON: 'application/json',
      MULTI_PART_FORM_DATA: 'multipart/form-data',
      PLAIN_TEXT: 'text/plain'
    };
  }

  /**
   * Localization constants
   */
  get localization() {
    return {
      locales: {
        ENGLISH: 'en',
        FRENCH_CANADIAN: 'fr-CA'
      }
    };
  }

  /**
   * Type objects constants
   */
  get typeEntities() {
    return {
      INTERVENTION: 'intervention',
      PROJECT: 'project'
    };
  }

  /**
   * Paginantion default
   */
  get PaginationDefaults() {
    return {
      /**
       * App instance name to use when running local tests.
       * This allows the configs from the "local-tests.yaml"
       * file to be picked.
       */
      LIMIT: 100,
      OFFSET: 0,
      LIMITMAX: 100000
    };
  }

  /**
   * Custom Http headers
   */
  get httpHeadersValues() {
    return {
      BEARER: 'Bearer ',
      NO_CACHE: 'no-cache'
    };
  }

  /**
   * Logging constants
   */
  get logging() {
    return {
      /**
       * The properties that can be added to a log entry.
       */
      properties: {
        /**
         * The type of log. Those types are specified in
         * the following "logType" section.
         */
        LOG_TYPE: 'logType',

        /**
         * The version of the log type.
         */
        LOG_TYPE_VERSION: 'logTypeVersion',

        /**
         * "Nom du composant logiciel"
         */
        APP_NAME: 'app',

        /**
         * "Version du composant logiciel"
         */
        APP_VERSION: 'version',

        /**
         * Correlation id
         */
        CORRELATION_ID: 'cid'
      },

      /**
       * The types of logs
       */
      logType: {
        /**
         * The type for our Ville de Montréal logs.
         */
        MONTREAL: 'mtl'
      }
    };
  }

  /**
   * Libraries related constants
   */
  get libraries() {
    return {
      /**
       * The npm scope of our custom libraries.
       */
      MONTREAL_SCOPE: '@villemontreal'
    };
  }

  get strings() {
    return {
      NA: 'N/D'
    };
  }

  get services(): IConstantServices {
    return {
      project: {
        category: {
          yearRange: 9
        }
      }
    };
  }

  get request() {
    return {
      FILE: 'file' // UPLOADED FILE
    };
  }
}

export let constants: Constants = new Constants();
