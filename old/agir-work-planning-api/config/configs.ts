import { logLevelFromString } from '@villemontreal/core-utils-general-nodejs-lib';
import * as config from 'config';
import * as _ from 'lodash';
import * as path from 'path';

import { ConfigCache } from './../src/utils/configs/configCache';
import { constants } from './constants';

let message = `\n------------------------------------\n`;
message += `Configuration files loaded:\n`;
const sources = config.util.getConfigSources();
for (const source of sources) {
  message += `- ${source.name}\n`;
}
message += `------------------------------------\n`;
// tslint:disable-next-line:no-console
console.log(message);

export interface IProjectMaintainers {
  name: string;
  email: string;
}

/**
 * Configurations for the application.
 */
export class Configs {
  private static theInstance: Configs;

  /**
   * Absolute path to the root of the project.
   */
  public root: string;

  /**
   * Absolute path to a directory to use for tests.
   */
  public testDataDirPath: string;

  // ==========================================
  // The environment name is found by node-config. It will
  // use the "NODE_ENV" environment variable or fallback to
  // "development" if not found.
  // @see https://github.com/lorenwest/node-config/wiki/Configuration-Files#default-node_env
  // ==========================================
  private readonly theEnvironment: string;
  private readonly theEnvironmentInstance: string;

  private readonly cache: ConfigCache;

  private constructor() {
    this.root = path.normalize(__dirname + '/..');
    this.testDataDirPath = this.root + '/test-data';
    this.theEnvironment = config.util.getEnv(constants.EnvVariables.ENV_TYPE);
    this.theEnvironmentInstance = config.util.getEnv(constants.EnvVariables.NODE_APP_INSTANCE);
    this.cache = new ConfigCache();
  }

  /**
   * Singleton
   */
  static get instance(): Configs {
    if (!this.theInstance) {
      this.theInstance = new Configs();
    }
    return this.theInstance;
  }

  /**
   * Current environment info.
   */
  get environment() {
    return {
      displayText: this.theEnvironmentInstance
        ? `${this.theEnvironmentInstance}@${this.theEnvironment}`
        : this.theEnvironment,
      type: this.theEnvironment,
      instance: this.theEnvironmentInstance,
      isLab: this.theEnvironment === constants.Environments.LAB,
      isLocal: this.cache.get<boolean>('environment.isLocal'),
      isDev: this.theEnvironment === constants.Environments.DEV,
      isLocalOrDev:
        this.cache.get<boolean>('environment.isLocal') || this.theEnvironment === constants.Environments.DEV,
      isAcc: this.theEnvironment === constants.Environments.ACCEPTATION,
      isProd: this.theEnvironment === constants.Environments.PROD
    };
  }

  /**
   * Currently in testing mode?
   */
  get testingMode(): boolean {
    return process.env[constants.EnvVariables.NODE_APP_INSTANCE] === constants.AppInstances.TESTS;
  }

  /**
   * Various informations about the project itself.
   */
  get project() {
    return {
      /**
       * The repository of the project's sources.
       */
      repositoryUrl: this.cache.get<string>('project.repositoryUrl'),

      /**
       * A place to discuss this project (forum/chat/etc.)
       */
      discussionUrl: this.cache.get<string>('project.discussionUrl'),

      /**
       * Maintainers
       */
      maintainers: this.cache.get<IProjectMaintainers[]>('project.maintainers')
    };
  }

