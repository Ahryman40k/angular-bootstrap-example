import { IAssetDesignData } from '@villemontreal/agir-work-planning-lib/dist/src';
import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { IAssetDesignDataAttributes } from '../mongo/assetDesignDataSchema';

// tslint:disable:no-empty-interface
export interface IAssetDesignDataProps extends IAssetDesignData {
  audit: Audit;
}

export class AssetDesignData extends GenericEntity<IAssetDesignDataProps> {
  public static create(props: IAssetDesignDataProps): Result<AssetDesignData> {
    return Result.ok<AssetDesignData>(new AssetDesignData(props));
  }

  public static async toDomainModel(raw: IAssetDesignDataAttributes): Promise<AssetDesignData> {
    return AssetDesignData.create({
      upstreamAssetType: raw.upstreamAssetType,
      upstreamAssetId: raw.upstreamAssetId,
      upstreamDepth: raw.upstreamDepth,
      downstreamAssetType: raw.downstreamAssetType,
      downstreamAssetId: raw.downstreamAssetId,
      downstreamDepth: raw.downstreamDepth,
      numberOfConnections: raw.numberOfConnections,
      deformation: raw.deformation,
      hasInfiltration: raw.hasInfiltration,
      infiltrationChaining: raw.infiltrationChaining,
      infiltrationAssetId: raw.infiltrationAssetId,
      hasObstruction: raw.hasObstruction,
      obstructionChaining: raw.obstructionChaining,
      obstructionAssetId: raw.obstructionAssetId,
      comment: raw.comment,
      audit: await Audit.toDomainModel(raw.audit)
    }).getValue();
  }

  public static toPersistance(assetDesignData: AssetDesignData): IAssetDesignDataAttributes {
    return {
      upstreamAssetType: assetDesignData.upstreamAssetType,
      upstreamAssetId: assetDesignData.upstreamAssetId,
      upstreamDepth: assetDesignData.upstreamDepth,
      downstreamAssetType: assetDesignData.downstreamAssetType,
      downstreamAssetId: assetDesignData.downstreamAssetId,
      downstreamDepth: assetDesignData.downstreamDepth,
      numberOfConnections: assetDesignData.numberOfConnections,
      deformation: assetDesignData.deformation,
      hasInfiltration: assetDesignData.hasInfiltration,
      infiltrationChaining: assetDesignData.infiltrationChaining,
      infiltrationAssetId: assetDesignData.infiltrationAssetId,
      hasObstruction: assetDesignData.hasObstruction,
      obstructionChaining: assetDesignData.obstructionChaining,
      obstructionAssetId: assetDesignData.obstructionAssetId,
      comment: assetDesignData.comment,
      audit: Audit.toPersistance(assetDesignData.audit)
    };
  }

  public get upstreamAssetType(): string {
    return this.props.upstreamAssetType;
  }

  public get upstreamAssetId(): string {
    return this.props.upstreamAssetId;
  }

  public get upstreamDepth(): string {
    return this.props.upstreamDepth;
  }

  public get downstreamAssetType(): string {
    return this.props.downstreamAssetType;
  }

  public get downstreamAssetId(): string {
    return this.props.downstreamAssetId;
  }

  public get downstreamDepth(): string {
    return this.props.downstreamDepth;
  }

  public get numberOfConnections(): number {
    return this.props.numberOfConnections;
  }

  public get deformation(): number {
    return this.props.deformation;
  }

  public get hasInfiltration(): boolean {
    return this.props.hasInfiltration;
  }

  public get infiltrationChaining(): string {
    return this.props.infiltrationChaining;
  }

  public get infiltrationAssetId(): string {
    return this.props.infiltrationAssetId;
  }

  public get hasObstruction(): boolean {
    return this.props.hasObstruction;
  }

  public get obstructionChaining(): string {
    return this.props.obstructionChaining;
  }

  public get obstructionAssetId(): string {
    return this.props.obstructionAssetId;
  }

  public get comment(): string {
    return this.props.comment;
  }

  public get audit(): Audit {
    return this.props.audit;
  }
}
