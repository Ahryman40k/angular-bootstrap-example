import { isEqual } from 'lodash';
import { Types } from 'mongoose';

import { GenericEntity } from './genericEntity';

export abstract class Entity<T> extends GenericEntity<T> {
  private readonly _id: string;

  constructor(props: T, id: string) {
    super(props);
    this._id = getId(id);
  }

  get id(): string {
    return this._id;
  }

  get entityName(): string {
    return this.constructor.name.toLowerCase();
  }

  public equals(object?: Entity<T>): boolean {
    if (!object) {
      return false;
    }
    // TODO: Demander à Simon ce qu'on voulait faire dans cette partie du code. On a changé de === à isEqual, car la comparaison ne marchait pas avec deux assets
    if (isEqual(this, object)) {
      return true;
    }

    if (!isEntity(object)) {
      return false;
    }

    return this._id === object._id;
  }
}

export const isEntity = (v: any): v is Entity<any> => {
  return v instanceof Entity;
};

// TODO
// Is there a way to not import Mongoose here ?
export const getId = (id?: string) => {
  return id ? id : Types.ObjectId().toString();
};

// Only use with mongo entity
export const toPersistanceMongoId = (id: any) => {
  let _id = id ? id : Types.ObjectId();
  if (typeof _id === 'string') {
    _id = Types.ObjectId(_id);
  }
  return _id;
};
