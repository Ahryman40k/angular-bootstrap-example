// ==========================================
// Starts the application!
// tslint:disable:no-floating-promises
// tslint:disable:no-console
// tslint:disable:comment-format
// ==========================================
import { startServer } from './core/server';

(async () => {
  try {
    await startServer();
  } catch (err) {
    console.error(`Error starting the application :`, err); //NOSONAR
    process.exit(-1);
  }
})();