  /**
   * Logging related configurations.
   */
  get logging() {
    return {
      /**
       * Directoty to log to. Can be an absolute or relative
       * path.
       *
       * Use NULL or an empty string to disable.
       */
      dir: this.cache.get<string>('logging.dir', (rawVal: string): string => {
        // ==========================================
        // If the log directory starts with a ".", we
        // considere it to be relative to the root of the
        // project.
        // ==========================================

        if (rawVal.startsWith('.')) {
          return path.normalize(`${this.root}/${rawVal}`);
        }
        return rawVal;
      }),

      /**
       * Logging level. By default, the level is "info".
       */
      level: logLevelFromString(this.cache.get<string>('logging.level')),

      /**
       * Should an human readable format be used when logging
       * to the console?
       *
       * This is costy and is generally disabled in production.
       */
      humanReadableInConsole: this.cache.get<boolean>('logging.humanReadableInConsole'),

      /**
       * On a DEV environment, should the stack trace of an error be added
       * to its public message? This is true by default.
       *
       * This configuration only has an impact on a DEV environment.
       * On other environments, the stack trace is *never* added to the
       * error public message.
       */
      addStackTraceToErrorMessagesInDev: this.cache.get<boolean>('logging.addStackTraceToErrorMessagesInDev'),

      /**
       * Should the file and line number where the log occures
       * be logged?
       *
       * This is costy and is generally disabled in production.
       */
      logSource: this.cache.get<boolean>('logging.logSource'),

      /**
       * Should the logs be written to a file in addition
       * to the standard output?
       */
      logToFile: this.cache.get<boolean>('logging.logToFile'),

      /**
       * Log rotate : how many log files should exist? The rotation will be
       * done on those X number of files only.
       */
      logRotateFilesNbr: this.cache.get<number>('logging.logRotateFilesNbr'),

      /**
       * Log rotate : a file is going to be rotated when its size reaches
       * this number of megabytes.
       */
      logRotateThresholdMB: this.cache.get<number>('logging.logRotateThresholdMB'),

      /**
       * Log rotate : the maximum total number of megabytes for all the log files
       * combined.
       */
      logRotateMaxTotalSizeMB: this.cache.get<number>('logging.logRotateMaxTotalSizeMB')
    };
  }

  /**
   * The HTTP server
   */
  get server() {
    return {
      /**
       * The port to start the server on.
       */
      port: this.cache.get<number>('server.port'),

      /**
       * The port to start the server on when
       * only the Swagger editor is served.
       *
       * This port is different than the standard port
       * so both can run together.
       */
      swaggerEditorAlonePort: this.cache.get<number>('server.swaggerEditorAlonePort')
    };
  }

  /**
   * API informations
   */
  get api() {
    return {
      /**
       * The public scheme the API will be accessible from.
       * This is going to be used, for example, by Swagger UI.
       */
      scheme: this.cache.get<string>('api.scheme'),

      /**
       * The public host the API will be accessible from.
       * This is going to be used, for example, by Swagger UI.
       */
      host: this.cache.get<string>('api.host'),

      /**
       * The public port the API will be accessible from.
       * This is going to be used, for example, by Swagger UI.
       */
      port: this.cache.get<number>('api.port'),

      /**
       * The common path under which all routes of this API
       * are served. Represents the business domain for which the API
       * is created.
       *
       * The full path to an endpoint consists in a variable endpoint type root,
       * followed by this common domain path, followed by the relative path
       * specific to the endpoint.
       *
       * Always starts with a "/".
       */
      domainPath: this.cache.get<string>('api.domainPath', (rawVal: string): string => {
        let reVal = '/' + _.trim(rawVal, '/');
        if (reVal === '/') {
          reVal = '';
        }
        return reVal;
      })
    };
  }

  /**
   * Debug configurations
   */
  get debug() {
    return {
      /**
       * The port to listen to in debug mode.
       */
      port: this.cache.get<number>('debug.port'),

      /**
       * The host to listen to in debug mode.
       */
      host: this.cache.get<string>('debug.host'),

      /**
       * Configuration related to the "watch" gulp
       * task.
       */
      watch: {
        /**
         * Incremental compilation notifications
         */
        notifications: {
          /**
           * Should incremental notifications be enabled?
           */
          enabled: this.cache.get<boolean>('debug.watch.notifications.enabled'),

          /**
           * Should a sound be played when incremental
           * compilation is done?
           */
          sound: this.cache.get<boolean>('debug.watch.notifications.sound')
        }
      }
    };
  }

