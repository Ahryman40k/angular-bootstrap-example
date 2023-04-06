import { createAnnualProgramService } from './annual-program.service';
import { ServerStorages } from '../infrastructure';

export type ServerServices = Record<string, (...args: any[]) => Promise<any>>;

// export type ServerServicesKeys = keyof ServerServices;

export const createServices = (infra: ServerStorages): ServerServices => ({
  ...createAnnualProgramService(infra),
});
