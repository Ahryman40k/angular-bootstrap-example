import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Constructor } from '../../../shared/domain/genericEntity';
import { Document } from './document';

export interface IDocumentableProps {
  documents?: Document[];
}

interface IDocumentable {
  documents: Document[];
}

// tslint:disable:function-name
export function Documentable<T extends Constructor<AggregateRoot<IDocumentableProps>>>(
  base: T
): T & Constructor<IDocumentable> {
  return class extends base {
    public get documents(): Document[] {
      return this.props.documents || [];
    }

    public set documents(documents: Document[]) {
      this.props.documents = documents;
    }
  };
}
