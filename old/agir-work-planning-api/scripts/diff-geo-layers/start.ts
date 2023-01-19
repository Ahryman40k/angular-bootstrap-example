import { environmentConfigs } from './src/environment-config';
import { getSourceLayerJson } from './src/get-source-layer-json';
import { sourceLayerIds } from './src/source-layer-ids';

const jsonDiff = require('json-diff');

// tslint:disable: no-string-literal
// tslint:disable: no-console

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Deactivates TLS for the script.

async function main(): Promise<void> {
  for (const sourceLayerId of sourceLayerIds) {
    const [response1, response2] = await Promise.all(
      environmentConfigs.map(env => getSourceLayerJson(sourceLayerId, env))
    );

    const diff = jsonDiff.diffString(response1, response2);

    console.log(sourceLayerId); // NOSONAR
    console.log(diff || '==='); // NOSONAR
    console.log('\n\n\n'); // NOSONAR
  }
}

void main();
