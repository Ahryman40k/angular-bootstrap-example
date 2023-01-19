import { IImportFileProps } from '../../../../shared/domain/useCases/importFileCommand';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { UploadFile } from '../../../../shared/upload/uploadFile';
import { IPlainDocumentProps, PlainDocument } from '../../models/plainDocument';

export interface IUpsertDocumentCommandProps extends IPlainDocumentProps, IImportFileProps {
  id: string;
}

export abstract class UpsertDocumentCommand<P extends IUpsertDocumentCommandProps> extends PlainDocument<P> {
  public static guard(
    props: IUpsertDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardEntityId: IGuardResult = Guard.guard({
      argument: props.id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, entityIdGuardType]
    });
    return Guard.combine([guardEntityId]);
  }

  public get id(): string {
    return this.props.id;
  }

  public setDocumentName(name: string): void {
    this.props.documentName = name;
  }

  public get file(): UploadFile {
    return this.props.file;
  }

  // Override the same method in plainDocument
  public get fileName(): string {
    return this.props.file?.originalname;
  }
}
