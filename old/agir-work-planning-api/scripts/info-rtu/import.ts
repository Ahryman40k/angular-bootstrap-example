import { Container } from 'inversify';
import { RtuImportUseCase } from '../../src/features/rtu/useCases/rtuImport/rtuImportUseCase';
import { initComponents } from '../../src/init';
import { createLogger } from '../../src/utils/logger';

// tslint:disable-next-line: variable-name
const container = new Container();
const logger = createLogger('rtuImportUseCase');

container.bind<RtuImportUseCase>(RtuImportUseCase).toConstantValue(new RtuImportUseCase());

const nodesService = container.get<RtuImportUseCase>(RtuImportUseCase);

async function main() {
  await initComponents();
  await nodesService.import(true);
}

main()
  .then(r => {
    logger.info(r, 'End');
    process.exit(0);
  })
  .catch(e => {
    logger.info(e);
    process.exit(1);
  });
