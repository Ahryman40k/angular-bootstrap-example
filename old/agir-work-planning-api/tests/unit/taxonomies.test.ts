import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { createSandbox } from 'sinon';

import { taxonomyRepository } from '../../src/features/taxonomies/mongo/taxonomyRepository';
import { taxonomyService } from '../../src/features/taxonomies/taxonomyService';
import {
  allTaxonomies,
  codes,
  createTaxonomiesMap,
  groups,
  otherTaxonomies,
  particularGroups,
  randomCode,
  randomGroup
} from '../data/taxonomyData';

const sandbox = createSandbox();

describe('Taxonomies - Units', () => {
  beforeEach(() => {
    const taxonomiesMap = Promise.resolve(createTaxonomiesMap());
    sandbox.stub(taxonomyService, 'getTaxonomiesMapFromCache' as any).returns(taxonomiesMap);
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('taxonomyService service', () => {
    it('should get all taxnomies ', async () => {
      const taxonomies = await taxonomyService.all();
      assert.equal(taxonomies.length, allTaxonomies.length);
      assert.isTrue(groups.every(group => taxonomies.filter(x => x.group === group).length === codes.length));
    });

    it('should get taxonomies by group', async () => {
      const group = randomGroup();
      const taxonomies = await taxonomyService.getGroup(group);
      assert.equal(taxonomies.length, codes.length);
      assert.isTrue(taxonomies.every(el => el.group === group));
    });

    it('should get taxonomies by groups', async () => {
      const taxonomies = await taxonomyService.getGroups(particularGroups);
      assert.isTrue(taxonomies.length === codes.length * particularGroups.length);
      assert.isTrue(particularGroups.every(group => taxonomies.filter(x => x.group === group).length === codes.length));
    });

    it('should get taxonomy by group & code', async () => {
      const group = randomGroup();
      const code = randomCode();
      const res = await taxonomyService.getTaxonomy(group, code);
      assert.equal(res.code, code);
      assert.equal(res.group, group);
    });

    it('should get translation for a taxonomy', async () => {
      const group = randomGroup();
      const code = randomCode();
      const res = await taxonomyService.translate(group, code);
      assert.equal(res, code + group);
    });

    it('should get taxonomy by group & properties', async () => {
      const group = randomGroup();
      const res = await taxonomyService.getGroupAndProperty(group, 'category', 'category');
      assert.equal(res.length, codes.length);
      assert.isTrue(res.every(el => el.properties.category === 'category'));
    });

    it('should refresh cache', async () => {
      // restore getTaxonomiesMapFromCache
      sandbox.restore();
      // stub repository to return new Values
      sandbox.stub(taxonomyRepository, 'findAll').resolves(otherTaxonomies);
      sandbox.stub(taxonomyService, 'shouldRefresh' as any).returns(true);
      // assert that we have new values
      const res = await taxonomyService.all();
      assert.equal(res.length, otherTaxonomies.length);
      // all otherTaxonomies have group TaxonomyGroup.assetType
      assert.isTrue(res.every(el => el.group === TaxonomyGroup.assetType));
    });
  });
});
