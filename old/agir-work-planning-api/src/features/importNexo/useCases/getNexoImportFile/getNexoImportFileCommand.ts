import { IUuid } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface INexoGetFileProps {
  nexoLogId: IUuid;
  nexoFileId: string;
}

export class GetNexoImportFileCommand<P extends INexoGetFileProps> extends Command<P> {
  public static create(props: INexoGetFileProps): Result<GetNexoImportFileCommand<INexoGetFileProps>> {
    const guards = Guard.guardBulk([
      {
        argument: props.nexoLogId,
        argumentName: 'nexoLogId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      },
      {
        argument: props.nexoFileId,
        argumentName: 'nexoFileId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ]);
    const combinedGuards = Guard.combine(guards);
    if (!combinedGuards.succeeded) {
      return Result.fail<GetNexoImportFileCommand<INexoGetFileProps>>(combinedGuards);
    }
    const getNexoImportFileCommand = new GetNexoImportFileCommand(props);
    return Result.ok<GetNexoImportFileCommand<INexoGetFileProps>>(getNexoImportFileCommand);
  }

  public get nexoLogId(): IUuid {
    return this.props.nexoLogId;
  }

  public get nexoFileId(): IUuid {
    return this.props.nexoFileId;
  }
}
