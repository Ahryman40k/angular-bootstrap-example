# AgirWorkPlanningWeb

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.5

## NODE VERSION

Use a node version between 8.15 and 10

## Install dependencies

Run `npm install` to install dependencies _(can do it only once)_

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Run from Docker

Run `docker build --tag agir-work-planning-web .` from the project folder to build the Docker image. _(can do it only once)_
Run `docker run -p 4200:4200/tcp agir-work-planning-web:latest` to run the image. Navigate to `http://localhost:4200/agir-work-planning-web/` to view the app.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Running mock server for development

Run `npm run start:mock-server` to start a mock server. The data is in `server-mock/json-server.json`.

## Liaison du projet AGIR Work Planning Lib pour le développement

Avant de faire la liaison de la lib, assurez-vous de suivre les instructions _Link_ du README dans _agir-work-planning-lib_.
Exécutez `npm run link-lib` pour lier votre paquet _agir-work-planning-lib_ local.
Exécutez `npm run unlink-lib` pour dissocier le paquet _agir-work-planning-lib_ local et réinstaller le paquet publié.

# Lancer Sonarqube en local

Télécharger Sonarqube en local, puis le mettre dans le /c

\$ /c/sonar-scanner/bin/sonar-scanner.bat -Dsonar.branch.name=`git branch | grep \* | cut -d ' ' -f2`
