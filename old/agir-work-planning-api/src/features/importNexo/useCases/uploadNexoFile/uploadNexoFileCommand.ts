import { Guard, GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IImportNexoFileProps, ImportNexoFileCommand } from '../initNexoImport/importNexoFileCommand';

export interface IUploadNexoFileProps extends IImportNexoFileProps {
  id: string;
}

export class UploadNexoFileCommand extends ImportNexoFileCommand<IUploadNexoFileProps> {
  public static create(props: IUploadNexoFileProps): Result<UploadNexoFileCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<UploadNexoFileCommand>(guard);
    }
    const uploadNexoFileCommand = new UploadNexoFileCommand(props);
    return Result.ok<UploadNexoFileCommand>(uploadNexoFileCommand);
  }

  public static guard(props: IUploadNexoFileProps) {
    const guardNexoImportFile = ImportNexoFileCommand.guard(props);
    const guardNexoImportId = Guard.guard({
      argument: props.id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
    });
    return Guard.combine([guardNexoImportFile, guardNexoImportId]);
  }

  public get id(): string {
    return this.props.id;
  }
}
