import { Guard, GuardType, IGuardResult } from '../../logic/guard';
import { Result } from '../../logic/result';
import { UploadFile } from '../../upload/uploadFile';
import { Command } from '../command';

export interface IImportFileMetaProps {
  fileName: string;
}
export interface IImportFileProps {
  file: UploadFile;
}

export class ImportFileCommand<P extends IImportFileProps> extends Command<P> {
  public static create(props: IImportFileProps): Result<ImportFileCommand<IImportFileProps>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ImportFileCommand<IImportFileProps>>(guard);
    }
    const importFileCommand = new ImportFileCommand(props);
    return Result.ok<ImportFileCommand<IImportFileProps>>(importFileCommand);
  }

  public static guard(props: IImportFileProps): IGuardResult {
    const guardUploadFile = Guard.guard({
      argument: props.file,
      argumentName: 'file',
      guardType: [GuardType.NULL_OR_UNDEFINED]
    });
    return Guard.combine([guardUploadFile]);
  }

  public get file(): UploadFile {
    return this.props.file;
  }
}