  /**
   * Routing info
   */
  get routing() {
    return {
      /**
       * Should the routing be case-sensitive?
       */
      caseSensitive: this.cache.get<boolean>('routing.caseSensitive'),

      /**
       * The maximum number of Mb a request
       * can have. Over that limit, an error is automatically
       * returned to the client.
       */
      maxRequestSizeMb: this.cache.get<number>('routing.maxRequestSizeMb', (rawVal: number): number => {
        let reVal: number = rawVal;

        if (!reVal || isNaN(reVal)) {
          reVal = 50;
        }

        return reVal;
      }),

      /**
       * Various endpoint specific *relative* paths. Those needs to be
       * prefixed with the endpoint type root and the domain path to
       * get a "full" path.
       */
      routes: {
        openAPI: {
          specsFile: this.cache.get<string>('routing.routes.openAPI.specsFile', (rawVal: string): string => {
            const reVal = rawVal;
            return _.trim(reVal, '/');
          }),

          ui: this.cache.get<string>('routing.routes.openAPI.ui', (rawVal: string): string => {
            const reVal = rawVal;
            return _.trim(reVal, '/');
          }),

          editor: this.cache.get<string>('routing.routes.openAPI.editor', (rawVal: string): string => {
            const reVal = rawVal;
            return _.trim(reVal, '/');
          })
        },

        diagnostics: {
          ping: this.cache.get<string>('routing.routes.diagnostics.ping'),
          info: this.cache.get<string>('routing.routes.diagnostics.info'),
          metrics: this.cache.get<string>('routing.routes.diagnostics.metrics'),
          healthCheck: this.cache.get<string>('routing.routes.diagnostics.healthCheck'),
          healthReport: this.cache.get<string>('routing.routes.diagnostics.healthReport')
        },
        rootDiagnostics: {
          ping: this.cache.get<string>('routing.routes.rootDiagnostics.ping'),
          info: this.cache.get<string>('routing.routes.rootDiagnostics.info'),
          metrics: this.cache.get<string>('routing.routes.rootDiagnostics.metrics')
        }
      }
    };
  }

  /**
   * Open API info
   */
  get openApi() {
    return {
      exposeSwaggerEditor:
        this.cache.get<boolean>('openApi.exposeSwaggerEditor') && this.theEnvironment !== constants.Environments.PROD
    };
  }

  /**
   * Templating Engine
   */
  get templatingEngine() {
    return {
      /**
       * Should cache be used for the generated templates?
       * It is convenient to disable this in development, so
       * templates files can be modified and tested without
       * restarting the application.
       */
      enableCache: this.cache.get<boolean>('templatingEngine.enableCache')
    };
  }

  /**
   * Mongo/Mongoose configuration
   */
  get mongo() {
    return {
      /**
       * Connection string for the connection to mongo database.
       * IF not specified, or if set to "mock", then a mocked
       * Mongo server will be automatically downloaded and used.
       *
       * @see http://mongoosejs.com/docs/connections.html
       */
      connectionString: this.cache.get<string>('mongo.connectionString', (rawVal: string): string => {
        if (rawVal === 'mock' && this.theEnvironment !== constants.Environments.DEV) {
          throw new Error(`The Mongo "mocked" connectionString can only be used on a "development" environment!`);
        }
        return rawVal;
      }),

      /**
       * Options for the mongodb and mongoose method to create the connexion.
       * For example, we can define the WriteConcern options in 'db' key.
       * @see http://mongoosejs.com/docs/connections.html#options
       */
      connectionOptions: this.cache.get<any>('mongo.connectionOptions', (rawVal: any): any => {
        return rawVal || {};
      }),

      /**
       * MongoUpdater configurations
       */
      updater: {
        /**
         * The number maximum of seconds that the lock of a
         * MongoUpdater can live for. This prevents a lock
         * to stay forever if an app crashes with the lock on.
         */
        lockMaxAgeSeconds: this.cache.get<number>('mongo.updater.lockMaxAgeSeconds'),

        /**
         * The path (relative to the root!) where to find the
         * update files.
         */
        mongoSchemaUpdatesDirPath: this.cache.get<string>('mongo.updater.mongoSchemaUpdatesDirPath')
      },

      /**
       * mockServer configurations
       */
      mockServer: {
        /**
         * The version of the Mongo test server to be
         * used by mockServer.
         */
        serverVersion: this.cache.get<string>('mongo.mockServer.serverVersion')
      }
    };
  }

