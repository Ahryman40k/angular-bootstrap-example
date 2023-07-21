import { SubmissionStorage, createSubmissionStorage } from './submission.infra';
import { SystemsConfig } from '../config';

export type ServerStorages = SubmissionStorage;

export const createStorages = async (infra: SystemsConfig): Promise<ServerStorages> => ({
  ...(await createSubmissionStorage(infra)),
});
