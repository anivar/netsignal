module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testRegex: '(/__tests__/.*\\.(test|spec))\\.(ts|tsx|js)$',
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/lib/',
    '<rootDir>/node_modules/',
    '<rootDir>/android/build/',
    '<rootDir>/ios/build/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/NetSignalSpec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
};
