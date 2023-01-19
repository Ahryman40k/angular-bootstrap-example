// ==========================================
// This file is only a bootstrapper
// allowing Gulp tasks to be written using
// TypeScript. The tasks are in fact defined in
// "gulpcore.ts".
//
// Only one task is defined here, using javascript :
// "compile". This is the task that compiles (transpiles)
// "gulpcore.ts" and allows the tasks to be defined
// there.
// ==========================================
"use strict";

let gulp = require("gulp");
let execSync = require("child_process").execSync;
let argv = require("yargs").argv;
let fs = require("fs-extra");
let path = require("path");

let root = path.normalize(__dirname);

let postCompileTask = async function () {
    if (!argv.nc) {
        console.log("Compilation done.");
    }
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

    fs.removeSync(`${root}/dist`);

    execSync(`"${root}/node_modules/.bin/tsc"`, { stdio: [0, 1, 2] });

    let firstTaskIsCompile = (process.argv.length > 2) && (compileTaskAliases.indexOf(process.argv[2]) > -1);
    if (!firstTaskIsCompile) {
        postCompileTask();
    }

} else {
    console.log("Compilation skipped because of the '--nc' parameter...");
}

require("./dist/gulpcore.js");
