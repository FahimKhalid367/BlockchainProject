// jest.config.js

module.exports = {
    testEnvironment: 'node', // Suitable for backend testing
    testMatch: ['**/*.test.js'], // Match all test files ending in .test.js
    verbose: true, // Show detailed test output
    transform: {}, // Avoid transform errors if not using Babel/TS
  };
  