const nxPreset = require('@nrwl/jest/preset').default;
const mongoShelf = require('@shelf/jest-mongodb/jest-preset');

module.exports = {
  ...nxPreset,
  ...mongoShelf,
};
