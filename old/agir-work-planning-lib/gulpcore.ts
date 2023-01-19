import {
  prettierCheck,
  prettierFix,
  ProjectType,
  tslintCheck,
  tslintFix
} from '@villemontreal/lint-config-villemontreal';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as path from 'path';

// ==========================================
// Gulp tasks
//
// This file will be transpiled and included
// by the standard Gulp file "gulpfile.js".
//
// Console output is OK in Gulp tasks!
/* tslint:disable:no-console */
// ==========================================
const taskCallBack = require('gulp4-run-sequence').use(gulp);
const execSyncBase = require('child_process').execSync;
// From the "dist/src/config" folder
const libRoot = path.normalize(__dirname + '/..');

// ==========================================
// Manages unhandled promises rejections
// ==========================================
process.on('unhandledRejection', (reason: any, p: any) => {
  console.log('Promise rejection error : ' + reason);
});

// ==========================================
// Manages uncaught exceptions.
//
// If you are thinking about modifying this function,
// make sure you read :
// https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
// ==========================================
process.on('uncaughtException', (err: any) => {
  try {
    console.log('An uncaught exception occured : ' + err);
  } finally {
    process.exit(1);
  }
});

/**
 * Executes a command synchronously with
 * the current input/output.
 */
function execSync(cmd: string) {
  return execSyncBase(cmd, { stdio: [0, 1, 2] });
}

/**
 * Runs a task and return a Promise.
 */
async function taskPromisified(task: string) {
  if (!task) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    taskCallBack(task, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Runs a sequence of task and return a Promise.
 */
async function sequence(...tasks: string[]) {
  if (!tasks) {
    return;
  }

  for (const task of tasks) {
    await taskPromisified(task);
  }
}

// ==========================================
// Default task
// ==========================================
gulp.task('default', async () => {
  await sequence('test');
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

// ==========================================
// Runs the tests and output a report for
// Jenkins.
// The path to the report to generate can be
// passed :
// - as a command line param :
//   "npm run test-jenkins -- --report=output/test-results/report.xml"
// - as an "JUNIT_REPORT_PATH" environment variable.
// By default, the path will be "output/test-results/report.xml"
// ==========================================
gulp.task('test-jenkins', async () => {
  const argv = require('yargs').argv;

  if (argv.report) {
    process.env.JUNIT_REPORT_PATH = argv.report;
  } else if (!process.env.JUNIT_REPORT_PATH) {
    process.env.JUNIT_REPORT_PATH = 'output/test-results/report.xml';
  }

  await sequence('test');
});

// ==========================================
// Tests - all
// ==========================================
gulp.task('test', async () => {
  await sequence('lint', 'test-units');

  console.log(`\n==========================================`);
  console.log(`All tests and validations passed!`);
  console.log(`==========================================\n`);
});

// ==========================================
// Tests - units and integration
//
// Will find all files ending in ".test.js" under the
// "src" folder.
// ==========================================
gulp.task('test-units', async () => {
  // ==========================================
  // Set the "app instance" env var to be "tests"
  // so the the "XXXX-tests.yaml"
  // config files are used.
  // ==========================================
  process.env.NODE_APP_INSTANCE = 'tests';

  const args = [
    `node`,
    // `${libRoot}/node_modules/nyc/bin/nyc`,
    `${libRoot}/node_modules/mocha/bin/_mocha`,
    `${libRoot}/dist/src/**/*.test.js`,
    // `${libRoot}/dist/tests/**/*.test.js`,
    `--exit`
  ];

  if (process.env.JUNIT_REPORT_PATH) {
    console.info('Exporting tests to junit file ', process.env.JUNIT_REPORT_PATH);
    args.push('--reporter');
    args.push('mocha-jenkins-reporter');
  }

  try {
    execSync(args.join(' '));
    console.info('All unit/Integration tests done.');
  } catch (err) {
    console.error(`Some unit/integration tests failed : ${err}`);
    process.exit(1);
  }
});

// ==========================================
// Lint check
// ==========================================
gulp.task('lint', async () => {
  await sequence('prettier', 'tslint');
});

// ==========================================
// Lint fix
// ==========================================
gulp.task('lint-fix', async () => {
  await sequence('prettier-fix', 'tslint-fix');
});

// ==========================================
// Prettier check
// ==========================================
gulp.task('prettier', async () => {
  try {
    await prettierCheck(libRoot);
    console.info('Prettier check succesful!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

// ==========================================
// Prettier fix
// ==========================================
gulp.task('prettier-fix', async () => {
  try {
    await prettierFix(libRoot);
    console.info('Prettier fix succesful!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

// ==========================================
// TSLint check
// ==========================================
gulp.task('tslint', async () => {
  try {
    await tslintCheck(libRoot, ProjectType.NODE);
    console.info('TSLint check succesful!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

// ==========================================
// TSLint fix
// ==========================================
gulp.task('tslint-fix', runTslintFix);

async function runTslintFix() {
  try {
    await tslintFix(libRoot, ProjectType.NODE);
    console.info('TSLint fix succesful!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// ==========================================
// release
// ==========================================
// You can pass the type of increment as a command-line parameter :
//   npm run release -- --release-type=minor
//   Note that by default, it will use "patch"
// You can specify the source branch (it is develop by default):
//   npm run release -- --source-branch=other
// You can specify the destination branch (it is master by default):
//   npm run release -- --destination-branch=release/5.x.x

gulp.task('release', async () => {
  try {
    const argv = require('yargs').argv;
    const releaseType = argv['release-type'] || 'minor';
    const srcBranch = argv['source-branch'] || 'develop';
    const destBranch = argv['destination-branch'] || 'master';

    execSync(`git checkout ${srcBranch}`);
    execSync(`git pull`);

    console.info('---------------------------------------------------------------------');
    execSync(`git checkout -B ${destBranch}`);
    execSync(`git pull`);
    execSync(`git merge --ff-only ${srcBranch}`);
    let version = readPackageVersion();
    execSync(`git tag -a "${version}" -m "Tag version to ${version}"`);
    execSync(`git push origin "${version}"`);
    execSync(`git push origin ${destBranch}`);

    console.info('---------------------------------------------------------------------');
    execSync(`git checkout ${srcBranch}`);
    execSync(`npm version ${releaseType} --git-tag-version=false`);
    version = readPackageVersion();
    execSync(`git commit -am "Bump version to ${version}"`);
    execSync(`git push origin ${srcBranch}`);

    console.info('---------------------------------------------------------------------');
    console.info(`Released ${srcBranch} --> ${destBranch}`);
    console.info(`Bumped ${srcBranch} to version ${version}`);
    console.info('Jenkins will build the branch and publish the package to the registry');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

function readPackageVersion() {
  const text = fs.readFileSync('./package.json');
  const json = JSON.parse(text.toString());
  return json.version;
}

// ==========================================
// Pre-publish
// ==========================================
gulp.task('prepublish', async () => {
  if (process.env.BUILD_URL) {
    console.log(
      'Disabled unit tests before publish because we are running inside Jenkins which should have checked it first.'
    );
  } else {
    await sequence('test');
  }
});

/**
 * Creates the link of the library.
 */
gulp.task('link-create', async () => {
  await sequence('link-update');
  execSync('npm link ./package');
});

/**
 * Updates the linked sources of the library.
 */
gulp.task('link-update', async () => {
  execSync('rm -rf package');
  execSync('npm pack');

  const packageJson = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf8' }));
  const tarFileName = `villemontreal-agir-work-planning-lib-${packageJson.version}.tgz`;
  execSync(`tar xzf ${tarFileName}`);
  execSync(`rm ${tarFileName}`);
});
