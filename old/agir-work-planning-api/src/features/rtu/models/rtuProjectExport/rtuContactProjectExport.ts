import { get } from 'lodash';

import { Guard, GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IInfoRtuContactProject } from '../../../../shared/rtuImport/infoRtuProject';
import { IRtuContactProjectProps, RtuContactProject } from '../rtuContactProject';
import { RtuImportError } from '../rtuImportError';

export class RtuContactProjectExport extends RtuContactProject {
  public static create(props: IRtuContactProjectProps, id?: string): Result<RtuContactProjectExport> {
    // Guard id
    const guardResult = Guard.guard({
      argument: id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
    });

    if (!guardResult.succeeded) {
      const convertedGuardResult = guardResult.failures.map(failure =>
        RtuImportError.fromGuardError(failure, { value1: get(props, failure.target) })
      );
      return Result.fail<RtuContactProjectExport>(convertedGuardResult);
    }
    const rtuContactProject = new RtuContactProjectExport(props, id);
    return Result.ok<RtuContactProjectExport>(rtuContactProject);
  }

  public mapToInfoRtuApi(): IInfoRtuContactProject {
    return {
      id: this.id ?? null,
      officeId: this.officeId ?? null,
      num: this.num ?? null,
      prefix: this.prefix ?? null,
      name: this.name ?? null,
      title: this.title ?? null,
      email: this.email ?? null,
      phone: this.phone ?? null,
      phoneExtensionNumber: this.phoneExtensionNumber ?? null,
      cell: this.cell ?? null,
      fax: this.fax ?? null,
      typeNotfc: this.typeNotfc ?? null,
      paget: this.paget ?? null,
      profile: this.profile ?? null,
      globalRole: this.globalRole ?? null,
      idInterim: this.idInterim ?? null,
      inAutoNotification: this.inAutoNotification ?? null,
      inDiffusion: this.inDiffusion ?? null,
      areaName: this.areaName ?? null,
      role: this.role ?? null,
      partnerType: this.partnerType ?? null,
      partnerId: this.partnerId ?? null
    };
  }
}
