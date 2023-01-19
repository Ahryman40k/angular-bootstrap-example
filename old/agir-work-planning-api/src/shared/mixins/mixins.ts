import { Auditable, IAuditableProps } from '../../features/audit/auditable';
import { Commentable, ICommentableProps } from '../../features/comments/models/commentable';
import { Documentable, IDocumentableProps } from '../../features/documents/models/documentable';
import { AggregateRoot } from '../domain/aggregateRoot';
import { Constructor } from '../domain/genericEntity';

export const auditable = <T extends Constructor<AggregateRoot<IAuditableProps>>>(ctor: T) => Auditable(ctor);
export const commentable = <T extends Constructor<AggregateRoot<ICommentableProps>>>(ctor: T) => Commentable(ctor);
export const documentable = <T extends Constructor<AggregateRoot<IDocumentableProps>>>(ctor: T) => Documentable(ctor);
export const commentableAuditable = <T extends Constructor<AggregateRoot<any>>>(ctor: T) =>
  commentable(auditable(ctor));
export const documentableAuditable = <T extends Constructor<AggregateRoot<any>>>(ctor: T) =>
  documentable(auditable(ctor));
export const documentableCommentableAuditable = <T extends Constructor<AggregateRoot<any>>>(ctor: T) =>
  documentable(commentable(auditable(ctor)));
