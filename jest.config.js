const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Configure different environments for different test types
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/hooks/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.test-env.js',
        '<rootDir>/jest.setup.supabase.js',
        '<rootDir>/jest.setup.js',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      clearMocks: true,
      resetMocks: false,
      testPathIgnorePatterns: ['/node_modules/', '/.next/', '/app/api/'],
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
    {
      displayName: 'node',
      testEnvironment: 'jest-environment-node',
      testMatch: [
        '<rootDir>/app/api/**/*.test.{js,ts}',
        '<rootDir>/lib/**/*.test.{js,ts}',
        '<rootDir>/scripts/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.test-env.js',
        '<rootDir>/jest.setup.supabase.js',
        '<rootDir>/jest.setup.js',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      clearMocks: true,
      resetMocks: false,
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    },
  ],
  // Coverage configuration
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/jest.setup.js',
    '!**/next.config.js',
    '!**/postcss.config.js',
    '!**/tailwind.config.ts',
    '!**/scripts/**',
    '!**/tests/load/**',
    '!**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  // Cache configuration
  cacheDirectory: '.jest-cache',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
