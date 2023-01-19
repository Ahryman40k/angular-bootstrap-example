import { ILogger, Logger, LoggerConfigs } from '@villemontreal/core-utils-logger-nodejs-lib';
export { ILogger, LogLevel } from '@villemontreal/core-utils-logger-nodejs-lib';
import { correlationIdService } from '@villemontreal/core-correlation-id-nodejs-lib';
import { configs } from '../../config/configs';

/**
 * Creates a logger configured for our needs.
 */
export function createLogger(name: string): ILogger {
  // ==========================================
  // Uses the local correlationIdService as the
  // Correlation Ids provider...
  // ==========================================
  const loggerConfig: LoggerConfigs = new LoggerConfigs(() => correlationIdService.getId());

  loggerConfig.setLogDirectory(configs.logging.dir);
  loggerConfig.setLogLevel(configs.logging.level);
  loggerConfig.setSlowerLogToFileToo(configs.logging.logToFile);
  loggerConfig.setLogHumanReadableinConsole(configs.logging.humanReadableInConsole);
  loggerConfig.setAddStackTraceToErrorMessagesInDev(configs.logging.addStackTraceToErrorMessagesInDev);
  loggerConfig.setLogSource(configs.logging.logSource);
  loggerConfig.setLogRotateFilesNbr(configs.logging.logRotateFilesNbr);
  loggerConfig.setLogRotateThresholdMB(configs.logging.logRotateThresholdMB);
  loggerConfig.setLogRotateMaxTotalSizeMB(configs.logging.logRotateMaxTotalSizeMB);

  return new Logger(name, loggerConfig);
}
