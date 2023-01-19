import { assert, expect } from 'chai';

import { DateError } from './moment.enum';
import { MomentUtils } from './momentUtils';

const dateBetween = '2010-01-04T05:06:07';

// tslint:disable:max-func-body-length
describe(`MomentUtils`, () => {
  describe(`getDate`, () => {
    describe(`Valid Dates`, () => {
      it(`Get valid date`, () => {
        const validDate = '2010-01-01T05:06:07';
        const date = MomentUtils.getUtcDate(validDate);
        assert.equal(new Date(validDate).toString(), date.toString(), `Get date doesn't return valid date`);
      });
    });
    describe(`Invalid Dates`, () => {
      const invalidDates = [
        {
          date: '2010-01-01T',
          code: DateError.INVALID_DATE_FORMAT
        },
        {
          date: '',
          code: DateError.INVALID_DATE
        },
        {
          date: undefined,
          code: DateError.INVALID_DATE
        },
        {
          date: '2010-13/01',
          code: DateError.INVALID_DATE_FORMAT
        }
      ];
      invalidDates.forEach(invalidDate => {
        it(`Get invalid date for ${invalidDate.date}`, () => {
          expect(
            () => MomentUtils.getUtcDate(invalidDate.date),
            `getDate for ${invalidDate.date} should throw and error`
          ).to.throw();
        });

        it(`Get invalid date for ${invalidDate.date}`, () => {
          try {
            MomentUtils.getUtcDate(invalidDate.date);
          } catch (error) {
            assert.isDefined(error, 'there should be at least an error');
            assert.equal(
              error.code,
              invalidDate.code,
              `Error code for ${invalidDate.date} should be ${invalidDate.code}`
            );
          }
        });
      });
    });
  });
  describe(`between`, () => {
    const firstDate = '2010-01-03T05:06:07';
    const secondDate = '2010-01-05T05:06:07';
    const dates = [
      {
        date: dateBetween, // between
        between: true
      },
      {
        date: '2010-01-01T05:06:07', // before
        between: false
      },
      {
        date: '2010-01-06T05:06:07', // after
        between: false
      }
    ];
    dates.forEach(date => {
      it(`Testing ${date.date}, between: ${firstDate} and ${secondDate}`, () => {
        assert.strictEqual(
          date.between,
          MomentUtils.between(date.date, firstDate, secondDate),
          `Date ${date.date} ${date.between ? 'should' : "shouldn't"} be between ${firstDate} and ${secondDate}`
        );
      });
    });
  });

  describe(`unix time`, () => {
    const strDate = '2020-01-16T15:50:23.000Z';
    const unixDate = 1579189823;
    it(`Testing unix time ${unixDate}`, () => {
      const date = MomentUtils.unixToDate(1579189823);
      assert.equal(date.toISOString(), strDate, `${unixDate} should return ${strDate}`);
    });

    it(`Testing unix time 2020-01-16T15:50:23.000Z`, () => {
      const date = MomentUtils.dateToUnix('2020-01-16T15:50:23.000Z');
      assert.equal(date, 1579189823, `${strDate} should return ${unixDate}`);
    });
  });

  describe(`After (gt = greater then)`, () => {
    const dates = [
      {
        firstDate: '2010-01-04T05:08:07', // after
        secondDate: '2010-01-04T05:07:07',
        expected: true,
        equal: false
      },
      {
        firstDate: '2010-01-04T05:04:07', // before
        secondDate: '2010-01-04T05:05:07',
        expected: false,
        equal: false
      },
      {
        firstDate: dateBetween, //  gte
        secondDate: dateBetween,
        expected: true,
        equal: true
      },
      {
        firstDate: dateBetween, // gt(not equal)
        secondDate: dateBetween,
        expected: false,
        equal: false
      }
    ];
    dates.forEach(date => {
      it(`Testing ${date.firstDate} ${date.expected ? 'should' : "shouldn't"} be after ${date.secondDate}`, () => {
        assert.equal(
          MomentUtils.gt(date.firstDate, date.secondDate, date.equal),
          date.expected,
          `${date.firstDate} ${date.expected ? 'should' : "shouldn't"} be after ${date.secondDate}`
        );
      });
    });
  });

  describe(`Before (lt  = lower then)`, () => {
    const dates = [
      {
        firstDate: '2010-01-04T05:08:07', // after
        secondDate: '2010-01-04T05:07:07',
        expected: false,
        equal: false
      },
      {
        firstDate: '2010-01-04T05:04:07', // before
        secondDate: '2010-01-04T05:05:07',
        expected: true,
        equal: false
      },
      {
        firstDate: dateBetween, //  lte
        secondDate: dateBetween,
        expected: true,
        equal: true
      },
      {
        firstDate: dateBetween, // lt(not equal)
        secondDate: dateBetween,
        expected: true,
        equal: true
      }
    ];
    dates.forEach(date => {
      it(`Testing ${date.firstDate} ${date.expected ? 'should' : "shouldn't"} be before ${date.secondDate}`, () => {
        assert.equal(
          MomentUtils.lt(date.firstDate, date.secondDate, date.equal),
          date.expected,
          `${date.firstDate} ${date.expected ? 'should' : "shouldn't"} be before ${date.secondDate}`
        );
      });
    });
  });
});
