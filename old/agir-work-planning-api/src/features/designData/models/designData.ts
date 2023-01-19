import { IDesignData } from '@villemontreal/agir-work-planning-lib/dist/src';
import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { IDesignDataAttributes } from '../mongo/designDataSchema';

// tslint:disable:no-empty-interface
export interface IDesignDataProps extends IDesignData {
  audit: Audit;
}

export enum ContractRange {
  debut = 'Début',
  fin = 'Fin'
}

export class DesignData extends GenericEntity<IDesignDataProps> {
  public static create(props: IDesignDataProps): Result<DesignData> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<DesignData>(guard);
    }
    const designData = new DesignData(props);
    return Result.ok<DesignData>(designData);
  }

  public static guard(props: IDesignDataProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.contractRange,
        argumentName: `${valueName}contractRange`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ContractRange)
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IDesignDataAttributes): Promise<DesignData> {
    return DesignData.create({
      upstreamAssetType: raw.upstreamAssetType,
      upstreamAssetId: raw.upstreamAssetId,
      downstreamAssetType: raw.downstreamAssetType,
      downstreamAssetId: raw.downstreamAssetId,
      comment: raw.comment,
      contractRange: raw.contractRange,
      audit: await Audit.toDomainModel(raw.audit)
    }).getValue();
  }

  public static toPersistance(designData: DesignData): IDesignDataAttributes {
    return {
      upstreamAssetType: designData.upstreamAssetType,
      upstreamAssetId: designData.upstreamAssetId,
      downstreamAssetType: designData.downstreamAssetType,
      downstreamAssetId: designData.downstreamAssetId,
      comment: designData.comment,
      contractRange: designData.contractRange,
      audit: Audit.toPersistance(designData.audit)
    };
  }

  public get upstreamAssetType(): string {
    return this.props.upstreamAssetType;
  }

  public get upstreamAssetId(): string {
    return this.props.upstreamAssetId;
  }

  public get downstreamAssetType(): string {
    return this.props.downstreamAssetType;
  }

  public get downstreamAssetId(): string {
    return this.props.downstreamAssetId;
  }

  public get contractRange(): ContractRange {
    return this.props.contractRange ? (this.props.contractRange as ContractRange) : undefined;
  }

  public get comment(): string {
    return this.props.comment;
  }

  public get audit(): Audit {
    return this.props.audit;
  }
}
