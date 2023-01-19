import { GenericEntity } from './genericEntity';
export class Command<C> extends GenericEntity<C> {
  public constructor(props: C) {
    super(props);
  }
}
