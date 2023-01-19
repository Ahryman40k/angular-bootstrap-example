import { NexoFileType } from '@villemontreal/agir-work-planning-lib';
import { IImportFileProps, ImportFileCommand } from '../../../../shared/domain/useCases/importFileCommand';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { UploadFile } from '../../../../shared/upload/uploadFile';
import { enumValues } from '../../../../utils/enumUtils';

export interface IImportNexoFileProps extends IImportFileProps {
  // should also extends IPlainNexoImportFile but file is a binary string in openapi and cant be changed due to open api specs
  fileType: NexoFileType;
  file: UploadFile;
}

export class ImportNexoFileCommand<P extends IImportNexoFileProps> extends ImportFileCommand<P> {
  public static create(props: IImportNexoFileProps): Result<ImportNexoFileCommand<IImportNexoFileProps>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ImportNexoFileCommand<IImportNexoFileProps>>(guard);
    }
    const importNexoFileCommand = new ImportNexoFileCommand(props);
    return Result.ok<ImportNexoFileCommand<IImportNexoFileProps>>(importNexoFileCommand);
  }

  public static guard(props: IImportNexoFileProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.fileType,
        argumentName: 'fileType',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(NexoFileType)
      }
    ];

    return Guard.combine([ImportFileCommand.guard(props), ...Guard.guardBulk(guardBulk)]);
  }

  public get fileType(): NexoFileType {
    return this.props.fileType;
  }
}
