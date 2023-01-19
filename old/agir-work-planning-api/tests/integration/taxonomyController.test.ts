import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { assert, expect } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../config/constants';
import { db } from '../../src/features/database/DB';
import { TaxonomyFindOptions } from '../../src/features/taxonomies/models/taxonomyFindOptions';
import { ITaxonomyFindPaginatedOptionsProps } from '../../src/features/taxonomies/models/taxonomyFindPaginatedOptions';
import { taxonomyRepository } from '../../src/features/taxonomies/mongo/taxonomyRepository';
import { appUtils, isPaginatedResult } from '../../src/utils/utils';
import { userMocks } from '../data/userMocks';
import { requestService } from '../utils/requestService';
import { userMocker } from '../utils/userUtils';

// tslint:disable:max-func-body-length
describe('Taxonomy', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.TAXONOMIES, EndpointTypes.API);
  const taxonomyGroupWorkType = 'workType';
  let cachedTaxonomies: ITaxonomy[];

  before(async () => {
    cachedTaxonomies = await taxonomyRepository.findAll(TaxonomyFindOptions.create({ criterias: {} }).getValue());
  });

  after(async () => {
    await db()
      .models.Taxonomy.deleteMany({})
      .exec();
    await taxonomyRepository.saveBulk(cachedTaxonomies);
  });

  function getAllTaxonomies(): Promise<request.Response> {
    return requestService.get(`${apiUrl}?limit=100000`);
  }

  function updateTaxonomy(taxonomy: ITaxonomy): Promise<request.Response> {
    return requestService.put(`${apiUrl}/${taxonomy.group}/${taxonomy.code}`, { body: taxonomy });
  }

  function deleteTaxonomy(group: string, code: string): Promise<request.Response> {
    return requestService.delete(`${apiUrl}/${group}/${code}`);
  }

  function postTaxonomy(taxonomy: ITaxonomy): Promise<request.Response> {
    return requestService.post(apiUrl, { body: taxonomy });
  }

  async function getTaxonomies(options?: Partial<ITaxonomyFindPaginatedOptionsProps>): Promise<request.Response> {
    const queryOptions: ITaxonomyFindPaginatedOptionsProps = {
      criterias: {},
      limit: 10000,
      offset: 0,
      ...options
    };
    let url = apiUrl;
    const { criterias, ...query } = queryOptions;
    if (criterias) {
      if (criterias.group) {
        url = `${url}/${criterias.group}`;
      }
    }
    return requestService.get(url, {}, query);
  }

  function getTaxonomiesFromGroup(group: string): Promise<request.Response> {
    return requestService.get(`${apiUrl}/${group}`);
  }

  function createTaxonomyObject(partialTaxonomy?: Partial<ITaxonomy>): ITaxonomy {
    const taxonomy = {
      group: 'testGroup',
      code: 'testCode',
      label: {
        en: 'English',
        fr: 'Français hon! hon!'
      },
      displayOrder: 1,
      properties: {
        subProp: 'subPropValue'
      }
    };
    return Object.assign({}, taxonomy, partialTaxonomy);
  }

  describe('/taxonomies > GET', () => {
    // Positif - Une liste de taxonomies est retournée
    it('C28659 - Positive - Return a list of taxonomies ', async () => {
      const response = await getTaxonomies();
      expect(response.status).to.be.equal(HttpStatusCodes.OK);
      expect(isPaginatedResult(response.body)).to.be.equal(true);
    });

    // Positif - Si le paramètre "limit" est présent et que c'est un entier plus grand que 0, on retourne le nombre de taxonomies spécifié
    it('C28727 - Positive - If the query parameter "limit" is declared, the number of taxonomies returned is capped to the specified amount', async () => {
      const response = await getTaxonomies({ limit: 2 });
      expect(response.status).to.be.equal(HttpStatusCodes.OK);
      expect(response.body.paging.limit).to.be.equal(2);
      expect(response.body.items).to.have.length(2);
    });

    // Positif - Si le paramètre "offset" est présent et que c'est un entier plus grand que 0, on retourne les taxonomies décallée du nombre spécifié
    it('C28730 - Positive - If the query parameter "offset" is declared, the list should be shifted by the specified number', async () => {
      const responseNoOffset = await getTaxonomies({ offset: 0 });
      const responseWithOffset = await getTaxonomies({ offset: 1 });
      expect(responseWithOffset.status).to.be.equal(HttpStatusCodes.OK);
      expect(responseWithOffset.body.items[0].id).to.equal(responseNoOffset.body.items[1].id);
    });

    // Positif - Si le paramètre "orderBy" est présent, on retourne une liste des taxonomies dans l'ordre spécifié
    it('C28762 - Positive - If the query parameter "sort" is declared, the list should be sorted', async () => {
      const response = await getTaxonomies({ orderBy: '-id' });
      const items: ITaxonomy[] = response.body.items;
      const sortedArray = _.orderBy(items, 'id', ['desc']);
      expect(response.status).to.be.equal(HttpStatusCodes.OK);
      expect(items).to.deep.equal(sortedArray);
    });
  });

  describe('/taxonomies > POST - Positive', () => {
    let existingTaxonomy: ITaxonomy;

    beforeEach(async () => {
      userMocker.mock(userMocks.admin);
      existingTaxonomy = (
        await taxonomyRepository.save(
          createTaxonomyObject({
            group: TaxonomyGroup.borough,
            code: 'testCreateExistingCode'
          })
        )
      ).getValue();
    });

    afterEach(async () => {
      await taxonomyRepository.delete(
        TaxonomyFindOptions.create({
          criterias: {
            id: existingTaxonomy.id
          }
        }).getValue()
      );
      userMocker.reset();
    });

    it('Positive - Should create a taxonomy', async () => {
      const newTaxonomy = createTaxonomyObject({
        group: taxonomyGroupWorkType,
        code: 'testCreateCode'
      });

      const response = await postTaxonomy(newTaxonomy);
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.deepInclude(response.body, newTaxonomy);

      const getResponse = await getTaxonomiesFromGroup(taxonomyGroupWorkType);
      assert.strictEqual(getResponse.status, HttpStatusCodes.OK);
      const taxonomies = getResponse.body.items as ITaxonomy[];
      assert.ok(taxonomies?.length);
      const responseTaxonomy = taxonomies.find(x => x.group === newTaxonomy.group && x.code === newTaxonomy.code);
      assert.ok(responseTaxonomy);
      assert.deepInclude(responseTaxonomy, newTaxonomy);
    });

    it('Positive - Should set property isActive to true if not specified', async () => {
      const newTaxonomy = createTaxonomyObject({
        group: taxonomyGroupWorkType,
        code: 'testCreateCodeActive'
      });
      const response = await postTaxonomy(newTaxonomy);
      const body = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.deepInclude(response.body, newTaxonomy);
      assert.isFalse(newTaxonomy.hasOwnProperty('isActive'));
      assert.ok(body.hasOwnProperty('isActive'));
      assert.strictEqual(body.isActive, true);
    });

    it('Positive - Should keep the value of isActive if specified', async () => {
      const newTaxonomy = createTaxonomyObject({
        group: taxonomyGroupWorkType,
        code: 'testCreateCodeInactive',
        isActive: false
      });
      const response = await postTaxonomy(newTaxonomy);
      const body = response.body;

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      assert.deepInclude(response.body, newTaxonomy);
      assert.strictEqual(body.isActive, false);
      assert.strictEqual(body.isActive, newTaxonomy.isActive);
    });
  });

  describe('/taxonomies > POST - Negative', () => {
    let existingTaxonomy: ITaxonomy;

    beforeEach(async () => {
      userMocker.mock(userMocks.admin);
      existingTaxonomy = (
        await taxonomyRepository.save(
          createTaxonomyObject({
            group: TaxonomyGroup.borough,
            code: 'testCreateExistingCode'
          })
        )
      ).getValue();
    });

    afterEach(async () => {
      await taxonomyRepository.delete(
        TaxonomyFindOptions.create({
          criterias: {
            id: existingTaxonomy.id
          }
        }).getValue()
      );
      userMocker.reset();
    });

    [
      {
        description: 'Should not create a taxonomy if the group/code pair is not unique',
        taxonomyError: {
          group: TaxonomyGroup.borough,
          code: 'testCreateExistingCode'
        },
        httpStatusErrorCode: HttpStatusCodes.CONFLICT
      },
      {
        description: 'Should not create a taxonomy with an invalid property',
        taxonomyError: {
          group: 'a',
          code: 'a',
          invalidProperty: `test`
        },
        httpStatusErrorCode: HttpStatusCodes.BAD_REQUEST
      },
      {
        description: 'Should not create a taxonomy if the group or code contain invalid characters',
        taxonomyError: {
          group: '!',
          code: '='
        },
        httpStatusErrorCode: HttpStatusCodes.BAD_REQUEST
      },
      {
        description: 'Should not create a taxonomy if the user does not have the permisions',
        taxonomyError: {
          group: taxonomyGroupWorkType,
          code: 'testCreatePermissionsCode'
        },
        httpStatusErrorCode: HttpStatusCodes.FORBIDDEN
      },
      {
        description: 'Should not create a taxonomy that contain spaces in attribute code',
        taxonomyError: {
          group: taxonomyGroupWorkType,
          code: 'CODE WITH SPACE '
        },
        httpStatusErrorCode: HttpStatusCodes.BAD_REQUEST
      }
    ].forEach(test => {
      it(`Negative -  ${test.description}`, async () => {
        const invalidTaxo = createTaxonomyObject(test.taxonomyError);

        if (test.httpStatusErrorCode === HttpStatusCodes.FORBIDDEN) {
          userMocker.reset();
        }
        const response = await postTaxonomy(invalidTaxo);

        assert.strictEqual(response.status, test.httpStatusErrorCode);
      });
    });
  });

  describe('/taxonomies/:group > GET', () => {
    it('Positive - Return a list of taxonomies in a group', async () => {
      const response = await getTaxonomies({ criterias: { group: TaxonomyGroup.borough } });
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.ok(isPaginatedResult(response.body));

      const items: ITaxonomy[] = response.body.items;
      assert.ok(items?.length);
      const responseTaxonomy = items.filter(x => x.group === TaxonomyGroup.borough);
      assert.ok(responseTaxonomy.length === items.length);
    });

    it('Negative - Should not return taxonomies if a group is not valid', async () => {
      const response = await getTaxonomies({ criterias: { group: 'not-a-real-group' } });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });

  describe('/taxonomies/:group/:code > PUT', () => {
    let existingTaxonomy: ITaxonomy;
    const existingCode = 'MTE';

    before(async () => {
      userMocker.mock(userMocks.admin);
      existingTaxonomy = await taxonomyRepository.findOne(
        TaxonomyFindOptions.create({
          criterias: {
            code: existingCode,
            group: TaxonomyGroup.city
          }
        }).getValue()
      );
    });

    after(() => {
      userMocker.reset();
    });

    async function testSuccessfulPut(status: number, taxonomy: ITaxonomy): Promise<void> {
      const response = await updateTaxonomy(taxonomy);
      assert.strictEqual(response.status, status);
      assert.deepInclude(response.body, taxonomy);

      const getResponse = await getAllTaxonomies();
      assert.deepEqual(getResponse.status, HttpStatusCodes.OK);
      const taxonomies = getResponse.body.items as ITaxonomy[];
      assert.ok(taxonomies?.length);
      const responseTaxonomy = taxonomies.find(x => x.group === taxonomy.group && x.code === taxonomy.code);
      assert.ok(responseTaxonomy);
      assert.deepInclude(responseTaxonomy, taxonomy);
    }

    it('Negative - Should not create a taxonomy', async () => {
      const newTaxonomy = createTaxonomyObject({
        group: TaxonomyGroup.city,
        code: 'testUpsertCode'
      });

      const response = await updateTaxonomy(newTaxonomy);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('C60150  Positive - Should update a taxonomy', async () => {
      const updatedTaxonomy = _.cloneDeep(existingTaxonomy);
      updatedTaxonomy.properties.updateProp = 'newValue';

      await testSuccessfulPut(HttpStatusCodes.OK, updatedTaxonomy);
    });

    it('C60151  Negative - Should not update a taxonomy when input is invalid', async () => {
      const invalidTaxonomies = [
        createTaxonomyObject({
          group: 'a',
          code: 'a',
          invalidProperty: `test`
        } as any),
        createTaxonomyObject({
          group: '!',
          code: '='
        })
      ];
      for (const invalidTaxonomy of invalidTaxonomies) {
        const response = await updateTaxonomy(invalidTaxonomy);
        assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      }
    });
  });

  describe('/taxonomies/:group/:code > DELETE', () => {
    let existingTaxonomy: ITaxonomy;
    const existingCode = 'MR';

    before(async () => {
      userMocker.mock(userMocks.admin);
      existingTaxonomy = await taxonomyRepository.findOne(
        TaxonomyFindOptions.create({
          criterias: {
            code: existingCode,
            group: TaxonomyGroup.city
          }
        }).getValue()
      );
    });

    after(() => {
      userMocker.reset();
    });

    it('C60154  Positive - Should delete a taxonomy', async () => {
      const response = await deleteTaxonomy(existingTaxonomy.group, existingTaxonomy.code);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
    });

    it('C60155  Negative - Should not delete a taxonomy when the input is invalid', async () => {
      const response = await deleteTaxonomy('!$', '!$<asbsdf');
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it("C60156  Negative - Should not delete a taxonomy when the taxonomy doesn't exist", async () => {
      const response = await deleteTaxonomy(TaxonomyGroup.area, 'notFoundCode');
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });
});