  /**
   * GLUU Information
   */
  get gluu() {
    return {
      mock: this.cache.get<boolean>('gluu.mock'),
      urlToken: this.cache.get<string>('gluu.urlToken'),
      serviceAccount: {
        username: this.cache.get<string>('gluu.serviceAccount.username'),
        password: this.cache.get<string>('gluu.serviceAccount.password'),
        scope: this.cache.get<string>('gluu.serviceAccount.scope')
      },
      openIdClient: {
        username: this.cache.get<string>('gluu.openIdClient.username'),
        password: this.cache.get<string>('gluu.openIdClient.password')
      }
    };
  }

  /**
   * Data sources info
   */
  get dataSources() {
    return {};
  }

  /**
   * Security configurations
   */
  get security() {
    return {
      cors: {
        whitelist: this.cache.get<string>('security.cors.whitelist')
      },
      /**
       * Json Web Token validation
       */
      jwt: {
        enable: this.cache.get<boolean>('security.jwt.enable'),
        host: this.cache.get<string>('security.jwt.host'),
        endPoints: {
          publicKey: this.cache.get<string>('security.jwt.endPoints.publicKey'),
          tokenTranslator: {
            url: this.cache.get<string>('security.jwt.endPoints.tokenTranslator.url'),
            enable: this.cache.get<boolean>('security.jwt.endPoints.tokenTranslator.enable'),
            mock: this.cache.get<boolean>('security.jwt.endPoints.tokenTranslator.mock'),
            mockRole: this.cache.get<string>('security.jwt.endPoints.tokenTranslator.mockRole')
          }
        },
        whitelist: {
          ALL: this.cache.get<string[]>('security.jwt.whitelist.ALL'),
          GET: this.cache.get<string[]>('security.jwt.whitelist.GET'),
          PUT: this.cache.get<string[]>('security.jwt.whitelist.PUT'),
          DELETE: this.cache.get<string[]>('security.jwt.whitelist.DELETE'),
          POST: this.cache.get<string[]>('security.jwt.whitelist.POST')
        }
      }
    };
  }

  /**
   *  Wfs service informations
   */
  get spatialAnalysis() {
    return {
      spatial: {
        url: this.cache.get<boolean>('spatialAnalysis.spatial.url')
      },
      wfs: {
        url: this.cache.get<string>('spatialAnalysis.wfs.url'),
        dWithinMeterTolerance: this.cache.get<string>('spatialAnalysis.wfs.dWithinMeterTolerance'),
        baseCoordinatesSrs: this.cache.get<string>('spatialAnalysis.wfs.baseCoordinatesSrs')
      },
      caching: {
        duration: this.cache.get<number>('spatialAnalysis.caching.duration')
      }
    };
  }

  /** GDA Gestion Des Accès */
  get gda() {
    return {
      mock: this.cache.get<boolean>('gda.mock'),
      provision: this.cache.get<boolean>('gda.provision'),
      urls: {
        base: this.cache.get<string>('gda.urls.base'),
        provision: this.cache.get<string>('gda.urls.base') + this.cache.get<string>('gda.urls.provision'),
        privileges: this.cache.get<string>('gda.urls.base') + this.cache.get<string>('gda.urls.privileges')
      }
    };
  }

