// ==========================================
// App Utils functions unit tests
// ==========================================

import { assert } from 'chai';
import { appUtils } from '../../src/utils/utils';

describe("App's utilities functions", () => {
  // ==========================================
  // getReadmeHtml()
  // ==========================================
  describe('getReadmeHtml()', () => {
    it('Returns the README.md file as HTML', () => {
      const result: string = appUtils.getReadmeHtml();
      assert.isNotNull(result);
      assert.isTrue(result.indexOf('<code>') > -1);
    });
  });
});
