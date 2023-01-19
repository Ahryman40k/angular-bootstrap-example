import { IPlainNote, IPlainOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { isEmpty } from '../../../utils/utils';
import { Asset, IAssetProps, isAsset } from '../../asset/models/asset';
import { IPlainOpportunityNoticeNoteProps, PlainOpportunityNoticeNote } from './notes/plainOpportunityNoticeNote';
import { IPlainOpportunityNoticeResponseProps, PlainOpportunityNoticeResponse } from './plainOpportunityNoticeResponse';

// tslint:disable:no-empty-interface
export interface IPlainOpportunityNoticeProps extends IPlainOpportunityNotice {
  assets: IAssetProps[];
  notes?: IPlainOpportunityNoticeNoteProps[];
  response?: IPlainOpportunityNoticeResponseProps;
}

export class PlainOpportunityNotice<P extends IPlainOpportunityNoticeProps> extends AggregateRoot<P> {
  public static create(
    props: IPlainOpportunityNoticeProps
  ): Result<PlainOpportunityNotice<IPlainOpportunityNoticeProps>> {
    // TODO
    // should not happen if body is destructured before entering method
    if (!props) {
      return Result.fail<PlainOpportunityNotice<IPlainOpportunityNoticeProps>>(`Empty body`);
    }
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<PlainOpportunityNotice<IPlainOpportunityNoticeProps>>(guard);
    }
    const plainOpportunityNotice = new PlainOpportunityNotice(props);
    return Result.ok<PlainOpportunityNotice<IPlainOpportunityNoticeProps>>(plainOpportunityNotice);
  }

  public get projectId(): string {
    return this.props.projectId;
  }

  public get object(): string {
    return this.props.object;
  }

  public get assets(): Asset[] {
    return this._assets;
  }

  public get requestorId(): string {
    return this.props.requestorId;
  }

  public get contactInfo(): string {
    return this.props.contactInfo;
  }

  public get followUpMethod(): string {
    return this.props.followUpMethod;
  }

  public get maxIterations(): number {
    return this.props.maxIterations;
  }

  public get notes(): PlainOpportunityNoticeNote<IPlainOpportunityNoticeNoteProps>[] {
    return this._notes;
  }

  public get response(): PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps> {
    return this._response;
  }

  public static guard(props: IPlainOpportunityNoticeProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.projectId,
        argumentName: 'projectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
      },
      {
        argument: props.requestorId,
        argumentName: 'requestorId',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.followUpMethod,
        argumentName: 'followUpMethod',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.maxIterations,
        argumentName: 'maxIterations',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.assets,
        argumentName: 'assets',
        guardType: [GuardType.IS_ARRAY]
      },
      {
        argument: props.contactInfo,
        argumentName: 'contactInfo',
        guardType: [GuardType.EMPTY_STRING]
      }
    ];
    let guardNotes = [{ succeeded: true }];
    if (!isEmpty(props.notes)) {
      guardNotes = this.guardNotes(props.notes);
    }
    let guardAssets = [{ succeeded: true }];
    if (!isNil(props.assets) && Array.isArray(props.assets)) {
      guardAssets = this.guardAssets(props.assets);
    }
    let guardResponse: IGuardResult = { succeeded: true };
    if (props?.response) {
      guardResponse = PlainOpportunityNoticeResponse.guard(props.response);
    }
    return Guard.combine([...Guard.guardBulk(guardBulk), ...guardNotes, ...guardAssets, guardResponse]);
  }

  protected static guardNotes(notes: IPlainNote[]): IGuardResult[] {
    return notes.map((note, index) =>
      Guard.guard({
        argument: note.text,
        argumentName: `notes[${index}].text`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      })
    );
  }

  protected static guardAssets(assets: IAssetProps[]): IGuardResult[] {
    return assets.map((asset, index) => Asset.guard(asset, `[${index}]`));
  }

  private readonly _notes: PlainOpportunityNoticeNote<IPlainOpportunityNoticeNoteProps>[] = [];
  private readonly _assets: Asset[] = [];
  private readonly _response: PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>;
  constructor(props: P, id: string = null) {
    super(props, id);
    if (!isEmpty(props.notes)) {
      this._notes = props.notes.map(note => {
        return PlainOpportunityNoticeNote.create(note).getValue();
      });
    }
    if (!isEmpty(props.assets)) {
      this._assets = props.assets.map(asset => {
        if (isAsset(asset)) {
          return asset;
        }
        return Asset.create({
          ...asset
        }).getValue();
      });
    }
    if (!isEmpty(props.response)) {
      this._response = PlainOpportunityNoticeResponse.create(props.response).getValue();
    }
  }

  public equals(otherOpportunityNotice: PlainOpportunityNotice<any>): boolean {
    return super.equals(otherOpportunityNotice) && this.innerEquals(otherOpportunityNotice);
  }

  private innerEquals(otherOpportunityNotice: PlainOpportunityNotice<any>): boolean {
    return (
      this.projectId === otherOpportunityNotice.projectId &&
      this.requestorId === otherOpportunityNotice.requestorId &&
      this.followUpMethod === otherOpportunityNotice.followUpMethod
    );
  }
}
