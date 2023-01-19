import { GenericEntity } from '../domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';

// tslint:disable:no-empty-interface
export interface IUploadFileProps extends Express.Multer.File {}

export class UploadFile extends GenericEntity<IUploadFileProps> {
  public static create(props: IUploadFileProps): Result<UploadFile> {
    const guard = UploadFile.guard(props);
    if (!guard.succeeded) {
      return Result.fail<UploadFile>(guard);
    }

    const uploadFile = new UploadFile(props);
    return Result.ok<UploadFile>(uploadFile);
  }

  public static guard(props: IUploadFileProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.mimetype,
        argumentName: 'mimetype',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.originalname,
        argumentName: 'originalname',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.buffer,
        argumentName: 'buffer',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.size,
        argumentName: 'file',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_FILE_SIZE],
        values: [props.originalname]
      }
    ];

    return Guard.combine(Guard.guardBulk(guardBulk));
  }

  public get mimetype(): string {
    return this.props.mimetype;
  }

  public get originalname(): string {
    return this.props.originalname;
  }

  public get buffer(): Buffer {
    return this.props.buffer;
  }

  public get size(): number {
    return this.props.size;
  }
}
