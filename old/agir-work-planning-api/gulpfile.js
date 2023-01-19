// ==========================================
// This file is only a bootstrapper
// allowing Gulp tasks to be written using
// TypeScript. The tasks are in fact defined in
// "gulpcore.ts".
//
// Only one Gulp task is defined here, using javascript :
// "compile". This is the task that compiles (transpiles)
// "gulpcore.ts" and allows the tasks to be defined
// there.
// ==========================================
"use strict";

// ==========================================
// Docker local debugging.
// This is simply an indirection that calls the
// "./.docker/docker-local-debug.js" script, as
// if "npm run docker" was called. Useful for those
// who installed Gulp globally and want to save some
// keystrokes by using "gulp docker"...
//
// Note : in this "if" we don't have access to any
// dependencies from package.json : "npm install" may
// not have been run...
// ==========================================
if (process.argv[2] === "docker") {
    process.argv.shift(); // standardizes args as if "npm run docker" was called.
    require("./.docker/docker-local-debug.js");
    process.exit(0);
}

// ==========================================
// Regular tasks...
// ==========================================

let gulp = require("gulp");
let execSync = require("child_process").execSync;
let exec = require("child_process").exec;
let argv = require("yargs").argv;
let fs = require("fs-extra");

// ==========================================
// If the name of at least one Gulp task to run 
// starts with "test-", we set the 
// "NODE_APP_INSTANCE" environment variable to 
// "tests" so the "local-tests.yaml" configuration 
// file is used when running those tasks!
// ==========================================
if (process.argv.length > 2) {
    for (let i = 2; i < process.argv.length; i++) {
        const task = process.argv[i];
        if (task === 'test' || task.startsWith('test-')) {
            process.env['NODE_APP_INSTANCE'] = 'tests';
            break;
        }
    }
}

let postCompileTask = function () {
    if (!argv.nc) {
        console.log("Compilation done.");
    }
    return Promise.resolve(true);
};

let compileTaskAliases = ["c", "compile", "compilation"];

compileTaskAliases.forEach((alias) => {
    gulp.task(alias, postCompileTask);
});

// ==========================================
// Compilation...
//
// The "--nc" ("No Compilation") parameter
// skips the compilation.
// ==========================================
if (!argv.nc) {
    console.log("Compilation...");
    execSync("node ./node_modules/typescript/lib/tsc.js", { stdio: [0, 1, 2] });

    let firstTaskIsCompile = (process.argv.length > 2) && (compileTaskAliases.indexOf(process.argv[2]) > -1);
    if (!firstTaskIsCompile) {
        postCompileTask();
    }
} else {
    console.log("Compilation skipped because of the '--nc' parameter...");
}

// ==========================================
// Now that the compilation is done, we
// can use the tasks defined in "gulpcore.js"...
// ==========================================
require("./gulpcore.js");

// ==========================================
// If we are running with the dev dependencies,
// the dev tasks are available!
// ==========================================
if (!argv.nodevdeps) {
    console.log("Including the Gulp dev tasks...");
    require("./gulpcore.dev.js");
} else {
    console.log("The '--nodevdeps' parameter was used so no Gulp dev tasks will be available!");
}
