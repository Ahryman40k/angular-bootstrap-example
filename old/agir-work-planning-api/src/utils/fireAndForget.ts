import { createLogger, LogLevel } from './logger';

const logger = createLogger('fireAndForget');

export function fireAndForget(action: () => Promise<any>) {
  action().catch(ex => logger.log(LogLevel.ERROR, ex, 'An unexpected error occured in a fire and forget context'));
}
