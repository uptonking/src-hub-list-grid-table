const baseConfig = require('../../config/jest.base');
const pkgConfig = {
  displayName: 'react-window',
  rootDir: '../..',
  setupFilesAfterEnv: ['<rootDir>/config/setupTests.js'],
};

module.exports = {
  ...baseConfig,
  ...pkgConfig,
};
