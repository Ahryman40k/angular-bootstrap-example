import { TimeUnits } from '../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../utils/moment/momentUtils';
import { getAudit } from '../../audit/test/auditTestHelper';
import { BicImportLog } from '../models/bicImportLog';

export function getBicImportLogFromNSecondsAgo(nbSeconds: number) {
  return BicImportLog.create({
    audit: getAudit({
      createdAt: MomentUtils.subtract(MomentUtils.now(), nbSeconds, TimeUnits.SECOND).toISOString()
    })
  }).getValue();
}
