import { assert } from 'chai';
// import * as mongoose from 'mongoose';
// import { getObjective } from '../../src/features/programBooks/tests/objectiveTestHelper';
// import { getProgramBookProps } from '../../src/features/programBooks/tests/programBookTestHelper';

describe.skip('Test objective existence in a program book', () => {
  // let mockEnrichedObjectives = [getObjective()]
  // let mockEnrichedprogramBook = getProgramBookProps()

  beforeEach(() => {
    // mockEnrichedObjectives = [getObjective()];
    // mockEnrichedprogramBook = getProgramBookProps({
    //   objectives: mockEnrichedObjectives
    // });
  });

  it.skip('Positive - Should accept existing objective in a program book', () => {
    let isThrows = false;
    try {
      // await programBookController.assertGetProgramBookObjective(mockEnrichedprogramBook, mockEnrichedObjectives[0].id);
    } catch (e) {
      isThrows = true;
    }
    assert.equal(isThrows, false);
  });

  it.skip('Negative - Should reject non existing objective in a program book', () => {
    try {
      // await programBookController.assertGetProgramBookObjective(
      //   mockEnrichedprogramBook,
      //   mongoose.Types.ObjectId().toHexString()
      // );
    } catch (e) {
      assert.equal(e.message, "Objective id doesn't exist");
    }
  });
});
