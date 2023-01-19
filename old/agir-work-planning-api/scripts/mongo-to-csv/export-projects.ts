import { MongoClient } from 'mongodb';
import {
  connnectToDB,
  executeFindQueryProjection,
  getFrenchLabel,
  getTaxonomiesGroups,
  objectListToCSV,
  uri
} from './export-data-helper';
// tslint:disable: no-console
// tslint:disable: await-promise

async function queryDatabaseForExport(client: MongoClient) {
  const query = {
    executorId: 'di',
    status: { $nin: ['canceled'] },
    startYear: { $lte: 2024 },
    endYear: { $gte: 2023 }
  };

  const options = {
    projection: {
      _id: 1,
      boroughId: 1,
      startYear: 1,
      endYear: 1,
      executorId: 1,
      'globalBudget.allowance': 1,
      inChargeId: 1,
      projectName: 1,
      projectTypeId: 1,
      status: 1,
      medalId: 1,
      roadNetworkTypeId: 1,
      streetName: 1,
      streetFrom: 1,
      streetTo: 1,
      riskId: 1,
      'externalReferenceIds.value': 1,
      interventionIds: 1,
      drmNumber: 1,
      submissionNumber: 1
    }
  };

  return await executeFindQueryProjection(client, 'projects', query, options);
}

async function main() {
  const client = await connnectToDB(uri);
  const taxonomies = await getTaxonomiesGroups(client, [
    'executor',
    'requestor',
    'borough',
    'medalType',
    'roadNetworkType',
    'projectType',
    'projectStatus',
    'riskType'
  ]);

  const results = await queryDatabaseForExport(client);
  const mappedResult = [];

  for (const project of results) {
    const line = {
      ID: project._id,
      Libellé: project.projectName,
      'Année de début': project.startYear,
      'Année de fin': project.endYear,
      Statut: getFrenchLabel('projectStatus', project.status, taxonomies),
      Type: getFrenchLabel('projectType', project.projectTypeId, taxonomies),
      'Budget (k$)': project.globalBudget ? project.globalBudget.allowance : '',
      'Requérant initiale': project.inChargeId ? getFrenchLabel('requestor', project.inChargeId, taxonomies) : '',
      Exécutant: getFrenchLabel('executor', project.executorId, taxonomies),
      "Médaille d'aménagement": project.medalId ? getFrenchLabel('medalType', project.medalId, taxonomies) : '',
      Arrondissement: getFrenchLabel('borough', project.boroughId, taxonomies),
      Voie: project.streetName ? project.streetName : '',
      'Voie de': project.streetFrom ? project.streetFrom : '',
      'Voie à': project.streetTo ? project.streetTo : '',
      'Type de réseau': project.roadNetworkTypeId
        ? getFrenchLabel('roadNetworkType', project.roadNetworkTypeId, taxonomies)
        : '',
      Risque: project.riskId ? getFrenchLabel('riskType', project.riskId, taxonomies) : '',
      DRM: project.drmNumber,
      'Numéro de soumission': project.submissionNumber,
      'IDs des interventions': project.interventionIds ? project.interventionIds : '',
      'ID externe': project.externalReferenceIds ? project.externalReferenceIds[0]?.value : ''
    };
    mappedResult.push(line);
  }
  console.log(objectListToCSV(mappedResult));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    console.log('Erreur', e);
    process.exit(1);
  });
