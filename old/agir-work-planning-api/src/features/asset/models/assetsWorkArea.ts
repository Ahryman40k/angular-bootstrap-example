import { IAssetsWorkArea, IFeature } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Asset } from './asset';

export interface IAssetsWorkAreaProps extends IAssetsWorkArea {
  assets: Asset[];
}

export class AssetsWorkArea extends AggregateRoot<IAssetsWorkAreaProps> {
  public static create(props: IAssetsWorkAreaProps): Result<AssetsWorkArea> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AssetsWorkArea>(guard);
    }
    const assetsWorkArea = new AssetsWorkArea(props);
    return Result.ok<AssetsWorkArea>(assetsWorkArea);
  }

  public static guard(props: IAssetsWorkAreaProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.workArea,
        argumentName: `workArea`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];

    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  constructor(props: IAssetsWorkAreaProps, id: string = null) {
    super(props, id);
  }

  public get assets(): Asset[] {
    return this.props.assets;
  }

  public get workArea(): IFeature {
    return this.props.workArea;
  }
}