  /** Storage API */
  get storageObject() {
    return {
      mock: this.cache.get<boolean>('storageObject.mock'),
      gateway: this.cache.get<string>('storageObject.gateway'),
      volumeId: this.cache.get<string>('storageObject.volumeId'),
      ttl: this.cache.get<number>('storageObject.ttl'),
      maxByteWeight: this.cache.get<number>('storageObject.maxByteWeight')
    };
  }

  get configurationInfo() {
    const configSources = config.util.getConfigSources();
    const loadedFiles: string[] = [];
    for (const source of configSources) {
      loadedFiles.push(source.name);
    }
    return {
      /**
       * The names of the configuration files that were
       * loaded by the "node-config" library. They are
       * listed in the order they have been loaded.
       */
      loadedFiles
    };
  }

  get tls() {
    return {
      reject: this.cache.get<boolean>('tls.reject')
    };
  }

  get rules() {
    return {
      opportunityNotice: {
        outdatedInDays: this.cache.get<number>('rules.opportunityNotice.outdatedInDays')
      }
    };
  }

  /** RTU Import */
  get rtuImport() {
    return {
      serviceAccount: {
        username: this.cache.get<string>('rtuImport.serviceAccount.username'),
        password: this.cache.get<string>('rtuImport.serviceAccount.password'),
        scope: this.cache.get<string>('rtuImport.serviceAccount.scope')
      },
      projectsConfig: {
        paging: {
          partnerIds: this.cache.get<number>('rtuImport.projectsConfig.paging.partnerIds')
        },
        timeout: {
          response: this.cache.get<number>('rtuImport.projectsConfig.timeout.response'),
          deadline: this.cache.get<number>('rtuImport.projectsConfig.timeout.deadline')
        },
        sessionRetryMax: this.cache.get<number>('rtuImport.projectsConfig.sessionRetryMax')
      },
      urls: {
        base: this.cache.get<string>('rtuImport.urls.base'),
        session: this.cache.get<string>('rtuImport.urls.base') + this.cache.get<string>('rtuImport.urls.session'),
        filter: this.cache.get<string>('rtuImport.urls.base') + this.cache.get<string>('rtuImport.urls.filter'),
        projects: this.cache.get<string>('rtuImport.urls.base') + this.cache.get<string>('rtuImport.urls.projects')
      },
      certificate: {
        enabled: this.cache.get<boolean>('rtuImport.certificate.enabled'),
        fileName: this.cache.get<string>('rtuImport.certificate.fileName')
      }
    };
  }

  /** RTU Export */
  get rtuExport() {
    return {
      exportValues: {
        contactId: this.cache.get<string>('rtuExport.exportValues.contactId'),
        organizationId: this.cache.get<string>('rtuExport.exportValues.organizationId'),
        typeValue: this.cache.get<string>('rtuExport.exportValues.typeValue'),
        typeDefinition: this.cache.get<string>('rtuExport.exportValues.typeDefinition'),
        sessionRetryMax: this.cache.get<number>('rtuExport.exportValues.sessionRetryMax')
      },
      paging: {
        size: this.cache.get<number>('rtuExport.paging.size')
      },
      urls: {
        base: this.cache.get<string>('rtuExport.urls.base'),
        projects: this.cache.get<string>('rtuExport.urls.base') + this.cache.get<string>('rtuExport.urls.projects'),
        contacts: this.cache.get<string>('rtuExport.urls.base') + this.cache.get<string>('rtuExport.urls.contacts')
      }
    };
  }

  /** NEXO Import */
  get nexoImport() {
    return {
      dbChunkSize: this.cache.get<number>('nexoImport.dbChunkSize'),
      assets: {
        limit: this.cache.get<number>('nexoImport.assets.limit')
      }
    };
  }

  get extraction() {
    return {
      chunkSize: this.cache.get<number>('extraction.chunkSize')
    };
  }
}

export let configs: Configs = Configs.instance;
