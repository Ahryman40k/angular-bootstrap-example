/**
 * Plugin is an adaptation of mongoose-diff-history : https://www.npmjs.com/package/mongoose-diff-history
 * It is require to adapt the plugin to get mongoose connection
 */
import { getMongooseConnection } from '@villemontreal/core-utils-mongo-nodejs-lib/dist/src';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import { createLogger } from '../../../utils/logger';

const { Schema } = mongoose;

const logger = createLogger('mongooseDiffHistory');

interface IHistory extends mongoose.Document {
  id: string;
  collectionName: string;
  collectionId: string;
  diff: any;
  user: any;
  reason: string;
  version: number;
}

/* tslint:disable */
const { assign } = require('power-assign');
const empty = require('deep-empty-object');

// try to find an id property, otherwise just use the index in the array
const objectHash = (obj: any, idx: any) => obj._id || obj.id || `$$index: ${idx}`;
const diffPatcher = require('jsondiffpatch').create({ objectHash });

const historySchema = new Schema(
  {
    collectionName: String,
    collectionId: String,
    diff: {},
    user: {},
    reason: String,
    version: { type: Number, min: 0 }
  },
  {
    timestamps: true
  }
);

const isValidCb = (cb: any) => {
  return cb && typeof cb === 'function';
};

// https://eslint.org/docs/rules/complexity#when-not-to-use-it
/* eslint-disable complexity */
function checkRequired(opts: any, queryObject: any, updatedObject?: any): boolean | void {
  if (queryObject && !queryObject.options && !updatedObject) {
    return;
  }
  const { __user: user, __reason: reason } = (queryObject && queryObject.options) || updatedObject;
  if (opts.required && ((opts.required.includes('user') && !user) || (opts.required.includes('reason') && !reason))) {
    return true;
  }
}

function saveDiffObject(currentObject: any, original: any, updated: any, opts: any, queryObject?: any): any {
  const { __user: user, __reason: reason, __session: session } = (queryObject && queryObject.options) || currentObject;

  let diff = diffPatcher.diff(JSON.parse(JSON.stringify(original)), JSON.parse(JSON.stringify(updated)));

  if (opts.pick) {
    diff = _.pick(diff, opts.pick);
  }

  if (!diff || !Object.keys(diff).length || empty.all(diff)) {
    return;
  }

  const collectionId = currentObject._id;
  const collectionName = currentObject.constructor.modelName || queryObject.model.modelName;
  return historyModel()
    .findOne({ collectionId, collectionName })
    .sort('-version')
    .then((lastHistory: any) => {
      const history = {
        collectionId,
        collectionName,
        diff,
        user,
        reason,
        version: lastHistory ? lastHistory.version + 1 : 0
      };
      if (session) {
        return historyModel().create({ session });
      }
      return historyModel().create(history);
    });
}
/* eslint-disable complexity */

const saveDiffHistory = (queryObject: any, currentObject: any, opts: any) => {
  const update = JSON.parse(JSON.stringify(queryObject._update));
  const updateParams: any[] = Object.keys(update).map((key: string) => {
    if (typeof update[key] === 'object') {
      return update[key];
    }
    return update;
  });
  delete queryObject._update['$setOnInsert'];
  const dbObject = _.pick(currentObject, Object.keys(updateParams));
  return saveDiffObject(currentObject, dbObject, assign(dbObject, queryObject._update), opts, queryObject);
};

const saveDiffs = (queryObject: any, opts: any): any =>
  queryObject
    .find(queryObject._conditions)
    .lean(false)
    .cursor()
    .eachAsync((result: any) => saveDiffHistory(queryObject, result, opts));

const getVersion: any = (model: any, id: any, version: any, queryOpts: any, cb: any) => {
  if (typeof queryOpts === 'function') {
    cb = queryOpts;
    queryOpts = undefined;
  }

  return model
    .findById(id, null, queryOpts)
    .then((latest: any) => {
      latest = latest || {};
      return historyModel()
        .find(
          {
            collectionName: model.modelName,
            collectionId: id,
            version: { $gte: parseInt(version, 10) }
          },
          { diff: 1, version: 1 },
          { sort: '-version' }
        )
        .lean()
        .cursor()
        .eachAsync((history: any) => {
          diffPatcher.unpatch(latest, history.diff);
        })
        .then(() => {
          if (isValidCb(cb)) {
            return cb(null, latest);
          }
          return latest;
        });
    })
    .catch((err: any) => {
      if (isValidCb(cb)) {
        return cb(err, null);
      }
      throw err;
    });
};

