import { FindOneOptions, MongoClient } from 'mongodb';
// tslint:disable: no-console
// tslint:disable: await-promise

// Prod
// const user = 'agirworkplanning';
// const pw = '';
// export const uri = `mongodb://${user}:${pw}@prdlmg01a.montrealnet.vdm.qc.ca:27001,prdlmg01b.montrealnet.vdm.qc.ca:27001,prdlmg01c.montrealnet.vdm.qc.ca:27001/agirworkplanning?replicaSet=rsprd01`;

// Dev
const user = 'agirworkplanning';
const pw = '';
export const uri = `mongodb://${user}:${pw}@dvllmg01a.ile.montreal.qc.ca:27001,dvllmg01b.ile.montreal.qc.ca:27001,dvllmg01c.ile.montreal.qc.ca:27001/agirworkplanning?replicaSet=rsdvl01`;

export async function connnectToDB(connString: string): Promise<MongoClient> {
  const client = new MongoClient(connString);
  await client.connect();
  return client;
}

export async function executeFindQueryProjection(
  client: MongoClient,
  collection: string,
  query: any,
  options: FindOneOptions
): Promise<any[]> {
  const results: any[] = [];
  const coll = await client.db().collection(collection);
  const cursor = await coll.find(query, options);
  const dbResult = await cursor.toArray();
  dbResult.forEach(doc => {
    results.push(doc);
  });
  return results;
}

export async function getTaxonomiesGroups(client: MongoClient, groups: string[]) {
  const query = {
    group: { $in: groups }
  };

  const options = {
    projection: {
      group: 1,
      code: 1,
      'label.fr': 1
    }
  };

  return await executeFindQueryProjection(client, 'taxonomies', query, options);
}

export function getFrenchLabel(group: string, code: string, taxonomies: any[]): string {
  return taxonomies.find(item => item.group === group && item.code === code).label.fr;
}

export function objectListToCSV(mappedResult: any[], delim = ','): string {
  let str = '';

  if (mappedResult.length < 1) {
    return '';
  }

  const cols = Object.keys(mappedResult[0]);
  // Write header
  for (const key of cols) {
    str += key + delim;
  }
  str += '\n';

  // Write records
  for (const r of mappedResult) {
    for (const key of cols) {
      const val: string = (r[key] ?? '').toString().replace(/\"/g, '""') ?? '';
      str += `"${val}"` + delim;
    }
    str += '\n';
  }

  return str;
}
