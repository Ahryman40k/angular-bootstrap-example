import dtsgenerator, { DefaultTypeNameConvertor, SchemaId } from 'dtsgenerator';
import * as fs from 'fs';
import * as jsYaml from 'js-yaml';

import { prettierFix } from '@villemontreal/lint-config-villemontreal';

const filePath = './open-api/open-api.yaml';

const pathOutput = './src/models/public-api';
const fileOutput = pathOutput + '/index.d.ts';

function typeNameConvertor(id: SchemaId): string[] {
  const names = DefaultTypeNameConvertor(id);
  if (names.length > 0) {
    const lastIndex = names.length - 1;
    names[lastIndex] = 'I' + names[lastIndex];
  }
  return names;
}

async function main(): Promise<void> {
  // tslint:disable-next-line:no-console
  const content = jsYaml.safeLoad(fs.readFileSync(filePath, 'utf-8'));
  let result = await dtsgenerator({
    contents: [content],
    typeNameConvertor
  });

  let lines = result.split('\n');

  // remove 2 first lines;
  lines = lines.slice(2, -3);
  result = lines.join('\n');

  try {
    fs.writeFileSync(fileOutput, result, { encoding: 'utf-8' });
    await prettierFix(pathOutput);
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log(error);
  }
}

main()
  .then()
  .catch();
