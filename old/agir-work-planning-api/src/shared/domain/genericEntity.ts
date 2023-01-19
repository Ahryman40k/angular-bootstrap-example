import { isEqual } from 'lodash';

export type Constructor<T> = new (...args: any[]) => T;
export abstract class GenericEntity<C> {
  public readonly props: C;
  protected constructor(props: C) {
    this.props = props;
  }

  public equals(object?: GenericEntity<C>): boolean {
    return isEqual(this, object);
  }
}
