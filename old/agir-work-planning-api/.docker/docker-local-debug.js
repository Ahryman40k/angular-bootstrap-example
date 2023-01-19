// ==========================================
// Local debugging in Docker
//
// To be launched using "npm run docker" or
// "gulp docker".
// ==========================================
let execSync = require("child_process").execSync;
let fs = require("fs");
let path = require("path");

let args = process.argv.slice(2);

const ROOT = path.normalize(__dirname + "/..");
const DOCKER_DEBUG_IMAGE_NAME = "docker-local-debug";
const DOCKER_DEBUG_CONTAINER_NAME = "docker-local-debug-container";
const DOCKERFILE_PATH = `${ROOT}/.docker/Dockerfile.local.debug`;
const DOCKER_CONTAINER_RUN_PORT = 12345;
const DOCKER_CONTAINER_DEBUG_PORT = 5858;
const dockerTaskArg = args[0];

// ==========================================
// If the container is already running,
// we simply exit, so the same VSCode's task
// can be used to re-attach ther debugger
// when the application inside the container
// is restarted...
// ==========================================
if (dockerTaskArg !== "build") {
    let output = execSync(`docker ps --filter name=${DOCKER_DEBUG_CONTAINER_NAME}`);
    if (output && output.toString().indexOf(DOCKER_DEBUG_CONTAINER_NAME) >= 0) {

        // ==========================================
        // Remove the existing container?
        // ==========================================
        if (dockerTaskArg === "rm") {
            execSync(`docker rm -f ${DOCKER_DEBUG_CONTAINER_NAME}`);
            console.log(`Docker container "${DOCKER_DEBUG_CONTAINER_NAME}" removed.`);
        } else {
            console.log(`The container "${DOCKER_DEBUG_CONTAINER_NAME}" is already running.`);
        }

        process.exit(0);
    }
}

if (dockerTaskArg === "rm") {
    console.log(`The Docker container "${DOCKER_DEBUG_CONTAINER_NAME}"doesn't exist!`);
    process.exit(0);
}

let buildImage = true;
if (dockerTaskArg !== "build") {
    let output = execSync(`docker images ${DOCKER_DEBUG_IMAGE_NAME}`);
    if (output && output.toString().indexOf(DOCKER_DEBUG_IMAGE_NAME) >= 0) {
        buildImage = false;
        console.log(`The "${DOCKER_DEBUG_IMAGE_NAME}" Docker image already exists.`);
    }
}

if (buildImage) {
    console.log(`Building the "${DOCKER_DEBUG_IMAGE_NAME}" Docker image...`);

    // ==========================================
    // "docker build" doesn't work with a file
    // inside ".docker" because this directory is
    // ignored in ".dockerignore"!
    // ==========================================
    console.log(`Copying the Dockerfile to a temp file...`);
    let dockerfileFinalPath = `${ROOT}/Dockerfile.local.debug`;
    copyFileSync(DOCKERFILE_PATH, dockerfileFinalPath);
    try {
        let cmd = `docker build -f ${dockerfileFinalPath} -t ${DOCKER_DEBUG_IMAGE_NAME} ${ROOT}`;
        console.log(`Running: ${cmd}`);
        execSync(cmd, { stdio: [0, 1, 2] });
        console.log(`Docker image "${DOCKER_DEBUG_IMAGE_NAME}" created!`);
    } finally {
        try {
            fs.unlinkSync(dockerfileFinalPath);
        } catch (err) {
            // too bad
        }
    }
}

if (dockerTaskArg === "build") {
    process.exit(0);
}

let cmd = `docker run --rm --name ${DOCKER_DEBUG_CONTAINER_NAME} -p ${DOCKER_CONTAINER_RUN_PORT}:${DOCKER_CONTAINER_RUN_PORT} -p ${DOCKER_CONTAINER_DEBUG_PORT}:${DOCKER_CONTAINER_DEBUG_PORT} -ti -v ${ROOT}:/mtl/app ${DOCKER_DEBUG_IMAGE_NAME}`;

// Bash only?
if (dockerTaskArg === "bash") {
    cmd += ` /bin/bash`;
}

console.log(`Launching a Docker container...`);
console.log(`Running: ${cmd}`);
execSync(cmd, { stdio: [0, 1, 2] });
process.exit(0);

function copyFileSync(srcFile, destFile) {
    BUF_LENGTH = 64 * 1024;
    buff = new Buffer(BUF_LENGTH);
    fdr = fs.openSync(srcFile, 'r');
    fdw = fs.openSync(destFile, 'w');
    bytesRead = 1;
    pos = 0;
    while (bytesRead > 0) {
        bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
        fs.writeSync(fdw, buff, 0, bytesRead);
        pos += bytesRead;
    }
    fs.closeSync(fdr);
    fs.closeSync(fdw);
}
