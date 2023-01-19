import * as yargs from 'yargs';
import { configs } from '../../config/configs';
import { initDatabase } from '../../src/features/database/DB';
import { appUtils } from '../../src/utils/utils';
import { insertBaseInterventions } from './loaders/loaderIntervention';
// ==========================================
// Starts the application!
// tslint:disable:no-floating-promises
// tslint:disable:no-console
// ==========================================

(async () => {
  try {
    await initDatabase(configs.environment.isLocal);

    const msg =
      // tslint:disable-next-line:prefer-template
      `\n==========================================\n` +
      `NODE_ENV environment variable : ${process.env.NODE_ENV ? process.env.NODE_ENV : 'undefined'}\n` +
      `Instance : ${configs.environment.instance}\n` +
      `Environment : ${configs.environment.type}\n` +
      `Is local? : ${configs.environment.isLocal ? 'true' : 'false'}\n` +
      `==========================================\n\n`;
    // tslint:disable-next-line:no-console
    console.info(msg);
    const numberInt = yargs.argv.interv ? appUtils.parseInt(yargs.argv.interv as string) : 0;
    // tslint:disable-next-line:no-console
    console.info('Starting insert interventions argv number=', numberInt);
    await insertBaseInterventions(numberInt);

    process.exit(0);
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.error(`Error starting the script load_data : ${err}`);
    process.exit(-1);
  }
})();