const getDiffs = (modelName: any, id: any, opts: any, cb: any): any => {
  opts = opts || {};
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  return historyModel()
    .find({ collectionName: modelName, collectionId: id }, null, opts)
    .lean()
    .then((histories: any) => {
      if (isValidCb(cb)) {
        return cb(null, histories);
      }
      return histories;
    })
    .catch((err: any) => {
      if (isValidCb(cb)) {
        return cb(err, null);
      }
      throw err;
    });
};

const getHistories = (modelName: any, id: any, expandableFields: any, cb: any): any => {
  expandableFields = expandableFields || [];
  if (typeof expandableFields === 'function') {
    cb = expandableFields;
    expandableFields = [];
  }

  const histories: any[] = [];

  return historyModel()
    .find({ collectionName: modelName, collectionId: id })
    .lean()
    .cursor()
    .eachAsync((history: any) => {
      const changedValues = [];
      const changedFields = [];
      for (const key in history.diff) {
        if (history.diff.hasOwnProperty(key)) {
          if (expandableFields.indexOf(key) > -1) {
            const oldValue = history.diff[key][0];
            const newValue = history.diff[key][1];
            changedValues.push(key + ' from ' + oldValue + ' to ' + newValue);
          } else {
            changedFields.push(key);
          }
        }
      }
      const comment = 'modified ' + changedFields.concat(changedValues).join(', ');
      histories.push({
        changedBy: history.user,
        changedAt: history.createdAt,
        updatedAt: history.updatedAt,
        reason: history.reason,
        comment
      });
    })
    .then(() => {
      if (isValidCb(cb)) {
        return cb(null, histories);
      }
      return histories;
    })
    .catch((err: any) => {
      if (isValidCb(cb)) {
        return cb(err, null);
      }
      throw err;
    });
};

/**Object.keys(update) as any
 * @param {Object} schema - Schema object passed by Mongoose Schema.plugin
 * @param {Object} [opts] - Options passed by Mongoose Schema.plugin
 * @param {string} [opts.uri] - URI for MongoDB (necessary, for instance, when not using mongoose.connect).
 */
export const plugin = function lastModifiedPlugin(schema: any, opts: any = {}): any {
  if (opts.uri) {
    const mongoVersion = parseInt(mongoose.version);
    if (mongoVersion < 5) {
      mongoose.connect(opts.uri, { useMongoClient: true }).catch((e: any) => {
        logger.error('mongoose-diff-history connection error:', e);
      });
    } else {
      mongoose.connect(opts.uri, { useNewUrlParser: true }).catch((e: any) => {
        logger.error('mongoose-diff-history connection error:', e);
      });
    }
  }

  schema.pre('save', function(next: any): any {
    if (this.isNew) {
      return next();
    }
    this.constructor
      .findOne({ _id: this._id })
      .then((original: any) => {
        if (checkRequired(opts, {}, this)) {
          return;
        }
        return saveDiffObject(this, original, this.toObject({ depopulate: true }), opts);
      })
      .then(() => next())
      .catch(next);
  });

  schema.pre('findOneAndUpdate', function(next: any) {
    if (checkRequired(opts, this)) {
      return next();
    }
    saveDiffs(this, opts)
      .then(() => next())
      .catch(next);
  });

  schema.pre('update', function(next: any) {
    if (checkRequired(opts, this)) {
      return next();
    }
    saveDiffs(this, opts)
      .then(() => next())
      .catch(next);
  });

  schema.pre('updateOne', function(next: any) {
    if (checkRequired(opts, this)) {
      return next();
    }
    saveDiffs(this, opts)
      .then(() => next())
      .catch(next);
  });

  schema.pre('remove', function(next: any) {
    if (checkRequired(opts, this)) {
      return next();
    }
    saveDiffObject(this, this, {}, opts)
      .then(() => next())
      .catch(next);
  });
};

let _historyModel: mongoose.Model<IHistory>;
function historyModel(): mongoose.Model<IHistory> {
  if (!_historyModel) {
    _historyModel = getMongooseConnection().model<IHistory>('historicals', historySchema);
  }
  return _historyModel;
}

module.exports = {
  plugin,
  getVersion,
  getDiffs,
  getHistories
};
