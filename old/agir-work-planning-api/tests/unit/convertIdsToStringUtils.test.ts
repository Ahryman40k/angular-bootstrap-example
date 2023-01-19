import { assert } from 'chai';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import { convertIdsToString } from '../../src/utils/convertIdsToStringUtils';

describe('Convert ids to string unit tests', () => {
  let doc: any;
  let paths: string[];
  before(() => {
    doc = {
      aString: 'test',
      annualDistributionId: mongoose.Types.ObjectId('5ef100f54ba31549740f19ee'),
      interventionIds: [
        mongoose.Types.ObjectId('5ef102361cf1e9a0c55c4750'),
        mongoose.Types.ObjectId('5ef102841cf1e9a0c55c476e')
      ],
      projects: [
        {
          id: mongoose.Types.ObjectId('5ef102a81cf1e9a0c55c477a'),
          categories: [
            { subCategoryId: mongoose.Types.ObjectId('5ef102c91cf1e9a0c55c4787') },
            { subCategoryId: mongoose.Types.ObjectId('5f0733afbfc389129a0fc984') }
          ]
        },
        {
          id: mongoose.Types.ObjectId('5f0733d7bfc389129a0fc990'),
          categories: [
            { subCategoryId: mongoose.Types.ObjectId('5f0733f8bfc389129a0fc99d') },
            { subCategoryId: mongoose.Types.ObjectId('5f0db17597eac90b14dfec04') }
          ]
        }
      ]
    };
  });
  describe('Tests convert object id to string', () => {
    it('C64219 - Positive - Convert object id on top level property to string', () => {
      paths = ['annualDistributionId'];
      const cloneDoc = _.cloneDeep(doc);
      convertIdsToString(cloneDoc, paths, (id: mongoose.Types.ObjectId) => id.toString());
      assert.strictEqual(cloneDoc.annualDistributionId, doc.annualDistributionId.toString());
    });

    it('C64220 - Positive - Convert object id to a subproperty of an object array', () => {
      paths = ['projects.categories.subCategoryId'];
      const cloneDoc = _.cloneDeep(doc);
      convertIdsToString(cloneDoc, paths, (id: mongoose.Types.ObjectId) => id.toString());
      (cloneDoc.projects as any[]).forEach((project, idx) => {
        (project.categories as any[]).forEach((category, index) => {
          assert.strictEqual(category.subCategoryId, doc.projects[idx].categories[index].subCategoryId.toString());
        });
      });
    });

    it('C64221 - Positive - Convert object id array to string array', () => {
      paths = ['interventionIds'];
      const cloneDoc = _.cloneDeep(doc);
      convertIdsToString(cloneDoc, paths, (id: mongoose.Types.ObjectId) => id.toString());
      (cloneDoc.interventionIds as any[]).forEach((interventionId, index) => {
        assert.strictEqual(interventionId, doc.interventionIds[index].toString());
      });
    });

    it('C64222 - Positive - Convert object id to a property of an object array', () => {
      paths = ['projects.id'];
      const cloneDoc = _.cloneDeep(doc);
      convertIdsToString(cloneDoc, paths, (id: mongoose.Types.ObjectId) => id.toString());
      (cloneDoc.projects as any[]).forEach((project, index: number) => {
        assert.strictEqual(project.id, doc.projects[index].id.toString());
      });
    });
  });
});
