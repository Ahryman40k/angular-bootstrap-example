import {
  AssetType,
  IAsset,
  IFeature,
  IFeatureCollection,
  IGeometry
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isEqual, isNil } from 'lodash';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import {
  ExternalReferenceId,
  IExternalReferenceIdProps
} from '../../../shared/domain/externalReferenceId/externalReferenceId';
import { IExternalReferenceIdAttributes } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { AssetDesignData } from '../../assetDesignData/models/assetDesignData';
import { Length } from '../../length/models/length';
import { IAssetAttributes } from '../mongo/assetSchemas';

// tslint:disable:no-empty-interface
export interface IAssetProps extends IAsset {
  externalReferenceIds?: IExternalReferenceIdProps[];
  assetDesignData?: AssetDesignData;
}
const ASSET_UNDEFINED_ID = 'undefined';

export class Asset extends AggregateRoot<IAssetProps> {
  public static create(props: IAssetProps): Result<Asset> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<Asset>(guard);
    }
    const asset = new Asset(props, props.id);
    return Result.ok<Asset>(asset);
  }

  public static guard(props: IAssetProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.geometry,
        argumentName: `${valueName}geometry`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.typeId,
        argumentName: `${valueName}typeId`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(AssetType)
      }
    ];

    let guardLength = { succeeded: true };
    if (!isNil(props.length)) {
      guardLength = Length.guard(props.length, 'length.');
    }
    let guardExternalReferenceIds = [{ succeeded: true }];
    if (!isEmpty(props.externalReferenceIds)) {
      guardExternalReferenceIds = props.externalReferenceIds.map((ext, index) =>
        ExternalReferenceId.guard(ext, `externalReferenceId[${index}]`)
      );
    }

    return Guard.combine([...Guard.guardBulk(guardBulk), guardLength, ...guardExternalReferenceIds]);
  }

  public static async toDomainModel(raw: IAssetAttributes): Promise<Asset> {
    if (isEmpty(raw)) {
      return undefined;
    }
    let length: Length;
    if (raw.length) {
      length = await Length.toDomainModel(raw.length);
    }
    let assetDesignData: AssetDesignData;
    if (raw.assetDesignData) {
      assetDesignData = await AssetDesignData.toDomainModel(raw.assetDesignData);
    }
    let externalReferenceIds: ExternalReferenceId[];
    if (raw.externalReferenceIds) {
      externalReferenceIds = await Promise.all(
        raw.externalReferenceIds.map(extId => ExternalReferenceId.toDomainModel(extId))
      );
    }
    return Asset.create({
      id: raw.id || ASSET_UNDEFINED_ID,
      typeId: raw.typeId,
      ownerId: raw.ownerId,
      length,
      geometry: raw.geometry,
      diameter: raw.diameter,
      material: raw.material,
      suggestedStreetName: raw.suggestedStreetName,
      roadSections: raw.roadSections,
      workArea: raw.workArea,
      externalReferenceIds,
      assetDesignData
    }).getValue();
  }

  public static async toDomainModelBulk(rawAssets: IAssetAttributes[]): Promise<Asset[]> {
    return Promise.all(rawAssets.map((rawAsset: IAssetAttributes) => this.toDomainModel(rawAsset)));
  }

  public static toPersistance(asset: Asset): IAssetAttributes {
    let externalReferenceIds: IExternalReferenceIdAttributes[];
    if (!isEmpty(asset.externalReferenceIds)) {
      externalReferenceIds = asset.externalReferenceIds.map(extId => ExternalReferenceId.toPersistance(extId));
    }
    return {
      id: asset.id,
      typeId: asset.typeId,
      ownerId: asset.ownerId,
      length: !isNil(asset.length) ? Length.toPersistance(asset.length) : asset.length,
      geometry: asset.geometry,
      diameter: asset.diameter,
      material: asset.material,
      suggestedStreetName: asset.suggestedStreetName,
      roadSections: asset.roadSections,
      workArea: asset.workArea,
      externalReferenceIds,
      assetDesignData: asset.assetDesignData ? AssetDesignData.toPersistance(asset.assetDesignData) : undefined
    };
  }

  public static toPersistanceBulk(assets: Asset[]): IAssetAttributes[] {
    return assets.map(asset => this.toPersistance(asset));
  }

  private readonly _externalReferenceIds: ExternalReferenceId[];
  private _length: Length;
  private _typeId: string;
  private _ownerId: string;
  private _diameter: string;
  private _material: string;
  private _assetDesignData: AssetDesignData;
  constructor(props: IAssetProps, id: string = null) {
    super(props, id);
    if (!isNil(props.length)) {
      this._length = Length.create(props.length).getValue();
    }
    if (!isEmpty(props.externalReferenceIds)) {
      this._externalReferenceIds = props.externalReferenceIds.map(extId =>
        ExternalReferenceId.create(extId).getValue()
      );
    }
  }

  public get id(): string {
    return this.props.id !== ASSET_UNDEFINED_ID ? this.props.id : undefined;
  }

  public get typeId(): string {
    return this._typeId || this.props.typeId;
  }

  public set typeId(typeId: string) {
    this._typeId = typeId;
  }

  public get ownerId(): string {
    return this._ownerId || this.props.ownerId;
  }

  public set ownerId(ownerId: string) {
    this._ownerId = ownerId;
  }

  public set length(incomingLength: Length) {
    this._length = incomingLength;
  }

  public get length(): Length {
    return this._length;
  }

  public get geometry(): IGeometry {
    return this.props.geometry;
  }

  public get diameter(): string {
    return this._diameter || this.props.diameter;
  }

  public set diameter(diameter: string) {
    this._diameter = diameter;
  }

  public get material(): string {
    return this._material || this.props.material;
  }

  public set material(material: string) {
    this._material = material;
  }

  public get suggestedStreetName(): string {
    return this.props.suggestedStreetName;
  }

  public get roadSections(): IFeatureCollection {
    return this.props.roadSections;
  }

  public get workArea(): IFeature {
    return this.props.workArea;
  }

  public get properties(): any {
    return this.props.properties;
  }

  public get externalReferenceIds(): ExternalReferenceId[] {
    return this._externalReferenceIds;
  }

  public get assetDesignData(): AssetDesignData {
    return this._assetDesignData || this.props.assetDesignData;
  }

  public set assetDesignData(assetDesignData: AssetDesignData) {
    this._assetDesignData = assetDesignData;
  }

  public getExternalReferenceIdValue(externalReferenceIdType: string): any {
    return this.externalReferenceIds?.find(extId => extId.type === externalReferenceIdType)?.value;
  }

  public equals(otherAsset: Asset): boolean {
    return super.equals(otherAsset) && this.innerEquals(otherAsset);
  }

  private innerEquals(otherAsset: Asset): boolean {
    return isEqual(
      [this.geometry, this.roadSections, this.workArea],
      [otherAsset.geometry, otherAsset.roadSections, otherAsset.workArea]
    );
  }
}

export const isAsset = (v: any): v is Asset => {
  return v instanceof Asset;
};
