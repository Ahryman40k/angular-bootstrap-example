import { ServerStorages } from '../infrastructure';
import { createAnnualProgramService } from './annual-program.service';

export type ServerServices = Record<string, (...args: any[]) => Promise<any>>;

// export type ServerServicesKeys = keyof ServerServices;

export const createServices = (infra: ServerStorages): ServerServices => ({
  ...createAnnualProgramService(infra),
});
