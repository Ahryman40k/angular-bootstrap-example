// ==========================================
// Gulp *prod* tasks
//
// Those tasks are the only ones that are going
// to be available when running in production
// when the "npm run start-no-dev-deps" script
// is used!
//
// This file will be transpiled and included
// by the standard Gulp file "gulpfile.js".
//
// Console output is OK in Gulp tasks!
// tslint:disable:no-console
// ==========================================
import * as gulp from 'gulp';
import { configs } from './config/configs';
import { registerUncaughtExceptionHandler, registerUnhandledRejectionHandler } from './src/core/errorManagement';
import { startServer } from './src/core/server';

// ==========================================
// Registers a unhandled promises rejections
// handler
// ==========================================
registerUnhandledRejectionHandler();

// ==========================================
// Registers a uncaught exceptions handler
// ==========================================
registerUncaughtExceptionHandler();

// ==========================================
// Default task
// ==========================================
gulp.task('default', () => {
  console.info(`Default Gulp task. Current env : ${configs.environment.type}`);
  return Promise.resolve(true);
});

// ==========================================
// Launches the application
// ==========================================
gulp.task('start', async () => {
  await startServer();
});
// ==========================================
// Exits the application
//
// This is useful to launch a Gulp task and ends
// the process, for example for a "F5" in VSCode.
// ==========================================
gulp.task('exit', () => {
  process.exit(0);
});
