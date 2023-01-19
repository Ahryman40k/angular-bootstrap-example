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
    planificationYear: { $in: [2023, 2024] },
    status: { $nin: ['refused', 'canceled'] }
  };

  const options = {
    projection: {
      _id: 1,
      executorId: 1,
      interventionName: 1,
      interventionTypeId: 1,
      workTypeId: 1,
      requestorId: 1,
      boroughId: 1,
      status: 1,
      interventionYear: 1,
      planificationYear: 1,
      programId: 1,
      contact: 1,
      'assets.typeId': 1,
      'estimate.allowance': 1,
      streetName: 1,
      streetFrom: 1,
      streetTo: 1,
      medalId: 1,
      roadNetworkTypeId: 1,
      'externalReferenceIds.value': 1,
      'project.id': 1,
      'assets.length.value': 1
    }
  };

  return await executeFindQueryProjection(client, 'interventions', query, options);
}

async function main() {
  const client = await connnectToDB(uri);
  const taxonomies = await getTaxonomiesGroups(client, [
    'executor',
    'interventionType',
    'interventionStatus',
    'workType',
    'requestor',
    'borough',
    'programType',
    'assetType',
    'medalType',
    'roadNetworkType'
  ]);

  const results = await queryDatabaseForExport(client);
  const mappedResult = [];

  for (const intervention of results) {
    let interventionLength: number = 0;
    intervention.assets.forEach((asset: { length: { value: number } }) => {
      if (asset && asset.length) {
        interventionLength += asset?.length?.value;
      }
    });

    const line = {
      ID: intervention._id,
      Libellé: intervention.interventionName,
      'Année initiale souhaitée': intervention.interventionYear,
      'Année planifiée': intervention.planificationYear,
      Statut: getFrenchLabel('interventionStatus', intervention.status, taxonomies),
      Type: getFrenchLabel('interventionType', intervention.interventionTypeId, taxonomies),
      'Nature des travaux': getFrenchLabel('workType', intervention.workTypeId, taxonomies),
      Programme: intervention.programId ? getFrenchLabel('programType', intervention.programId, taxonomies) : '',
      'Estimation budgétaire (k$)': intervention.estimate?.allowance,
      "Type d'actif": getFrenchLabel('assetType', intervention.assets[0].typeId, taxonomies),
      "Longueur de l'intervention (m)": interventionLength,
      Requérant: getFrenchLabel('requestor', intervention.requestorId, taxonomies),
      Exécutant: getFrenchLabel('executor', intervention.executorId, taxonomies),
      Arrondissement: getFrenchLabel('borough', intervention.boroughId, taxonomies),
      Voie: intervention.streetName ? intervention.streetName : '',
      'Voie de': intervention.streetFrom ? intervention.streetFrom : '',
      'Voie à': intervention.streetTo ? intervention.streetTo : '',
      Contact: intervention.contact ? intervention.contact : '',
      'Type de réseau': intervention.roadNetworkTypeId
        ? getFrenchLabel('roadNetworkType', intervention.roadNetworkTypeId, taxonomies)
        : '',
      "Médaille d'aménagement": intervention.medalId
        ? getFrenchLabel('medalType', intervention.medalId, taxonomies)
        : '',
      'ID de projet': intervention.project ? intervention.project?.id : '',
      'ID externe': intervention.externalReferenceIds ? intervention.externalReferenceIds[0]?.value : ''
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
