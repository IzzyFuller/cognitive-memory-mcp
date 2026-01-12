export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    '*.js',
    '!test.js',
    '!jest.config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};