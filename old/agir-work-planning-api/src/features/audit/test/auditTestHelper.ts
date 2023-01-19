import { IAudit } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { createAuthorMock } from '../../../../tests/data/author.mocks';
import { mergeProperties } from '../../../../tests/utils/testHelper';
import { userMocker } from '../../../../tests/utils/userUtils';
import { TimeUnits } from '../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../utils/moment/momentUtils';
import { Audit, IAuditProps } from '../audit';
import { Author } from '../author';
import { auditMapperDTO } from '../mappers/auditMapperDTO';

export async function getAuditDTO(auditProps?: Partial<IAuditProps>): Promise<IAudit> {
  return auditMapperDTO.getFromModel(getAudit(auditProps));
}

export function getAudit(auditProps?: Partial<IAuditProps>): Audit {
  const auditPropsMerged = mergeProperties(
    {
      createdAt: MomentUtils.now().toISOString(),
      createdBy: Author.create({ ...createAuthorMock() }).getValue()
    },
    auditProps
  );
  return Audit.create(auditPropsMerged).getValue();
}

export function getDateUnitsAgo(value: number, unit: TimeUnits): string {
  return MomentUtils.subtract(MomentUtils.now(), value, unit).toISOString();
}

export function assertAudit(audit: IAudit) {
  assert.isTrue(MomentUtils.isValid(audit.createdAt), `audit invalid date : ${audit.createdAt}`);
  assert.strictEqual(
    audit.createdBy.displayName,
    userMocker.currentMock.displayName,
    `audit createdBy.displayName ${audit.createdBy.displayName} === ${userMocker.currentMock.displayName}`
  );
  assert.strictEqual(
    audit.createdBy.userName,
    userMocker.currentMock.userName,
    `audit createdBy.userName ${audit.createdBy.userName} === ${userMocker.currentMock.userName}`
  );
}

export function assertUpdatedAudit(originalAudit: IAudit, updatedAudit: IAudit) {
  assert.isTrue(MomentUtils.isValid(originalAudit.createdAt), `audit invalid date : ${originalAudit.createdAt}`);
  assert.isTrue(MomentUtils.isValid(updatedAudit.createdAt), `audit invalid date : ${updatedAudit.createdAt}`);
  assert.strictEqual(
    originalAudit.createdBy.displayName,
    updatedAudit.createdBy.displayName,
    `audit createdBy.displayName ${updatedAudit.createdBy.displayName} === ${updatedAudit.createdBy.displayName}`
  );

  assert.strictEqual(
    originalAudit.createdBy.userName,
    updatedAudit.createdBy.userName,
    `audit createdBy.userName ${updatedAudit.createdBy.userName} === ${updatedAudit.createdBy.userName}`
  );

  if (originalAudit.lastModifiedAt) {
    assert.isTrue(
      MomentUtils.isValid(originalAudit.lastModifiedAt),
      `audit invalid date : ${originalAudit.lastModifiedAt}`
    );
  }
  assert.isTrue(
    MomentUtils.isValid(updatedAudit.lastModifiedAt),
    `audit invalid date : ${updatedAudit.lastModifiedAt}`
  );
  assert.strictEqual(
    updatedAudit.lastModifiedBy.displayName,
    userMocker.currentMock.displayName,
    `audit createdBy.displayName ${updatedAudit.createdBy.displayName} === ${userMocker.currentMock.displayName}`
  );

  assert.strictEqual(
    updatedAudit.lastModifiedBy.userName,
    userMocker.currentMock.userName,
    `audit createdBy.userName ${updatedAudit.createdBy.userName} === ${userMocker.currentMock.userName}`
  );
}
