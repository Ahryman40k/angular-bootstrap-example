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

export async function queryDatabaseForExport(client: MongoClient) {
  const query = {
    // 'items.id': { $in: ['TODO'] }
  };

  const options = {
    projection: {
      'items.id': 1,
      typeId: 1,
      subtypeId: 1,
      text: 1
    }
  };

  return await executeFindQueryProjection(client, 'requirements', query, options);
}

async function main() {
  const client = await connnectToDB(uri);
  const taxonomies = await getTaxonomiesGroups(client, ['requirementType', 'requirementSubtype']);
  const results = await queryDatabaseForExport(client);
  const mappedResult = [];

  for (const requirement of results) {
    for (const item of requirement.items) {
      const line = {
        "ID de projet ou d'intervention": item.id,
        "Type de l'exigence": getFrenchLabel('requirementType', requirement.typeId, taxonomies),
        "Sous-type de l'exigence": getFrenchLabel('requirementSubtype', requirement.subtypeId, taxonomies),
        Texte: requirement.text
      };
      mappedResult.push(line);
    }
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
