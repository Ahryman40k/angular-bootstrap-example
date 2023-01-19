import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, forEach, isArray, isEmpty, isObject, mergeWith, uniq } from 'lodash';
import { Aggregate, Document, Types } from 'mongoose';

import { constants } from '../../../config/constants';
import { db } from '../../features/database/DB';
import { MongoDatabase } from '../../features/database/mongo/mongoDatabase';
import { IHistoryOptions } from '../../features/history/mongo/historyRepository';
import { isEntity } from '../../shared/domain/entity';
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { FindOptions, IFindOptionsProps } from '../../shared/findOptions/findOptions';
import { Order, OrderByCriteria } from '../../shared/findOptions/orderByCriteria';
import { Result } from '../../shared/logic/result';
import { createLogger } from '../../utils/logger';
import { appUtils } from '../../utils/utils';
import { CustomModel } from '../mongo/customModel';

const logger = createLogger('BaseRepository');

export interface ISaveOptions {
  expand?: string[];
  history?: IHistoryOptions;
  ordered?: boolean;
  upsert?: boolean;
}

export interface IValidationError {
  name: string;
  message: string;
}

export interface ISaveBulkResult<T> {
  savedObjects?: T[];
  validationErrors?: IValidationError[];
}

export interface IBaseRepository<T, F extends FindOptions<IFindOptionsProps>> {
  save(model: T, options?: ISaveOptions): Promise<Result<T>>;

  saveBulk(model: T[], options?: ISaveOptions): Promise<Result<ISaveBulkResult<T>>>;

  distinct(field: string, filter: any): Promise<string[]>;

  findById(id: number | string, expand?: string[]): Promise<T>;

  findAll(findOptions: F): Promise<T[]>;

  findPaginated(findOptions: F): Promise<IResultPaginated<T>>;

  delete(findOptions: F, options?: IHistoryOptions): Promise<Result<number>>;

  count(findOptions: F): Promise<any>;

  countBy(findOptions: F): Promise<ICountBy[]>;

  findOne(findOptions: F): Promise<T>;

  history(operation: 'create' | 'update' | 'delete', current: T, incoming: T, options?: IHistoryOptions): Promise<void>;
}

export interface IResultPaginated<T> {
  items: T[];
  paging: {
    limit: number;
    offset: number;
    totalCount: number;
    itemCount: number;
  };
}

/**
 * Implementation of DAO interface (currently using mongoose)
 */
