import { DocumentStatus, DocumentType } from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { IImportFileMetaProps } from '../../../shared/domain/useCases/importFileCommand';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IPlainDocumentProps extends IImportFileMetaProps {
  documentName: string;
  notes?: string;
  type?: DocumentType;
  validationStatus?: DocumentStatus;
}

export class PlainDocument<P extends IPlainDocumentProps> extends AggregateRoot<P> {
  public static create(props: IPlainDocumentProps): Result<PlainDocument<IPlainDocumentProps>> {
    const guardPlain = this.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainDocument<IPlainDocumentProps>>(guard);
    }
    const plainDocument = new PlainDocument(props);
    return Result.ok<PlainDocument<IPlainDocumentProps>>(plainDocument);
  }

  protected static guard(props: IPlainDocumentProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.fileName,
        argumentName: 'fileName',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.documentName,
        argumentName: 'documentName',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.notes,
        argumentName: 'notes',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.validationStatus,
        argumentName: 'validationStatus',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(DocumentStatus)
      }
    ];

    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  constructor(props: P, id: string = null) {
    super(props, id);
  }

  public get type(): DocumentType {
    return this.props.type;
  }

  public get fileName(): string {
    return this.props.fileName;
  }

  public get documentName(): string {
    return this.props.documentName;
  }

  public get notes(): string {
    return this.props.notes;
  }

  public get validationStatus(): DocumentStatus {
    return this.props.validationStatus;
  }
}
