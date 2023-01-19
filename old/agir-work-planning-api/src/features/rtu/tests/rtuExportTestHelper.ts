import {
  ErrorCodes,
  IEnrichedProject,
  ProjectExternalReferenceType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { Audit } from '../../audit/audit';
import { IRtuExportErrorProps, RtuExportError } from '../models/rtuExportError';
import { IRtuExportLogProps, RtuExportLog, RtuExportStatus } from '../models/rtuExportLog';
import { RtuExportLogFindOptions } from '../models/rtuExportLogFindOptions';
import { RtuProjectExportStatus } from '../models/rtuProjectExport/rtuProjectExport';
import {
  IRtuProjectExportSummaryProps,
  RtuProjectExportSummary
} from '../models/rtuProjectExport/rtuProjectExportSummary';
import { rtuExportLogRepository } from '../mongo/rtuExportLogRepository';

const rtuExportLogProps: IRtuExportLogProps = {
  audit: Audit.fromCreateContext(),
  status: RtuExportStatus.IN_PROGRESS,
  projects: [],
  startDateTime: new Date().toISOString(),
  endDateTime: new Date(new Date().getTime() + 10000).toISOString()
};

export function getRtuExportLogProps(props?: Partial<IRtuExportLogProps>): IRtuExportLogProps {
  return mergeProperties(rtuExportLogProps, props);
}

export function getRtuExportLog(props?: Partial<IRtuExportLogProps>, id?: string): RtuExportLog {
  const result = RtuExportLog.create(getRtuExportLogProps(props), id);
  return result.getValue();
}

const rtuProjectExporSummarytProps: IRtuProjectExportSummaryProps = {
  projectName: 'test',
  streetName: 'sherbrook',
  streetFrom: 'peel',
  streetTo: 'pear',
  status: RtuProjectExportStatus.SUCCESSFUL,
  errorDetails: []
};

export function getRtuProjectExportSummaryProps(
  props?: Partial<IRtuProjectExportSummaryProps>
): IRtuProjectExportSummaryProps {
  return mergeProperties(rtuProjectExporSummarytProps, props);
}

export function getRtuProjectExportSummary(
  props?: Partial<IRtuProjectExportSummaryProps>,
  id?: string
): RtuProjectExportSummary {
  const result = RtuProjectExportSummary.create(getRtuProjectExportSummaryProps(props), id ? id : 't1');
  return result.getValue();
}

export async function assertRtuExport(): Promise<RtuExportLog> {
  const rtuExportLogFindOptions = RtuExportLogFindOptions.create({ criterias: {} }).getValue();
  const listImport = await rtuExportLogRepository.findAll(rtuExportLogFindOptions);
  assert.equal(listImport.length, 1);
  assert.strictEqual(listImport[0].status, RtuExportStatus.SUCCESSFUL);
  assert.strictEqual(listImport[0].errorDetail, undefined);
  return listImport[0];
}

export function assertSucccessAgirProjectExport(project: IEnrichedProject): void {
  assert.strictEqual(project.rtuExport.status, RtuProjectExportStatus.SUCCESSFUL);
  assert.exists(project.rtuExport.exportAt);
  const externalReferenceFound = project.externalReferenceIds.find(
    reference => reference.type === ProjectExternalReferenceType.infoRtuId
  );
  assert.exists(externalReferenceFound);
}

export function assertFailedAgirProjectExport(project: IEnrichedProject): void {
  assert.strictEqual(project.rtuExport.status, RtuProjectExportStatus.FAILURE);
}

const rtuExportErrorProps: IRtuExportErrorProps = {
  code: ErrorCodes.MissingValue,
  target: '',
  values: undefined
};

export function getRtuExportErrorProps(props?: Partial<IRtuExportErrorProps>): IRtuExportErrorProps {
  return mergeProperties(rtuExportErrorProps, props);
}

export function getRtuExportError(props?: Partial<IRtuExportErrorProps>, id?: string): RtuExportError {
  const result = RtuExportError.create(getRtuExportErrorProps(props), id);
  return result.getValue();
}
