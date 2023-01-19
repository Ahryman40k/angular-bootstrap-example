import { DocumentStatus, DocumentType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { toPersistanceMongoId } from '../../../shared/domain/entity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { auditable } from '../../../shared/mixins/mixins';
import { Audit } from '../../audit/audit';
import { IAuditableProps } from '../../audit/auditable';
import { IDocumentMongoAttributes } from '../mongo/documentSchema';
import { DocumentIntervention } from './documentIntervention';
import { IPlainDocumentProps, PlainDocument } from './plainDocument';

export interface IDocumentProps extends IPlainDocumentProps, IAuditableProps {
  objectId: string;
}

export class Document extends auditable(PlainDocument)<IDocumentProps> {
  public static create(props: IDocumentProps, id?: string): Result<Document> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<Document>(guard);
    }
    const document = new Document(props, id);
    return Result.ok<Document>(document);
  }

  public static async toDomainModel(raw: IDocumentMongoAttributes): Promise<Document> {
    return Document.create(await this.mapToDomainModel(raw), raw._id?.toString()).getValue();
  }

  public static async mapToDomainModel(raw: IDocumentMongoAttributes): Promise<IDocumentProps> {
    return {
      objectId: raw.objectId,
      fileName: raw.fileName,
      documentName: raw.documentName,
      notes: raw.notes,
      validationStatus: raw.validationStatus as DocumentStatus,
      type: raw.type as DocumentType,
      audit: await Audit.toDomainModel(raw.audit)
    };
  }

  public static toPersistance(document: Document): IDocumentMongoAttributes {
    return {
      _id: toPersistanceMongoId(document.id),
      objectId: document.objectId,
      fileName: document.fileName,
      documentName: document.documentName,
      notes: document.notes,
      type: document.type,
      validationStatus: document.validationStatus,
      audit: Audit.toPersistance(document.audit)
    };
  }

  protected static guard(props: IDocumentProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.objectId,
        argumentName: 'objectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([PlainDocument.guard(props), Audit.guard(props.audit), ...Guard.guardBulk(guardBulk)]);
  }

  constructor(props: IDocumentProps, id: string) {
    if (!props.validationStatus) {
      props.validationStatus = DocumentStatus.validated;
    }
    if (!props.type) {
      props.type = DocumentType.other;
    }
    super(props, id);
  }

  public get objectId(): string {
    return this.props.objectId;
  }
}

export const isDocument = (v: any): v is Document => {
  return v instanceof Document || v instanceof DocumentIntervention;
};
