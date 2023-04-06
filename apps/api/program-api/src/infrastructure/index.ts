import { createAnnualProgramStorage, AnnualProgramStorage } from './annual-program.infra';
import { SystemsConfig } from '../config';

export type ServerStorages = AnnualProgramStorage;

export const createStorages = async (infra: SystemsConfig): Promise<ServerStorages> => ({
  ...(await createAnnualProgramStorage(infra)),
});