export abstract class BaseRepository<T, Q extends Document, F extends FindOptions<IFindOptionsProps>>
  implements IBaseRepository<T, F> {
  protected db: MongoDatabase;
  protected stringId = true;
  protected matchBuilder: BaseMatchBuilder<any>;

  constructor() {
    this.db = db();
  }

  protected get preserveIdentifiersKeys(): any[] {
    return [];
  }

  public abstract get model(): CustomModel<Q>;
  protected async toDomainModel(raw: any, expand?: string[]): Promise<T> {
    return this.normalizeData(raw);
  }

  protected toPersistence(t: T): any {
    return t;
  }

  public async history(
    operation: 'create' | 'update' | 'delete',
    current: T,
    incoming: T,
    options?: IHistoryOptions
  ): Promise<void> {
    return;
  }

  public async distinct(field: string, filter: any): Promise<string[]> {
    return this.model
      .distinct(field, filter)
      .lean()
      .exec();
  }

  protected async preSave(obj: T): Promise<Result<any>> {
    return Result.ok();
  }
  /**
   * Creates/Update a record
   * @param obj
   * @returns {Promise<T>} promise of fully qualified record
   */
  public async save(obj: T, options?: ISaveOptions): Promise<Result<T>> {
    let entity: T;
    try {
      const stepsResults: Result<any> = await this.preSave(obj);
      if (stepsResults.isFailure) {
        logger.error(
          stepsResults.errorValue(),
          `${this.constructor.name} error while presaving ${JSON.stringify(this.toPersistence(obj))}`
        );
        return Result.fail<T>(stepsResults.errorValue());
      }
      let objId = this.getObjectIdentifier(obj);
      let current: T;
      if (objId) {
        current = await this.findById(objId);
      }
      if (current) {
        await this.update(current, obj, options?.history);
      } else {
        objId = (await this.create(obj, options?.history))._id;
      }
      entity = await this.findById(objId, options?.expand);
    } catch (error) {
      logger.error(error, `${this.constructor.name} error while saving ${JSON.stringify(this.toPersistence(obj))}`);
      return Result.fail<T>(error);
    }
    return Result.ok<T>(entity);
  }

  // Beware that saveBulk is to be used sparingly as it does not trigger
  // as much elements as basic save
  // In short, saveBulk is used for importing
  public async saveBulk(objs: T[], options?: ISaveOptions): Promise<Result<ISaveBulkResult<T>>> {
    if (isEmpty(objs)) {
      return Result.ok({
        savedObjects: objs
      });
    }
    let createdResults: ISaveBulkResult<Q>;
    const saveOptions: ISaveOptions = {
      upsert: true,
      ...options
    };
    let entities: T[];
    try {
      let createdIds: string[] = [];
      let existings: T[] = [];
      // if upsert, search for existing objects
      if (saveOptions.upsert) {
        const objIds = objs.map(o => this.getObjectIdentifier(o));
        if (!isEmpty(objIds)) {
          const findAllByObjIdsOptions = FindOptions.create({
            criterias: {
              id: objIds
            }
          }).getValue();
          existings = await this.findAll(findAllByObjIdsOptions);
        }
      }

      // get objs that are not in existing results
      const objsToCreate = objs
        .map(obj => {
          if (!existings.map(e => this.getObjectIdentifier(e)).includes(this.getObjectIdentifier(obj))) {
            return obj;
          }
          return undefined;
        })
        .filter(o => o);

      if (!isEmpty(existings)) {
        await Promise.all(
          existings.map(async current => {
            const obj = objs.find(o => this.getObjectIdentifier(current) === this.getObjectIdentifier(o));
            await this.update(current, obj, saveOptions?.history);
          })
        );
      }

      if (!isEmpty(objsToCreate)) {
        createdResults = await this.createBulk(objsToCreate);
        createdIds = createdResults?.savedObjects.map(o => o._id);
      }

      // reorder created and updated as inputOrder
      const finalIdsArray = [...existings.map(e => this.getObjectIdentifier(e)), ...createdIds];

      const orderedIds = appUtils.concatArrayOfArrays(
        objs.map(obj => finalIdsArray.find(id => id === `${this.getObjectIdentifier(obj)}`))
      );

      const findAllOptions = FindOptions.create({
        criterias: {
          id: orderedIds
        }
      }).getValue();
      entities = await this.findAll(findAllOptions);
    } catch (error) {
      logger.error(
        error,
        `${this.constructor.name} error while saving bulk ${objs.map(obj => this.toPersistence(obj))}`
      );
      return Result.fail<ISaveBulkResult<T>>(error);
    }
    return Result.ok<ISaveBulkResult<T>>({
      savedObjects: entities,
      validationErrors: createdResults?.validationErrors
    });
  }

  protected preUpdate(current: any, incoming: any): any {
    return mergeWith(current, incoming, (objValue, srcValue, key) => {
      if (this.preserveIdentifiersKeys.includes(key)) {
        this.preserveIdentifiers(srcValue); // Preserve identifiers
      }
      if (isArray(objValue)) {
        return srcValue; // Replaces the incoming array "as is"
      }
    });
  }

  protected markModified(updated: Document): Document {
    return updated;
  }

  protected async create(obj: T, historyOptions?: IHistoryOptions): Promise<Q> {
    const created = await this.model.create(this.toPersistence(obj));
    const historyObjectCreate = isEntity(obj) ? obj : { ...obj, id: created._id };
    await this.history('create', null, historyObjectCreate, historyOptions);
    return created;
  }

  // Return created ids
  private async createBulk(objs: T[], historyOptions?: IHistoryOptions): Promise<ISaveBulkResult<Q>> {
    const objsToPersist = objs.map(obj => this.toPersistence(obj));
    // TODO does insertMany use plugin to convert string to ObjectId ? Or do we have to specifically do it ?
    const result = await this.model.insertMany(objsToPersist, {
      ordered: false,
      rawResult: true
    });
    const savedObjects: any = (result as any)?.ops;
    const validationErrors = (result as any)?.mongoose?.validationErrors?.map(
      (item: any) => ({ name: item.name, message: item.message } as IValidationError)
    );
    return { savedObjects, validationErrors };
  }
  /**
   * Updates a document based on its id
   * @param obj
   * @param id
   * @returns {Promise<T>}
   */
  protected async update(current: T, obj: T, historyOptions?: IHistoryOptions): Promise<void> {
    const toSave = this.preUpdate(this.toPersistence(cloneDeep(current)), this.toPersistence(cloneDeep(obj)));
    await this.model.replaceOne({ _id: this.getObjectIdentifier(current) }, toSave).exec();
    await this.history('update', current, toSave, historyOptions);
  }

  public async findById(id: string, expand: string[] = []): Promise<T> {
    const aggregate = this.model.aggregate();
    aggregate.match({
      // tslint:disable:no-boolean-literal-compare
      _id: this.model.hasObjectId === false ? id : Types.ObjectId(id)
    });
    this.model.lookups(aggregate, expand);
    const found = await aggregate.exec();
    return !isEmpty(found) ? this.toDomainModel(found[0], expand) : null;
  }

  private async find(findOptions: F, filter?: any): Promise<T[]> {
    let match: any = {};
    match = filter ? filter : await this.getMatchFromQueryParams(findOptions.criterias);
    const expand: string[] = findOptions.expandOptions.map(expandValue => expandValue.field);
    const aggregate = this.model.aggregate();
    aggregate.match(match);
    this.model.lookups(aggregate, expand);
    this.setSort(aggregate, findOptions.orderByCriterias);
    if (!isEmpty(findOptions.fields)) {
      aggregate.project(this.getProjection(findOptions.fields));
    }
    if (findOptions.offset) {
      aggregate.skip(findOptions.offset);
    }
    if (findOptions.limit) {
      aggregate.limit(findOptions.limit);
    }
    const items = await this.model.aggregate(aggregate.pipeline()).exec();

    return Promise.all(items.map(async (item: T) => this.toDomainModel(item, expand)));
  }

  public async count(findOptions: F, filter?: any): Promise<any> {
    let match: any = {};
    match = filter ? filter : await this.getMatchFromQueryParams(findOptions.criterias);
    return this.model
      .count(match)
      .lean()
      .exec();
  }

  public async findPaginated(findOptions: F): Promise<IResultPaginated<T>> {
    const match = await this.getMatchFromQueryParams(findOptions.criterias);
    const items = await this.find(findOptions, match);
    return {
      paging: {
        totalCount: await this.count(findOptions, match),
        itemCount: items.length,
        offset: findOptions.offset,
        limit: findOptions.limit
      },
      items
    };
  }

  public async findAll(findOptions: F): Promise<T[]> {
    findOptions.setOffset(undefined);
    findOptions.setLimit(undefined);
    return this.find(findOptions);
  }

  public async findOne(findOptions: F): Promise<T> {
    findOptions.setOffset(0);
    findOptions.setLimit(1);
    return (await this.find(findOptions)).find(item => item);
  }

  /**
   * Removes a document by its ID
   * @param id
   * @returns {Promise<T>}
   */
  public async delete(findOptions: F, options?: IHistoryOptions): Promise<Result<number>> {
    const historyOptions: IHistoryOptions = {
      applyHistory: true,
      ...options
    };
    const filter = await this.getMatchFromQueryParams(findOptions.criterias);
    let current = null;
    let deleted = null;
    try {
      if (historyOptions.applyHistory) {
        current = await this.findOne(findOptions);
        if (!current) {
          return Result.ok(0);
        }
        // TODO remove as any when T is an entity
        deleted = { id: (current as any).id } as any;
      }
      // On delete is done before deleting elements
      await this.onDelete(findOptions);

      let nbDeleted = 0;
      nbDeleted = (
        await this.model
          .deleteMany(filter)
          .lean()
          .exec()
      ).ok;
      if (historyOptions.applyHistory) {
        await this.history('delete', current, deleted, historyOptions);
      }
      return Result.ok(nbDeleted);
    } catch (error) {
      logger.error(error, `${this.constructor.name} error while deleting entity id ${findOptions.criterias.id}`);
      return Result.fail<number>(error);
    }
  }

  protected async onDelete(findOptions: F, options?: IHistoryOptions): Promise<Result<any>> {
    return Result.ok();
  }

  /**
   * Normalizes the ID of document by converting _id:ObjectId to id:string which can be used for get(:id)
   * @param data
   * @returns {T[]|Object|[Object]|T}
   */
  protected normalizeData(data: any): any {
    const d = this.normalizeId(data);
    if (isArray(d)) {
      return d.map(x => (x ? this.normalize(x) : x));
    }
    return d ? this.normalize(d) : d;
  }

  private normalizeId(data: any): any {
    if (this.stringId && data != null) {
      if (isArray(data)) {
        for (let i = 0; i < (data as T[]).length; i++) {
          this.normalizeId(data[i]);
        }
      } else if (isObject(data)) {
        for (const p in data) {
          if (p === '_id') {
            (data as any).id = (data as any)._id.toString();
            delete (data as any)._id;
          } else {
            this.normalizeId(data[p]);
          }
        }
      }
    }
    return data;
  }

  /**
   * Normalizes the data.
   * Override this function to apply any data adjustments.
   * @param data The data
   */
  protected normalize(data: T): T {
    return data;
  }

  /**
   * Adds an '_id' property to the object with the same value of an existing 'id' property,
   * in order to prevent Mongoose fromm generating a new guid value for its '_id' property.
   * In other words, Mongoose will not generate a new guid value for the '_id' property if
   * it sees that one already exists.
   * @param array
   */
  protected preserveIdentifiers(array: any): void {
    forEach(array, item => {
      if (item.hasOwnProperty('id')) {
        item._id = item.id;
      }
    });
  }

  /**
   * Gets the object identifier.
   * If an ID has not been specified, we try to retrieve it from the object itself.
   * @param obj The object.
   * @param id The default identifier. (optional)
   */
  protected getObjectIdentifier(obj: T, id?: string): string {
    return id || (obj as any)?.id || (obj as any)?._id;
  }

  public async countBy(findOptions: F): Promise<ICountBy[]> {
    if (isEmpty(findOptions.countBy)) {
      return [];
    }
    const aggregate = this.model.aggregate<ICountBy>();
    aggregate.match(await this.getMatchFromQueryParams(findOptions.criterias));
    aggregate.group({
      _id: '$' + findOptions.countBy,
      count: { $sum: 1 }
    });
    aggregate.project({
      _id: 0,
      id: '$_id',
      count: 1
    });
    return this.model.aggregate(aggregate.pipeline()).exec();
  }

  protected async getMatchFromQueryParams(criterias: any): Promise<any> {
    return {};
  }

  protected getSortCorrespondance(): any[] {
    return [
      { param: 'id', dbName: '_id' },
      { param: 'createdAt', dbName: 'audit.createdAt' },
      { param: 'modifiedAt', dbName: 'audit.modifiedAt' }
    ];
  }

  public setSort(aggregate: Aggregate<any>, orderBys: OrderByCriteria[]): any {
    const TAXONOMY_LABEL = 'label.fr';
    const sortCorrespondence = this.getSortCorrespondance();
    if (isEmpty(orderBys)) {
      orderBys.push(this.getDefaultOrderBy());
    }
    const projectValue = {};
    const sortValue = {};
    for (const [index, orderBy] of orderBys.entries()) {
      const validSort = sortCorrespondence.find(entry => entry.param === orderBy.field);
      if (validSort) {
        if (validSort.taxonomyGroup) {
          const alias = `${orderBy.field}_${index}`;
          const sortKey = `${orderBy.field}_${index}.${TAXONOMY_LABEL}`;
          const codeMatch = validSort.isArray ? { $in: ['$code', '$$code'] } : { $eq: ['$code', '$$code'] };
          aggregate.lookup({
            from: constants.mongo.collectionNames.TAXONOMIES,
            let: {
              code: `$${validSort.dbName}`
            },
            pipeline: [
              {
                $match: {
                  $expr: { $and: [codeMatch, { $eq: ['$group', validSort.taxonomyGroup] }] }
                }
              }
            ],
            as: alias
          });
          aggregate.sort({
            [sortKey]: orderBy.order
          });
          projectValue[alias] = 0;
        } else {
          sortValue[validSort.dbName] = orderBy.order;
        }
        continue;
      }
      sortValue[orderBy.field] = orderBy.order;
    }
    if (!isEmpty(projectValue)) {
      aggregate.project(projectValue);
    }
    if (!isEmpty(sortValue)) {
      aggregate.sort(sortValue);
    }
  }

  protected getDefaultOrderBy(): OrderByCriteria {
    return OrderByCriteria.create({
      field: 'id',
      order: Order.DESCENDING
    }).getValue();
  }

  protected getProjection(fields: string[], entityMandatoryFields: string[] = []): any {
    // Always get _id and audit
    const projection = {
      _id: 1,
      audit: 1
    };
    uniq([...fields, ...entityMandatoryFields])
      .filter(field => !isEmpty(field))
      .forEach(field => {
        projection[field] = 1;
      });
    return projection;
  }
}
export default BaseRepository;
