// ==========================================
// Disabling some linting rules is OK in test files.
// tslint:disable:max-func-body-length
// tslint:disable:cyclomatic-complexity
// tslint:disable:no-string-literal
// ==========================================
import 'reflect-metadata';

import { assert } from 'chai';

import { configs } from './../../../config/configs';
import { ConfigCache } from './configCache';

const validConfigParameterName = 'routing.caseSensitive';
const validApiDomainPathName = 'api.domainPath';
const validApiHostName = 'api.host';
const invalidConfigParameterName = 'unknown.string';

let configCache: ConfigCache;

describe(`Configuration Cache`, () => {
  let untouchedDomainPath: string;
  before('before all tests', () => {
    configCache = new ConfigCache();
    untouchedDomainPath = configs['cache'].get(validApiDomainPathName);
  });

  describe('Configuration cache', () => {
    it('Getting a known property', () => {
      const routingCaseSensitive: boolean = configs.routing.caseSensitive;
      const routineCaseSensitiveFromCache: boolean = configCache.get<boolean>(validConfigParameterName);

      assert.isDefined(routingCaseSensitive);
      assert.strictEqual(routingCaseSensitive, routineCaseSensitiveFromCache);
    });

    it('Transforming a known property', () => {
      const oldValue = configCache.get<string>(validApiHostName);

      configCache['cache'].delete(validApiHostName);

      const newValue = configCache.get<string>(validApiHostName, (rawValue: string): string => {
        return rawValue.toUpperCase();
      });

      assert.strictEqual(oldValue, oldValue.toLowerCase());
      assert.strictEqual(oldValue.toUpperCase(), newValue);
    });

    it('Transforming a known property from the configs', () => {
      const oldValue = configs['cache'].get<string>(validApiHostName);
      configs['cache']['cache'].delete(validApiHostName);

      const newValue = configs['cache'].get<string>(validApiHostName, (rawValue: string): string => {
        return rawValue.toUpperCase();
      });

      assert.strictEqual(oldValue, oldValue.toLowerCase());
      assert.strictEqual(oldValue.toUpperCase(), newValue);
    });

    it('Overriding a known property', () => {
      const isCaseSensitive: boolean = configCache.get(validConfigParameterName);

      assert.isFalse(isCaseSensitive);

      // overriding, retrieving old value
      const oldValue = configCache.set(validConfigParameterName, true);
      assert.strictEqual(oldValue, isCaseSensitive);

      // retrieving new value from overriden cache
      const comparedNewValue = configCache.get<boolean>(validConfigParameterName);

      assert.notEqual(comparedNewValue, isCaseSensitive);
      assert.strictEqual(configCache.get(validConfigParameterName), comparedNewValue);
    });

    it('Overriding a known property from the configs', () => {
      const domainPath = configs.api.domainPath;

      untouchedDomainPath = configs['cache'].get(validApiDomainPathName);
      configs['cache'].set(validApiDomainPathName, '/hello/my/name/is');

      const modifiedPath = configs.api.domainPath;

      assert.isDefined(domainPath);
      assert.strictEqual(domainPath, untouchedDomainPath);
      assert.notStrictEqual(untouchedDomainPath, modifiedPath);
      assert.notStrictEqual(domainPath, modifiedPath);
      assert.strictEqual(modifiedPath, '/hello/my/name/is');
    });

    it(`Overriding non existing config is ok, but won't be accessible via the typed configs object!`, () => {
      configCache.set('some.new.config.param', 'some.bogus.value');
      const val = configCache.get('some.new.config.param');
      assert.deepEqual('some.bogus.value', val);
    });

    it('Getting an unknown property throws error', () => {
      let hasThrown = false;
      const invalidParameter: string = undefined;

      try {
        configCache.get(invalidConfigParameterName);
      } catch (error) {
        hasThrown = true;
      }

      assert.isUndefined(invalidParameter);
      assert.isTrue(hasThrown);
    });

    it('Setting undefined as the value of a cache element removes it.', () => {
      const originalValue = configs.api.domainPath;
      assert.isOk(originalValue);

      const oldValue = configs['cache'].set(validApiDomainPathName, 'titi');
      assert.deepEqual(oldValue, originalValue);

      let value = configs['cache'].get(validApiDomainPathName);
      assert.deepEqual(value, 'titi');

      configs['cache'].set(validApiDomainPathName, undefined);
      value = configs['cache'].get(validApiDomainPathName);
      assert.deepEqual(value, untouchedDomainPath);
    });

    it('Dynamic configuration.', () => {
      const cache = new ConfigCache();
      let nbr = 0;
      cache.dynamic<string>('et.name', () => {
        nbr++;
        return 'Stromgol' + nbr;
      });

      let config = cache.get('et.name');
      assert.deepEqual('Stromgol1', config);

      config = cache.get('et.name');
      assert.deepEqual('Stromgol1', config);

      config = cache.set('et.name', 'Alien');
      assert.deepEqual('Stromgol1', config);

      config = cache.get('et.name');
      assert.deepEqual('Alien', config);
    });
  });
});
